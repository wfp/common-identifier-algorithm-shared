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

import { tmpdir } from 'node:os';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

import { processFile } from '../../src/processing';
import { BaseHasher } from '../../src/hashing/base';
import { SUPPORTED_FILE_TYPES } from '../../src/document';
import { extractAlgoColumnsFromObject } from '../../src/hashing/utils';
import { SUPPORTED_VALIDATORS, type Validator } from '../../src/validation/Validation';

import type { Config } from '../../src/config/Config';
import type { makeHasherFunction } from '../../src/hashing/base';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONFIG: Config.FileConfiguration = {
  meta: { id: '', version: '', signature: '' },
  source: {
    columns: [
      { name: 'A', alias: 'col_a' },
      { name: 'B', alias: 'col_b' },
    ],
  },
  algorithm: {
    hash: { strategy: 'SHA256' },
    salt: { source: 'STRING', value: 'TEST' },
    columns: {
      static: ['col_a'],
      process: [],
      reference: [],
    },
  },
  validations: {
    col_a: [{ op: SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH, value: 2 }],
  },
  destination: {
    columns: [
      { name: 'A', alias: 'col_a' },
      { name: 'Test', alias: 'test' },
    ],
    postfix: '_OUTPUT',
  },
  destination_errors: {
    columns: [
      { name: 'Errors', alias: 'errors' },
      { name: 'A', alias: 'col_a' },
    ],
    postfix: '_ERRORS',
  },
  destination_map: {
    columns: [
      { name: 'A', alias: 'col_a' },
      { name: 'Test', alias: 'test' },
    ],
    postfix: '_MAPPING',
  },
  post_processing: {
    encryption: {
      key_path: ""
    }
  }
};


test('postprocessFile', async () => {
  // TODO
})