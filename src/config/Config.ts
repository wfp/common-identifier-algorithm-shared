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

import type { ValidationRule } from "../validation/Validation";

export namespace Config {
  export interface Column {
    name: string;
    alias: string;
    default?: string | number | string[] | number[];
  }
  export interface ColumnMap {
    columns: Column[];
    postfix?: string;
  }
  export interface AlgorithmColumns {
    process: string[];
    static: string[];
    reference: string[];
  }
  export type StringBasedSalt = { source: 'STRING'; value: string };
  export type FileBasedSalt = {
    source: 'FILE';
    validator_regex?: string;
    value: {
      win32?: string;
      darwin?: string;
      linux?: string;
    };
  };
  export interface Options {
    isBackup?: boolean;
    meta: {
      region: string;
      version?: string;
      signature?: string;
    };
    messages?: {
      terms_and_conditions: string;
      error_in_config: string;
      error_in_salt: string;
    };
    source: ColumnMap;
    validations?: { [key: string]: ValidationRule[] };
    algorithm: {
      columns: AlgorithmColumns;
      hash: {
        strategy: 'SHA256';
      };
      salt: StringBasedSalt | FileBasedSalt;
    };
    destination: ColumnMap;
    destination_map: ColumnMap;
    destination_errors: ColumnMap;
  }
}

export interface AppConfigData {
  termsAndConditions: { [key: string]: boolean };
  window: {
    fullscreen: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
