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
import type { CidDocument, MappedData } from '../document';
import { DATE_OPTS } from './validators/max_value';

export enum SUPPORTED_VALIDATORS {
  FIELD_NAME = 'field_name',
  FIELD_TYPE = 'field_type',
  LANGUAGE_CHECK = 'language_check',
  MIN_VALUE = 'min_value',
  MAX_VALUE = 'max_value',
  MIN_FIELD_LENGTH = 'min_field_length',
  MAX_FIELD_LENGTH = 'max_field_length',
  OPTIONS = 'options',
  ROW_MATCHES_VALUE = 'row_matches_value',
  REGEX_MATCH = 'regex_match',
  DATE_DIFF = 'date_diff',
  DATE_FIELD_DIFF = 'date_field_diff',
  SAME_VALUE_FOR_ALL_ROWS = 'same_value_for_all_rows',
  LINKED_FIELD = 'linked_field',
}

export namespace Validated {
  export interface Column { column: string; errors: any[]; }
  export interface Row { row: MappedData; ok: Boolean; errors: Column[]; }
  export interface Document { ok: boolean; results: Row[]; }
}

export namespace Validator {
  export interface Base {
    kind: SUPPORTED_VALIDATORS;
    opts: ValidationRule;
    message: (msg?: string) => string;
    validate(value: unknown): Result;
    validate(value: unknown, data: InputData): Result;
  }

  export interface InputData { row: MappedData; document: CidDocument; column: string; }

  export type Result = ResultGood | ResultBad;
  export type ResultGood = { ok: true; kind: SUPPORTED_VALIDATORS };
  export type ResultBad = {
    ok: false;
    kind: SUPPORTED_VALIDATORS;
    message: string;
  };
  export type FuncMap = { [key: string]: Validator.Base[] };
  export type ErrorMap = { [key: string]: Validator.Result[] };
}

export type ValidationRule = |
  OptionsValidatorOptions |
  RegexMatchValidatorOptions |
  FieldTypeValidatorOptions |
  LinkedFieldValidatorOptions |
  LanguageCheckValidatorOptions |
  MaxFieldLengthValidatorOptions |
  MinFieldLengthValidatorOptions |
  MaxValueValidatorOptions |
  MinValueValidatorOptions |
  DateDiffValidatorOptions |
  DateFieldDiffValidatorOptions |
  SameValueForAllRowsValidatorOptions


interface ValidationRuleOptions {
  op: SUPPORTED_VALIDATORS;
  message?: string;
}
export interface OptionsValidatorOptions extends ValidationRuleOptions {
  op: SUPPORTED_VALIDATORS.OPTIONS;
  value: Array<string | number>;
}
export interface RegexMatchValidatorOptions extends ValidationRuleOptions {
  op: SUPPORTED_VALIDATORS.REGEX_MATCH;
  value: string;
}
export interface FieldTypeValidatorOptions extends ValidationRuleOptions {
  op: SUPPORTED_VALIDATORS.FIELD_TYPE;
  value: 'string' | 'number';
}
export interface LinkedFieldValidatorOptions extends ValidationRuleOptions {
  op: SUPPORTED_VALIDATORS.LINKED_FIELD;
  target: string;
}
export interface LanguageCheckValidatorOptions extends ValidationRuleOptions {
  op: SUPPORTED_VALIDATORS.LANGUAGE_CHECK;
  value: string;
}
export interface MaxFieldLengthValidatorOptions extends ValidationRuleOptions {
  op: SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH;
  value: number;
}
export interface MinFieldLengthValidatorOptions extends ValidationRuleOptions {
  op: SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH;
  value: number;
}
export interface MaxValueValidatorOptions extends ValidationRuleOptions {
  op: SUPPORTED_VALIDATORS.MAX_VALUE;
  value: number | DATE_OPTS;
}
export interface MinValueValidatorOptions extends ValidationRuleOptions {
  op: SUPPORTED_VALIDATORS.MIN_VALUE;
  value: number;
}
export interface DateDiffValidatorOptions extends ValidationRuleOptions {
  op: SUPPORTED_VALIDATORS.DATE_DIFF;
  value: string;
}
export interface DateFieldDiffValidatorOptions extends ValidationRuleOptions {
  op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF;
  target: string;
  value: string;
}
export interface SameValueForAllRowsValidatorOptions extends ValidationRuleOptions {
  op: SUPPORTED_VALIDATORS.SAME_VALUE_FOR_ALL_ROWS;
}

// TypeGuards for validators
type ValidatorTypeGuard = (prefix: string, rule: ValidationRule, sourceColumns?: string[]) => string | undefined;

