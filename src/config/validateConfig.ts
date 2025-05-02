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
import type { Config } from './Config';
import {
  SUPPORTED_VALIDATORS,
  isDateDiffValidator,
  isDateFieldDiffValidator,
  isFieldTypeValidator,
  isLanguageCheckValidator,
  isLinkedFieldValidator,
  isMaxFieldLengthValidator,
  isMaxValueValidator,
  isMinFieldLengthValidator,
  isMinValueValidator,
  isOptionsValidator,
  isRegexMatchValidator,
  isSameValueForAllRowsValidator,
} from '../validation/Validation';

type ConfigValidatorResult = string | undefined;
type ConfigValidator = (label: string, v: unknown) => ConfigValidatorResult;

const isTrue: ConfigValidator = (label: string, v: unknown) => (!v ? label : undefined);
const isFalse: ConfigValidator = (label: string, v: unknown) => (!!v ? label : undefined);
const isObject: ConfigValidator = (label: string, v: unknown) =>
  typeof v !== 'object' ? `Missing ${label}` : undefined;
const isNumber: ConfigValidator = (label: string, v: unknown) =>
  typeof v !== 'number' ? `${label} must be a number` : undefined;
const isString: ConfigValidator = (label: string, v: unknown) =>
  typeof v !== 'string' ? `${label} must be a string` : undefined;
const isNotEmptyString: ConfigValidator = (label: string, v: unknown) =>
  typeof v === 'string' && v.length === 0 ? `${label} cannot be an empty string` : undefined;
const isRegexp: ConfigValidator = (label: string, v: unknown) => {
  try {
    const _ = RegExp(v as string);
    return;
  } catch {
    return `${label} is not a valid JavaScript Regular Expression`
  }
}

const isOneOf = (label: string, vs: unknown[], v: unknown) =>
  !vs.includes(v) ? `${label} must be ${vs.join(' or ')}` : undefined;
const isOptional = (label: string, v: unknown, pred: ConfigValidator) =>
  typeof v !== 'undefined' ? pred(label, v) : undefined;

const isArrayOfStrings = (label: string, v: unknown) => {
  if (!Array.isArray(v)) return `${label} must be an array of strings`;
  if (v.some((e) => typeof e !== 'string')) return `${label} must contain only strings`;
};

const isArrayOfNumbers = (label: string, v: unknown) => {
  if (!Array.isArray(v)) return `${label} must be an array of numbers`;
  if (v.some((e) => typeof e !== 'number')) return `${label} must contain only numbers`;
};

const isArrayOfCustomType = <T>(label: string, v: unknown, pred: (c: T) => ConfigValidatorResult): ConfigValidatorResult => {
  if (!Array.isArray(v)) return `${label} must be an array`;
  const result = v.find(pred);
  if (result) return `${label}${pred(result)}`;
};

const checkMetaCore = (meta: Config.CoreConfiguration['meta'], id: string) => {
  if (typeof meta !== 'object') return `[meta] must be present`;
  if (meta.id != id) return `[meta].id is not '${id}'`;
  return (isString('[meta].id', meta.id));
};

const checkMeta = (meta: Config.FileConfiguration['meta'], id: string) => {
  if (typeof meta !== 'object') return `[meta] must be present`;
  if (meta.id != id) return `[meta].id is not '${id}'`;
  return (
    isString('[meta].id', meta.id) ||
    isString('[meta].version', meta.version) ||
    isString('[meta].signature', meta.signature)
  );
};

const checkMessages = (messages: Config.FileConfiguration['messages']) => {
  // even though messages are marked optional in the type, if using the UI they are mandatory.
  if (typeof messages !== 'object') return isObject('[messages]', messages);
  return (
    isString('[messages].error_in_config', messages.error_in_config) ||
    isString('[messages].error_in_salt', messages.error_in_salt) ||
    isString('[messages].terms_and_conditions', messages.terms_and_conditions)
  );
};

const checkColumns = (label: string, columns: Config.Column[]) => {
  return isArrayOfCustomType<Config.Column>(
    label + '.columns',
    columns,
    (c) =>
      isObject('', c) ||
      isString('.name', c.name) ||
      isString('.alias', c.alias) ||
      isOptional('.default?', c.default, isString),
  );
};

const checkSource = (source: Config.CoreConfiguration['source']) => {
  return isObject('[source]', source) || checkColumns('[source]', source.columns);
};

const checkDestination = (label: string, destination: Config.FileConfiguration['destination']) => {
  return (
    isObject(`[${label}]`, destination) ||
    isOptional(`[${label}].postfix?`, destination.postfix, isString) ||
    checkColumns(`[${label}]`, destination.columns)
  );
};

