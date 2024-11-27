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

import { DecoderBase } from '../../decoding/base.js';

const BASE_CFG = {
  columns: [
    { name: 'A', alias: 'col_a' },
    { name: 'B', alias: 'col_b', default: 'B_DEFAULT' },
  ],
};

const TEST_DATA = [
  ['A', 'B', 'C'],
  ['A0', 'B0', 'C0'],
  ['A1', 'B1', 'C1'],
  ['A2', undefined, 'C2'],
  [undefined, 'B3', 'C3'],
];

const TEST_DATA_OUT = [
  { col_a: 'A0', col_b: 'B0' },
  { col_a: 'A1', col_b: 'B1' },
  { col_a: 'A2', col_b: 'B_DEFAULT' },
  { col_b: 'B3' },
];

function makeDecoderBase(cfg = BASE_CFG) {
  class TestDecoder extends DecoderBase {
    constructor() {
      super(cfg);
    }
  }
  return new TestDecoder();
}

test('Decoderbase::sheetFromRawData', () => {
  const d = makeDecoderBase();
  const s = d.documentFromRawData('path', TEST_DATA);
  expect(s.data).toEqual(TEST_DATA_OUT);
});

test('Decoderbase::mapColumnNamesToIds', () => {
  const d = makeDecoderBase();

  expect(d.mapColumnNamesToIds(['A', 'B', 'C'])).toEqual([
    'col_a',
    'col_b',
    'C',
  ]);
});

test('Decoderbase::convertSheetRowsToObjects', () => {
  const d = makeDecoderBase();
  expect(d.convertSheetRowsToObjects([])).toEqual([]);
  expect(d.convertSheetRowsToObjects([['A', 'B', 'C']])).toEqual([]);

  expect(d.convertSheetRowsToObjects(TEST_DATA)).toEqual(TEST_DATA_OUT);
});
