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
    alias: string; // TODOL: make alias optional for programmatic usage
    default?: string | number | string[] | number[];
  }
  export interface ColumnMap {
    columns: Column[];
    prefix?: string;
    postfix?: string;
  }
  export interface AlgorithmColumns {
    process: string[];
    static: string[];
    reference: string[];
  }
  export type StringBasedSalt = { source: 'STRING'; value: string };
  export type FileBasedSalt =   { source: 'FILE'; value: string; validator_regex?: string };
  export type CryptoPinentryMode = 'default' | 'loopback';
  export interface CoreConfiguration {
    meta: { id: string }
    source: ColumnMap;
    validations?: { [key: string]: ValidationRule[] };
    algorithm: {
      columns: AlgorithmColumns;
      hash: {
        strategy: 'SHA256';
      };
      salt: StringBasedSalt | FileBasedSalt;
    };
    post_processing?: {
      encryption?: {
        recipient: string;
        gpgBinaryPath?: string;
      }
    }
  }
  export interface FileConfiguration extends CoreConfiguration {
    isBackup?: boolean;
    meta: {
      id: string;
      version: string;
      signature: string;
    }
    // messages relevant for UI only so defining as optional here.
    // TODO: messages are not relevant for file-based usage without the UI, factor them out to a UIConfig type.
    messages?: {
      terms_and_conditions: string;
      error_in_config: string;
      error_in_salt: string;
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
