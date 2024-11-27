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

import { join, dirname } from 'node:path';
import { existsSync, unlinkSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { read, utils } from 'xlsx';
import { makeXlsxEncoder } from '../../src/encoding/xlsx.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEST_MAPPING = {
  postfix: '_POSTFIX',
  columns: [
    { name: 'A', alias: 'col_a' },
    { name: 'B', alias: 'col_b' },
  ],
};

const TEST_DOC = {
  name: 'sheet1',
  data: [
    { col_a: 'A0', col_b: 'B0' },
    { col_a: 'A1', col_b: 'B1' },
  ],
};

test('makeXlsxEncoder creation', () => {
  const e = makeXlsxEncoder(TEST_MAPPING);

  const test_output_path = join(__dirname, 'xlsx_encoder_test');
  const test_output_path_postfixed = join(
    __dirname,
    'xlsx_encoder_test_POSTFIX.xlsx',
  );

  if (existsSync(test_output_path_postfixed)) {
    unlinkSync(test_output_path_postfixed);
  }

  e.encodeDocument(TEST_DOC, test_output_path);

  let data = readFileSync(test_output_path_postfixed);
  let workbook = read(data);

  expect(workbook.SheetNames.length).toEqual(1);

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const decodedData = utils.sheet_to_json(worksheet, {
    // ensure that all data is retrieved as formatted strings, not raw data
    // (necessary for ID numbers with too many bits, that are not
    // representable by JS numbers)
    raw: false,
  });

  expect(decodedData).toEqual([
    { A: 'A0', B: 'B0' },
    { A: 'A1', B: 'B1' },
  ]);

  if (existsSync(test_output_path_postfixed)) {
    unlinkSync(test_output_path_postfixed);
  }
});

test('XlsxEncoder::must start document before writing or ending', () => {
  const e = makeXlsxEncoder(TEST_MAPPING);

  expect(() => e.writeDocument(TEST_DOC)).toThrow();
  expect(e.endDocument()).toBe(undefined);
});
