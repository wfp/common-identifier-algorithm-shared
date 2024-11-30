/*
 * This file is part of Building Blocks CommonID Tool
 * Copyright (c) 2024 WFP
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import { statSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../../src/config/loadConfig.js';
import { generateConfigHash } from '../../src/config/generateConfigHash.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGION = 'ANY';
const FILES_PATH = join(__dirname, 'files');

test('loadConfig ok', () => {
  const TEST_FILE_PATH = join(FILES_PATH, 'test-config.json');
  const loadResult = loadConfig(TEST_FILE_PATH, REGION);

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
  const loadResult = loadConfig(TEST_FILE_PATH, REGION);

  expect(loadResult.success).toEqual(false);
  if (loadResult.success) throw new TypeError();
  expect(typeof loadResult.error).toEqual('string');
});

test('loadConfig salt', () => {
  const SALT_FILE_PATH = join(FILES_PATH, 'test.salt');
  const TEST_FILE_PATH = join(tmpdir(), 'salt-config.json');
  const cfg = JSON.parse(readFileSync(join(FILES_PATH, 'test-salt-loading-config.json'), 'utf-8'));

  cfg.algorithm.salt.value.darwin = SALT_FILE_PATH;
  cfg.algorithm.salt.value.win32 = SALT_FILE_PATH;
  cfg.algorithm.salt.value.linux = SALT_FILE_PATH;
  cfg.meta.signature = generateConfigHash(cfg);

  writeFileSync(TEST_FILE_PATH, JSON.stringify(cfg), 'utf-8');

  const loadResult = loadConfig(TEST_FILE_PATH, REGION);
  console.log(loadResult);

  expect(loadResult.success).toEqual(true);
  if (!loadResult.success) throw new TypeError();
  const config = loadResult.config;
  expect(config.algorithm.salt.source).toEqual('STRING');
  expect(config.algorithm.salt.value).toEqual(readFileSync(SALT_FILE_PATH, 'utf-8'));
});

test('loadConfig salt error', () => {
  const SALT_FILE_PATH = 'INVALID SALT PATH';
  const TEST_FILE_PATH = join(tmpdir(), 'salt-config.json');
  const cfg = JSON.parse(readFileSync(join(FILES_PATH, 'test-salt-loading-config.json'), 'utf-8'));

  cfg.algorithm.salt.value.darwin = SALT_FILE_PATH;
  cfg.algorithm.salt.value.win32 = SALT_FILE_PATH;
  cfg.meta.signature = generateConfigHash(cfg);

  writeFileSync(TEST_FILE_PATH, JSON.stringify(cfg), 'utf-8');

  const loadResult = loadConfig(TEST_FILE_PATH, REGION);

  expect(loadResult.success).toEqual(false);
});
