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

import { fileURLToPath } from 'node:url';
import { join, dirname } from 'path';
import { makeCsvDecoder } from '../../decoding/csv.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_CFG = {
  columns: [
    { name: 'A', alias: 'col_a' },
    { name: 'B', alias: 'col_b', default: 'B_DEFAULT' },
  ],
};

const TEST_DATA_OUT = [
  { col_a: 'A0', col_b: 'B0' },
  { col_a: 'A1', col_b: 'B1' },
  { col_a: 'A2', col_b: '' },
  { col_a: '', col_b: 'B3' },
];

test('CSVDecoder', async () => {
  const d = makeCsvDecoder(BASE_CFG);
  const decoded = d.decodeFile(join(__dirname, 'files', 'test.csv'));

  expect(decoded.data.length).toEqual(4);
  expect(decoded.data).toEqual(TEST_DATA_OUT);
});

test('CSVDecoder::test limit', async () => {
  const d = makeCsvDecoder(BASE_CFG, 2);
  const decoded = d.decodeFile(join(__dirname, 'files', 'test.csv'));

  expect(decoded.data.length).toEqual(2);
  expect(decoded.data).toEqual(TEST_DATA_OUT.slice(0, 2));
});
