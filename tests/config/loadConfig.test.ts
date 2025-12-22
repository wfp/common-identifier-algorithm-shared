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

import { statSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig, generateConfigHash, type Config } from '../../src/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ALGORITHM_ID = 'ANY';
const FILES_PATH = join(__dirname, 'files');

test('loadConfig ok', () => {
  const TEST_FILE_PATH = join(FILES_PATH, 'test-config.json');
  const loadResult = loadConfig({ configPath: TEST_FILE_PATH, algorithmId: ALGORITHM_ID, usingUI: false });

  expect(loadResult.success).toEqual(true);
  if (!loadResult.success) throw new TypeError();
  expect(loadResult.lastUpdated).toEqual(new Date(statSync(TEST_FILE_PATH).mtime));

  const expected = JSON.parse(readFileSync(TEST_FILE_PATH, 'utf-8'));
  // check that the columns are actually sorted alphabetically.
  expected.algorithm.columns.process = ['col_a', 'col_b', 'col_c', 'col_d', 'col_e'];
  expected.algorithm.columns.reference = ['col_1', 'col_2', 'col_3'];
  expect(loadResult.config).toEqual(expected);
});

test('loadConfig invalid', () => {
  const TEST_FILE_PATH = join(FILES_PATH, 'test-appconfig.json');
  expect(() => loadConfig({ configPath: TEST_FILE_PATH, algorithmId: ALGORITHM_ID, usingUI: false })).toThrow();
});

test('loadConfig salt', () => {
  const SALT_FILE_PATH = join(FILES_PATH, 'test.salt');
  const TEST_FILE_PATH = join(tmpdir(), 'salt-config.json');
  const cfg = JSON.parse(readFileSync(join(FILES_PATH, 'test-salt-loading-config.json'), 'utf-8'));

  cfg.algorithm.salt.value = SALT_FILE_PATH;
  cfg.meta.signature = generateConfigHash(cfg);

  writeFileSync(TEST_FILE_PATH, JSON.stringify(cfg), 'utf-8');

  const loadResult = loadConfig({ configPath: TEST_FILE_PATH, algorithmId: ALGORITHM_ID, usingUI: false });

  expect(loadResult.success).toEqual(true);
  if (!loadResult.success) throw new TypeError();
  const expectedSalt = readFileSync(SALT_FILE_PATH, "utf-8").replace(/\r\n/g, "\n");
  const config = loadResult.config;
  expect(config.algorithm.salt.source).toEqual('STRING');
  expect(config.algorithm.salt.value).toEqual(expectedSalt);
});

test('loadConfig salt error', () => {
  const SALT_FILE_PATH = 'INVALID SALT PATH';
  const TEST_FILE_PATH = join(tmpdir(), 'salt-config.json');
  const cfg = JSON.parse(readFileSync(join(FILES_PATH, 'test-salt-loading-config.json'), 'utf-8'));

  cfg.algorithm.salt.value = SALT_FILE_PATH;
  cfg.meta.signature = generateConfigHash(cfg);

  writeFileSync(TEST_FILE_PATH, JSON.stringify(cfg), 'utf-8');

  const loadResult = loadConfig({ configPath: TEST_FILE_PATH, algorithmId: ALGORITHM_ID, usingUI: false });

  expect(loadResult.success).toEqual(false);
});

test('loadConfig embedded salt file provided', () => {
  const SALT_FILE_PATH = join(FILES_PATH, 'test.salt');
  const TEST_FILE_PATH = join(tmpdir(), 'salt-config.json');
  const cfg = JSON.parse(readFileSync(join(FILES_PATH, 'test-no-salt-config.json'), 'utf-8'));

  cfg.meta.signature = generateConfigHash(cfg);

  writeFileSync(TEST_FILE_PATH, JSON.stringify(cfg), 'utf-8');

  // without defined regexp validator
  let embeddedSalt: Config.FileBasedSalt = { source: "FILE", value: SALT_FILE_PATH }
  let loadResult = loadConfig({ configPath: TEST_FILE_PATH, algorithmId: ALGORITHM_ID, embeddedSalt, usingUI: false });
  expect(loadResult.success).toEqual(false);

  // with defined regexp validator
  embeddedSalt = { source: "FILE", value: SALT_FILE_PATH, validator_regex: "BEGIN TEST[a-z\\s]*END TEST" }
  loadResult = loadConfig({ configPath: TEST_FILE_PATH, algorithmId: ALGORITHM_ID, embeddedSalt, usingUI: false });
  expect(loadResult.success).toEqual(true);
});

test('loadConfig embedded salt value provided', () => {
  const TEST_FILE_PATH = join(tmpdir(), 'salt-config.json');
  const cfg = JSON.parse(readFileSync(join(FILES_PATH, 'test-no-salt-config.json'), 'utf-8'));

  cfg.meta.signature = generateConfigHash(cfg);

  writeFileSync(TEST_FILE_PATH, JSON.stringify(cfg), 'utf-8');

  let embeddedSalt: Config.StringBasedSalt = { source: "STRING", value: "SOME_SALT_VALUE" }
  let loadResult = loadConfig({ configPath: TEST_FILE_PATH, algorithmId: ALGORITHM_ID, embeddedSalt, usingUI: false });
  expect(loadResult.success).toEqual(true);
  // @ts-ignore
  expect(loadResult.config!.algorithm.salt.value).toEqual(embeddedSalt.value);
});

test('loadConfig no salt provided', () => {
  const TEST_FILE_PATH = join(tmpdir(), 'salt-config.json');
  const cfg = JSON.parse(readFileSync(join(FILES_PATH, 'test-no-salt-config.json'), 'utf-8'));

  cfg.meta.signature = generateConfigHash(cfg);

  writeFileSync(TEST_FILE_PATH, JSON.stringify(cfg), 'utf-8');

  const loadResult = loadConfig({ configPath: TEST_FILE_PATH, algorithmId: ALGORITHM_ID, usingUI: false });

  expect(loadResult.success).toEqual(false);
});