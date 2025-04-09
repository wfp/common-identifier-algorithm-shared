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
  value: number | string;
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
