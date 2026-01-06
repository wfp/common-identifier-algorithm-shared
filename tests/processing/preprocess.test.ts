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

import { describe, test, expect } from 'vitest';

import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { preprocessFile, processFile } from '@/processing';
import { SUPPORTED_VALIDATORS } from '@/validation/Validation';

import type { Config } from '@/config/Config';

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
};

describe("processing::pre", () => {
    test('okay', async () => {
    const filePath = join(__dirname, 'files', 'input_ok.csv');
    const results = await preprocessFile({
      config: CONFIG,
      inputFilePath: filePath,
      limit: 10,
    });

    expect(results.document.data[0]).toEqual({ col_a: 'A0', col_b: 'B0' });
    expect(results.isValid).toEqual(true);
    expect(results.isMappingDocument).toEqual(false);
    expect(results.inputFilePath).toEqual(filePath);
    expect(results.errorFilePath).toEqual(undefined);
  });

  test('invalid input', async () => {
    const fn = async () =>
      await processFile({
        config: CONFIG,
        inputFilePath: '',
        outputPath: '',
        // @ts-expect-error format only accepts SUPPORTED_FILE_TYPES
        format: null,
        limit: 10,
      });
    await expect(fn).rejects.toThrow();
  });

  test('with limit', async () => {
    const filePath = join(__dirname, 'files', 'input_ok.csv');
    let results = await preprocessFile({
      config: CONFIG,
      inputFilePath: filePath,
      limit: 1,
    });

    expect(results.document.data.length).toEqual(1);

    results = await preprocessFile({ config: CONFIG, inputFilePath: filePath });
    expect(results.document.data.length).toEqual(2);
  });

  test('with mapping file input', async () => {
    const filePath = join(__dirname, 'files', 'input_mapping_ok.csv');
    const results = await preprocessFile({
      config: CONFIG,
      inputFilePath: filePath,
      limit: 10,
    });

    expect(results.document.data[0]).toEqual({ col_a: 'A0' });

    expect(results.isValid).toEqual(true);
    expect(results.isMappingDocument).toEqual(true);
    expect(results.inputFilePath).toEqual(filePath);
    expect(results.errorFilePath).toEqual(undefined);
  });

  test('with invalid mapping file', async () => {
    const filePath = join(__dirname, 'files', 'input_mapping_ok.csv');

    const newConfig = JSON.parse(JSON.stringify(CONFIG));
    newConfig.validations.col_a.push({ op: 'options', value: ['NO', 'WAY'] });

    const results = await preprocessFile({
      config: newConfig,
      inputFilePath: filePath,
      limit: 10,
    });

    expect(results.isMappingDocument).toEqual(true);
    expect(results.isValid).toEqual(false);
  });

  test('with validation errors', async () => {
    const filePath = join(__dirname, 'files', 'input_invalid.csv');

    const results = await preprocessFile({
      config: CONFIG,
      inputFilePath: filePath,
      limit: 10,
    });

    expect(results.isMappingDocument).toEqual(false);
    expect(results.document.data[0]).toEqual({
      col_a: 'A0',
      col_b: 'B0',
      errors: '',
      row_number: 2,
    });
    expect(results.document.data[1]).toEqual({
      col_a: 'A1 TOO LONG',
      col_b: 'B1',
      errors: 'A must be shorter than 2 characters;',
      row_number: 3,
    });

    expect(results.isValid).toEqual(false);

    const errorFile = results.errorFilePath;
    expect(errorFile).not.toEqual(undefined);
    expect(existsSync(errorFile as string)).toEqual(true);
  });
});