export const isOptionsValidator: ValidatorTypeGuard = (prefix, rule) => {
  if (rule.op !== SUPPORTED_VALIDATORS.OPTIONS) return `${prefix} is not a supported validation function, got ${rule.op}`;

  if (!Array.isArray(rule.value)) return `${prefix}.value must be an Array of numbers or strings, got ${typeof rule.value}`;
  else if (rule.value.length === 0) return `${prefix}.value must be an Array of numbers of strings, got empty Array`;

  for (let item of rule.value) {
    if (typeof item === 'string') {
      if (item.trim() === '') return `${prefix}.value does not support empty strings`;
    } else if (typeof item !== 'number') {
      return `${prefix}.value must be an Array of number or strings, got ${typeof item}`;
    }
  };
};

export const isRegexMatchValidator: ValidatorTypeGuard = (prefix, rule) => {
  if (rule.op !== SUPPORTED_VALIDATORS.REGEX_MATCH) return `${prefix} is not a supported validation function, got ${rule.op}`;
  if (typeof rule.value !== "string" || rule.value.length === 0) return `${prefix}.value must be a non-empty string`;
}
export const isFieldTypeValidator: ValidatorTypeGuard = (prefix, rule) => {
  if (rule.op !== SUPPORTED_VALIDATORS.FIELD_TYPE) return `${prefix} is not a supported validation function, got ${rule.op}`;
  if (typeof rule.value !== "string" || (rule.value !== "string" && rule.value !== "number")) 
    return `${prefix}.value must be either "number" or "string"`;
}
export const isLanguageCheckValidator: ValidatorTypeGuard = (prefix, rule) => {
  if (rule.op !== SUPPORTED_VALIDATORS.LANGUAGE_CHECK) return `${prefix} is not a supported validation function, got ${rule.op}`;
  if (typeof rule.value !== "string" || rule.value.length === 0) return `${prefix}.value must be a non-empty string`;
}
export const isMaxFieldLengthValidator: ValidatorTypeGuard = (prefix, rule) => {
  if (rule.op !== SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH) return `${prefix} is not a supported validation function, got ${rule.op}`;
  if (typeof rule.value !== "number") return `${prefix}.value must be a number`;
}
export const isMinFieldLengthValidator: ValidatorTypeGuard = (prefix, rule) => {
  if (rule.op !== SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH) return `${prefix} is not a supported validation function, got ${rule.op}`;
  if (typeof rule.value !== "number") return `${prefix}.value must be a number`;
}
// TODO: connect this typeguard to the DATE_OPTS enum for {{currentYear}} etc. validation
export const isMaxValueValidator: ValidatorTypeGuard = (prefix, rule) => {
  if (rule.op !== SUPPORTED_VALIDATORS.MAX_VALUE) return `${prefix} is not a supported validation function, got ${rule.op}`;
  if (typeof rule.value !== "number" && typeof rule.value !== "string") return `${prefix}.value must be a number or supported datestring`;
  if (typeof rule.value === "string" && !Object.values(DATE_OPTS).includes(rule.value as DATE_OPTS))
    return `${prefix}.value must be a number or supported datestring`
}
export const isMinValueValidator: ValidatorTypeGuard = (prefix, rule) => {
  if (rule.op !== SUPPORTED_VALIDATORS.MIN_VALUE) return `${prefix} is not a supported validation function, got ${rule.op}`;
  if (typeof rule.value !== "number") return `${prefix}.value must be a number`;
}
export const isDateDiffValidator: ValidatorTypeGuard = (prefix, rule) => {
  if (rule.op !== SUPPORTED_VALIDATORS.DATE_DIFF) return `${prefix} is not a supported validation function, got ${rule.op}`;
  if (typeof rule.value !== "string" || rule.value.length === 0) return `${prefix}.value must be a non-empty string`;
}
export const isSameValueForAllRowsValidator: ValidatorTypeGuard = (prefix, rule) => {
  if (rule.op !== SUPPORTED_VALIDATORS.SAME_VALUE_FOR_ALL_ROWS) return `${prefix} is not a supported validation function, got ${rule.op}`;
}


export const isLinkedFieldValidator: ValidatorTypeGuard = (prefix, rule, sourceColumns) => {
  if (rule.op !== SUPPORTED_VALIDATORS.LINKED_FIELD) return `${prefix} is not a supported validation function, got ${rule.op}`;
  if (typeof rule.target !== "string" || rule.target.length === 0) return `${prefix}.target must be a non-empty string`;
  if (sourceColumns && !sourceColumns.includes(rule.target)) return `${prefix} does not have a corresponding [source] column`;
}

export const isDateFieldDiffValidator: ValidatorTypeGuard = (prefix, rule, sourceColumns) => {
  if (rule.op !== SUPPORTED_VALIDATORS.DATE_FIELD_DIFF) return `${prefix} is not a supported validation function, got ${rule.op}`;
  if (typeof rule.value !== "string" || rule.value.length === 0) return `${prefix}.value must be a non-empty string`;
  if (typeof rule.target !== "string" || rule.target.length === 0) return `${prefix}.target must be a non-empty string`;
  if (sourceColumns && !sourceColumns.includes(rule.target)) return `${prefix} does not have a corresponding [source] column`;
}
