/* ************************************************************************
*  Common Identifier Application
*  Copyright (C) 2026  World Food Programme
*  
*  This program is free software: you can redistribute it and/or modify
*  it under the terms of the GNU Affero General Public License as published by
*  the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
*  
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU Affero General Public License for more details.
*  
*  You should have received a copy of the GNU Affero General Public License
*  along with this program.  If not, see <http://www.gnu.org/licenses/>.
************************************************************************ */

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

import Debug from 'debug';
const log = Debug('cid::engine::validation::validateDocument');

// TODO: Optional -> Add extra debug logging for deeper tracing on validation if needed.

// MAIN VALIDATION
// ---------------

// Validates a single value with a list of validators.
// The row is passed to allow for cross-column checks
interface ValidateValueWithListInput {
  validatorList: Validator.Base[];
  value: any;
  inputData: Validator.InputData;
}
function validateValueWithList({ validatorList, value, inputData }: ValidateValueWithListInput): Validator.Result[] {
  const { row, document, column } = inputData;
  return validatorList.reduce((memo, validator) => {
    // check if the validator says OK
    let result = validator.validate(value, { row, document, column });
    // if failed add to the list of errors
    if (!result.ok) memo.push(result);
    return memo;
  }, [] as Validator.Result[]);
}

interface ValidateRowWithListDictInput {
  validatorListDict: Validator.FuncMap;
  row: Validator.InputData['row'];
  rowIndex: number;
  document: CidDocument;
}

export function validateRowWithListDict({ validatorListDict, row, rowIndex, document }: ValidateRowWithListDictInput): Validator.ErrorMap {
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
  const errorMap = Object.keys(row).reduce((memo, fieldName) => {
    // check if there is a validatorList for the field
    let validatorList = validatorListDict[fieldName];
    // if not skip this column
    if (!Array.isArray(validatorList)) return memo;

    let value = row[fieldName];
    const errors = memo[fieldName] = validateValueWithList({ validatorList, value, inputData: { row, document, column: fieldName }});
    memo[fieldName] = errors;
    return memo;
  }, {} as Validator.ErrorMap);
  return errorMap;
}

// VALIDATOR FACTORY
// ------------------

function makeValidator(opts: ValidationRule) {
  // check if there is an 'op' in the object
  if (typeof opts.op !== 'string') {
    log(`[ERROR] Validator configuration is missing the 'op' field: ${JSON.stringify(opts)}`);
    throw new Error(`Validator configuration is missing the 'op' field: ${JSON.stringify(opts)}`);
  }
  log(`[DEBUG] Creating validator of type '${opts.op}' with options: ${JSON.stringify(opts)}`);
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
      log(`[ERROR] Cannot find validator for type: '${opts.op}'`);
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
export function makeValidatorListDict(validationOpts: Config.CoreConfiguration['validations']) {
  if (!validationOpts) {
    log(`[INFO] No validation options provided -- skipping validation`);
    return {};
  }

  // the "*" field denotes validators targeting all fields
  // TODO: check if this covers all cases of missing "*" validators list
  const allFieldValidators = Array.isArray(validationOpts['*']) ? validationOpts['*'] : [];
  log(`[DEBUG] Found ${allFieldValidators.length} global validators to apply to all fields`);

  return Object.keys(validationOpts).reduce(
    (memo, field) => {
      // if the field is the "*" skip this bit
      if (field === '*') return memo;

      // check if the validator options are an array for the current field
      let fieldValidatorOpts = validationOpts[field];
      if (!Array.isArray(fieldValidatorOpts)) {
        log(`[ERROR] Invalid validator options for field '${field}': ${JSON.stringify(fieldValidatorOpts)}`);
        throw new Error(
          `Expected a list of validator options for the field '${field}' -- got: ${JSON.stringify(fieldValidatorOpts)}`,
        );
      }

      // construct the list of validators for the field from the current
      // and the "*" validator options
      let fullValidatorOptions = fieldValidatorOpts.concat(allFieldValidators);
      log(`[DEBUG] Field '${field}' has ${fullValidatorOptions.length} validators (including global validators)`);

      memo[field] = makeValidatorList(fullValidatorOptions);

      return memo;
    },
    {} as { [key: string]: any[] },
  );
}

//////////////////////////////////////////////////////////////////////

// Validates a full document with the pre-generated validator list dict
interface ValidateDocumentWithListDictInput {
  validatorListDict: Validator.FuncMap;
  document: CidDocument;
}
export function validateDocumentWithListDict({ validatorListDict, document }: ValidateDocumentWithListDictInput): Validated.Document {
  const t0 = Date.now();
  const totalRows = document.data.length;
  const columns = Object.keys(validatorListDict).length;

  log(`[INFO] Starting document validation: numRows=${totalRows} numColumns=${columns}`);

  let results = document.data.map((row, idx) => {
    let results = validateRowWithListDict({ validatorListDict, row, rowIndex: idx, document });

    let compactResults = Object.keys(results).reduce((memo, col) => {
      if (results[col].length > 0) memo.push({ column: col, errors: results[col] });
      return memo;
    }, [] as Validated.Column[]);

    const ok = compactResults.length === 0;

    return { row, ok, errors: compactResults };
  }) as Validated.Row[];

  const summaryOk = !results.some(res => !res.ok);
  const durationMs = Date.now() - t0;
  const failing = results.filter(r => !r.ok).length;

  log(`[INFO] Completed document validation: ok=${summaryOk} totalRows=${totalRows} failingRows=${failing} duration=${durationMs}ms`);

  return {
    ok: !results.some((res) => !res.ok),
    results,
  };
}

// Generates a document for output based on the validation results.
// sourceConfig is required to map the original column names in the error messages
interface MakeValidationResultDocumentInput {
  sourceConfig: Config.CoreConfiguration['source'];
  documentResult: Validated.Document;
}
export const makeValidationResultDocument = ({ sourceConfig, documentResult }: MakeValidationResultDocumentInput): CidDocument => {
  const fieldNameMapping = sourceConfig.columns.reduce(
    (memo, col) => Object.assign(memo, { [col.alias]: col.name }),
      {} as { [key: string]: string }
  );

  const documentData: CidDocument['data'] = documentResult.results.map((rowResult, rowIdx) => {
    const errorList = rowResult.errors.map((error) => {
      const columnHumanName = fieldNameMapping[error.column] || error.column;
      if (!fieldNameMapping[error.column]) {
        log(`[WARN] No human-readable column name found for alias '${error.column}'`);
      }
      return error.errors.map(({ message }) => `${columnHumanName} ${message};`).join('\n');
    });

    // combine with the row object
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
  const errorRows = documentData.filter((r) => r.errors.length > 0).length;
  log(`[INFO] Generated validation result document with ${errorRows} erroring rows from ${documentResult.results.length} total rows`);

  return { name: 'validationResult', data: documentData };
};
