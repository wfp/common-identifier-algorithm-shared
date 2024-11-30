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
import type { CidDocument, MappedData } from '../document.js';

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

export namespace Validation {
  export interface Data {
    row: MappedData;
    document: CidDocument;
    column: string;
  }
  export interface ColumnResult {
    column: string;
    errors: any[];
  }
  export interface RowResult {
    row: MappedData;
    ok: Boolean;
    errors: ColumnResult[];
  }
  export interface DocumentResult {
    ok: boolean;
    results: RowResult[];
  }
  export type FuncMap = { [key: string]: Validator.Base[] };
  export type ErrorMap = { [key: string]: Validator.Result[] };
}

export namespace Validator {
  export interface Base {
    kind: SUPPORTED_VALIDATORS;
    opts: Options._base;
    message: (msg?: string) => string;
    validate(value: unknown): Result;
    validate(value: unknown, data: Validation.Data): Result;
  }
  export type Result = ResultGood | ResultBad;
  export type ResultGood = { ok: true; kind: SUPPORTED_VALIDATORS };
  export type ResultBad = {
    ok: false;
    kind: SUPPORTED_VALIDATORS;
    message: string;
  };

  export namespace Options {
    export interface _base {
      op: string;
      value?: any;
      message?: string;
      target?: string;
    }
    export interface Options extends _base {
      op: 'options';
      value: Array<string | number>;
    }
    export interface RegexMatch extends _base {
      op: 'regex_match';
      value: string;
    }
    export interface FieldType extends _base {
      op: 'field_type';
      value: 'string' | 'number';
    }
    export interface LinkedField extends _base {
      op: 'linked_field';
      target: string;
    }
    export interface LanguageCheck extends _base {
      op: 'language_check';
      value: string;
    }
    export interface MaxFieldLength extends _base {
      op: 'max_field_length';
      value: number;
    }
    export interface MinFieldLength extends _base {
      op: 'min_field_length';
      value: number;
    }

    export interface MaxValue extends _base {
      op: 'max_value';
      value: number | string;
    }
    export interface MinValue extends _base {
      op: 'min_value';
      value: number;
    }
    export interface DateDiff extends _base {
      op: 'date_diff';
      value: string;
    }
    export interface DateFieldDiff extends _base {
      op: 'date_field_diff';
      target: string;
      value: string;
    }
    export interface SameValueForAllRows extends _base {
      op: 'same_value_for_all_rows';
    }
  }
}