const checkValidations = (validations: Config.CoreConfiguration['validations'], sourceColumns: string[]) => {
  if (!validations) return isOptional('[validations]', validations, isObject);

  for (let key of Object.keys(validations)) {
    // check validation column is available in source
    if (!sourceColumns.includes(key)) {
      // special case for "*" which is for rules applying to all columns
      if (key !== '*') return `[validations].${key} does not have a corresponding [source] column.`;
    }

    for (let rule of validations[key]) {
      const prefix = `[validations].${key}.[${rule.op}]`;
      
      let initialValidation = 
        isObject('', rule) ||
        isString('.op', rule.op) ||
        isOptional(`${prefix}.message?`, rule.message, isString) ||
        isOptional(`${prefix}.message?`, rule.message, isNotEmptyString);
      if (initialValidation) return initialValidation;

      let check: string | undefined = undefined;
      switch (rule.op) {
        case SUPPORTED_VALIDATORS.REGEX_MATCH:              check = isRegexMatchValidator(prefix, rule); break;
        case SUPPORTED_VALIDATORS.OPTIONS:                  check = isOptionsValidator(prefix, rule); break;
        case SUPPORTED_VALIDATORS.FIELD_TYPE:               check = isFieldTypeValidator(prefix, rule); break;
        case SUPPORTED_VALIDATORS.LANGUAGE_CHECK:           check = isLanguageCheckValidator(prefix, rule); break;
        case SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH:         check = isMinFieldLengthValidator(prefix, rule); break;
        case SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH:         check = isMaxFieldLengthValidator(prefix, rule); break;
        case SUPPORTED_VALIDATORS.MIN_VALUE:                check = isMinValueValidator(prefix, rule); break;
        case SUPPORTED_VALIDATORS.MAX_VALUE:                check = isMaxValueValidator(prefix, rule); break;
        case SUPPORTED_VALIDATORS.DATE_DIFF:                check = isDateDiffValidator(prefix, rule); break;
        case SUPPORTED_VALIDATORS.SAME_VALUE_FOR_ALL_ROWS:  check = isSameValueForAllRowsValidator(prefix, rule); break;
        case SUPPORTED_VALIDATORS.LINKED_FIELD:             check = isLinkedFieldValidator(prefix, rule, sourceColumns); break;
        case SUPPORTED_VALIDATORS.DATE_FIELD_DIFF:          check = isDateFieldDiffValidator(prefix, rule, sourceColumns); break;
        default:
          // @ts-expect-error switch case fallthrough for unsupported validators
          return `[validations].${key}.[${rule.op}] is not a supported validation function`;
      }
      if (check) return check;
    }
  }
};

const checkAlgorithm = (algorithm: Config.CoreConfiguration['algorithm'], sourceColumns: string[]) => {
  let exists = isObject('[algorithm]', algorithm) || isObject('[algorithm].columns', algorithm.columns);
  if (exists) return exists;

  const colGroups = [
    { label: '[algorithm].columns.process', value: algorithm.columns.process },
    { label: '[algorithm].columns.static', value: algorithm.columns.static },
    { label: '[algorithm].columns.reference', value: algorithm.columns.reference },
  ];

  for (let cg of colGroups) {
    let check = isArrayOfStrings(cg.label, cg.value);
    if (check) return check;

    // check specified columns are included within [source]
    for (let col of cg.value) {
      if (col === '') return `${cg.label} - column entries cannot be blank.`;
      if (!sourceColumns.includes(col))
        return `${cg.label}.${col} does not have a corresponding [source] column.`;
    }
  }

  // TODO: Add support for other hashing functions
  exists =
    isObject('[algorithm].hash', algorithm.hash) ||
    isOneOf('[algorithm].hash.strategy', ['SHA256'], algorithm.hash.strategy);
  if (exists) return exists;

  exists =
    isObject('[algorithm].salt', algorithm.salt) ||
    isOneOf('[algorithm].salt.source', ['FILE', 'STRING'], algorithm.salt.source);
  if (exists) return exists;

  let check: string | undefined;
  if (algorithm.salt.source === 'STRING') {
    return (
      isString('[algorithm].salt.value', algorithm.salt.value) ||
      isNotEmptyString('[algorithm].salt.value', algorithm.salt.value)
    );
  }

  if (algorithm.salt.source === 'FILE') {
    check =
      isObject('[algorithm].salt.value', algorithm.salt.value) ||
      isOptional('[algorithm].salt.validator_regex', algorithm.salt.validator_regex, isString) ||
      isOptional('[algorithm].salt.validator_regex', algorithm.salt!.validator_regex, isRegexp) ||
      isOptional('[algorithm].salt.value.win32', algorithm.salt.value!.win32, isString) ||
      isOptional('[algorithm].salt.value.darwin', algorithm.salt.value!.darwin, isString) ||
      isOptional('[algorithm].salt.value.linux', algorithm.salt.value!.linux, isString);

    if (check) return check;

    // at least one of [win32, darwin, linux] must be provided
    if (
      Object.keys(algorithm.salt.value!).filter((v) => ['win32', 'darwin', 'linux'].includes(v)).length === 0
    ) {
      return '[algorithm].salt.value must specify at least one win32, darwin, or linux path value.';
    }
  }
};

export function validateConfigCore(config: Config.CoreConfiguration, id: string) {
  let errors: string[] = [];
  const meta = checkMetaCore(config.meta, id);
  if (meta) errors.push(meta);

  const source = checkSource(config.source);
  if (source) errors.push(source);
  const sourceColumns = config.source.columns.map((c) => c.alias);

  const validations = checkValidations(config.validations, sourceColumns);
  if (validations) errors.push(validations);

  const algorithm = checkAlgorithm(config.algorithm, sourceColumns);
  if (algorithm) errors.push(algorithm);
  return errors.length > 0 ? errors.join("\n") : undefined;
}

export function validateConfigFile(config: Config.FileConfiguration, id: string, ui: boolean=false) {
  let errors: string[] = [];
  const core = validateConfigCore(config, id);
  if (core) errors.push(core);

  const meta = checkMeta(config.meta, id);
  if (meta) errors.push(meta);

  const destination = checkDestination('destination', config.destination);
  if (destination) errors.push(destination);

  const destinationMap = checkDestination('destination_map', config.destination_map);
  if (destinationMap) errors.push(destinationMap);

  const destinationErrors = checkDestination('destination_errors', config.destination_errors);
  if (destinationErrors) errors.push(destinationErrors);

  if (ui) {
    const messages = checkMessages(config.messages);
    if (messages) errors.push(messages);
  }
 
  return errors.length > 0 ? errors.join("\n") : undefined;
}
