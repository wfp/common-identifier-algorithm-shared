// Common Identifier Application
// Copyright (C) 2024 World Food Programme

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
import {
    DateDiffValidator,
    DateFieldDiffValidator,
    FieldTypeValidator,
    LanguageCheckValidator,
    LinkedFieldValidator,
    MaxFieldLengthValidator,
    MaxValueValidator,
    MinFieldLengthValidator,
    MinValueValidator,
    OptionsValidator,
    RegexpValidator,
    SameValueForAllRowsValidator,
  } from './validators/index';
  import { SUPPORTED_VALIDATORS } from './Validation';
  import type { Validated, ValidationRule, Validator } from './Validation';
  import type { CidDocument } from '../document';
  import type { Config } from '../config/Config';
  
  // MAIN VALIDATION
  // ---------------
  
  // Validates a single value with a list of validators.
  // The row is passed to allow for cross-column checks
  function validateValueWithList(validatorList: Validator.Base[], value: any, { row, document, column }: Validator.InputData) {
    return validatorList.reduce((memo, validator) => {
      // check if the validator says OK
      let result = validator.validate(value, { row, document, column });
      // if failed add to the list of errors
      if (!result.ok) memo.push(result);
      return memo;
    }, [] as Validator.Result[]);
  }
  
  export function validateRowWithListDict(
    validatorListDict: Validator.FuncMap,
    row: Validator.InputData['row'],
    document: CidDocument,
  ): Validator.ErrorMap {
    // check if all expected columns are present
    let missingColumns = Object.keys(validatorListDict)
      .map((k) => (typeof row[k] === 'undefined' ? k : null))
      .filter((v) => v);
  
    // Fail if there are missing columns
    if (missingColumns.length > 0) {
      return missingColumns.reduce((memo, c) => {
        if (!c) return memo;
        return Object.assign(memo, {
          [c]: [{ kind: SUPPORTED_VALIDATORS.FIELD_NAME, message: 'is missing' }],
        });
      }, {});
    }
  
    // TODO: should all columns in the validatorListDict checked or base it on the row?
    return Object.keys(row).reduce((memo, fieldName) => {
      // check if there is a validatorList for the field
      let validatorList = validatorListDict[fieldName];
      // if not skip this column
      if (!Array.isArray(validatorList)) {
        return memo;
      }
  
      let fieldValue = row[fieldName];
  
      // use the validators
      memo[fieldName] = validateValueWithList(validatorList, fieldValue, {
        row,
        document,
        column: fieldName,
      });
  
      return memo;
    }, {} as Validator.ErrorMap);
  }
  
  // VALIDATOR FACTORY
  // ------------------
  
  function makeValidator(opts: ValidationRule) {
    // check if there is an 'op' in the object
    if (typeof opts.op !== 'string') {
      throw new Error(`Validator configuration is missing the 'op' field: ${JSON.stringify(opts)}`);
    }
    switch (opts.op) {
      case SUPPORTED_VALIDATORS.REGEX_MATCH: return new RegexpValidator(opts);
      case SUPPORTED_VALIDATORS.OPTIONS: return new OptionsValidator(opts);
      case SUPPORTED_VALIDATORS.FIELD_TYPE: return new FieldTypeValidator(opts);
      case SUPPORTED_VALIDATORS.LINKED_FIELD: return new LinkedFieldValidator(opts);
      case SUPPORTED_VALIDATORS.LANGUAGE_CHECK: return new LanguageCheckValidator(opts);
      case SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH: return new MinFieldLengthValidator(opts);
      case SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH: return new MaxFieldLengthValidator(opts);
      case SUPPORTED_VALIDATORS.MIN_VALUE: return new MinValueValidator(opts);
      case SUPPORTED_VALIDATORS.MAX_VALUE: return new MaxValueValidator(opts);
      case SUPPORTED_VALIDATORS.DATE_DIFF: return new DateDiffValidator(opts);
      case SUPPORTED_VALIDATORS.DATE_FIELD_DIFF: return new DateFieldDiffValidator(opts);
      case SUPPORTED_VALIDATORS.SAME_VALUE_FOR_ALL_ROWS: return new SameValueForAllRowsValidator(opts);
      default:
        // @ts-expect-error Fallthrough for unknown validator type
        throw new Error(`Cannot find validator for type: '${opts.op}'`);
    }
  }
  
  // Takes a list of validator options and creates a list of validators from it
  function makeValidatorList(optsList: ValidationRule[]) {
    return optsList.map(makeValidator);
  }
  
  // Takes a dict of <field name> => <list of validator option dicts> Dict and
  // returns a map of <field name> => <validator list>.
  //
  // This function merges the "*" field validations into each field's validator list
  export function makeValidatorListDict(validationOpts: Config.Options['validations']) {
    if (!validationOpts) return {};
  
    // the "*" field denotes validators targeting all fields
    let allFieldValidators = validationOpts['*'];
  
    // TODO: check if this covers all cases of missing "*" validators list
    if (!Array.isArray(allFieldValidators)) {
      allFieldValidators = [];
    }
  
    //
    return Object.keys(validationOpts).reduce(
      (memo, field) => {
        // if the field is the "*" skip this bit
        if (field === '*') {
          return memo;
        }
  
        // check if the validator options are an array for the current field
        let fieldValidatorOpts = validationOpts[field];
        if (!Array.isArray(fieldValidatorOpts)) {
          throw new Error(
            `Expected a list of validator options for the field '${field}' -- got: ${JSON.stringify(fieldValidatorOpts)}`,
          );
        }
  
        // construct the list of validators for the field from the current
        // and the "*" validator options
        let fullValidatorOptions = fieldValidatorOpts.concat(allFieldValidators);
        let validatorList = makeValidatorList(fullValidatorOptions);
  
        // assign it to the object
        memo[field] = validatorList;
  
        return memo;
      },
      {} as { [key: string]: any[] },
    );
  }
  
  //////////////////////////////////////////////////////////////////////
  
  // Validates a full document with the pre-generated validator list dict
  export function validateDocumentWithListDict(validatorDict: Validator.FuncMap, document: CidDocument): Validated.Document {
    let results = document.data.map((row) => {
      // do the actual validation
      let results = validateRowWithListDict(validatorDict, row, document);
      let compactResults = Object.keys(results).reduce((memo, col) => {
        let colResults = results[col];
        if (colResults.length > 0) {
          memo.push({ column: col, errors: colResults });
        }
        return memo;
      }, [] as Validated.Column[]);
      return { row, ok: compactResults.length === 0, errors: compactResults };
    }) as Validated.Row[];
    return {
      ok: !results.some((res) => !res.ok),
      results,
    };
  }
  
  // Generates a document for output based on the validation results.
  // sourceConfig is required to map the original column names in the error messages
  export const makeValidationResultDocument = (
    sourceConfig: Config.Options['source'],
    documentResult: Validated.Document,
  ): CidDocument => {
    let fieldNameMapping = sourceConfig.columns.reduce(
      (memo, col) => {
        return Object.assign(memo, { [col.alias]: col.name });
      },
      {} as { [key: string]: string },
    );
  
    const documentData: CidDocument['data'] = documentResult.results.map((rowResult, rowIdx) => {
      // build an error message
      let errorList = rowResult.errors.map((error) => {
        // find the column name
        let columnHumanName = fieldNameMapping[error.column] || error.column;
        return error.errors.map(({ message }) => `${columnHumanName} ${message};`).join('\n');
      });
  
      // combine with the row onject
      return Object.assign(
        {
          // The row number should match the row number in the input document (row index 0 is row# 2)
          row_number: rowIdx + 2,
          // The error list should be an empty string (so that it'll be hidden if no errors are present)
          // NOTE: the line-ending can be tricky
          errors: errorList.join('\n'),
        },
        rowResult.row,
      );
    });
  
    return {
      name: 'validationResult',
      data: documentData,
    };
  };
  