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

import type { Config } from '../../src/config/Config.js';
import { CidDocument } from '../../src/document.js';
import {
  mapRequiredColumns,
  isMappingOnlyDocument,
} from '../../src/processing/mapping.js';

test('mapping::mapRequiredColumns', () => {
  expect(
    mapRequiredColumns(
      { to_translate: [], static: [], reference: [] },
      { columns: [] },
      { columns: [] },
    ),
  ).toEqual([]);

  expect(
    mapRequiredColumns(
      {
        to_translate: [
          'first_name',
          'last_name',
          'father_first_name',
          'father_last_name',
          'mother_first_name',
        ],
        static: ['dob_year'],
        reference: ['document_type', 'document_id'],
      },
      {
        columns: [
          { name: 'A', alias: 'col_a' },
          { name: 'B', alias: 'col_b' },
          { name: 'MAPPING', alias: 'col_mapping' },
        ],
      },
      {
        columns: [
          { name: 'C', alias: 'col_c' },
          { name: 'D', alias: 'col_d' },
          { name: 'MAPPING', alias: 'col_mapping' },
        ],
      },
    ),
  ).toEqual([
    'first_name',
    'last_name',
    'father_first_name',
    'father_last_name',
    'mother_first_name',
    'dob_year',
    'document_type',
    'document_id',
    'col_mapping',
  ]);
});

test('mapping::isMappingOnlyDocument empty config', () => {
  const testSheet: CidDocument = { name: '', data: [{ A: 1, B: 2, C: 3 }] };
  let A: Config.AlgorithmColumns = {
    to_translate: [],
    static: [],
    reference: [],
  };
  let S: Config.ColumnMap = { columns: [] };
  let D: Config.ColumnMap = { columns: [] };
  expect(isMappingOnlyDocument(A, S, D, testSheet)).toEqual(false);
});

test('mapping::isMappingOnlyDocument algo columns specified only', () => {
  const testSheet: CidDocument = { name: '', data: [{ A: 1, B: 2, C: 3 }] };
  const A: Config.AlgorithmColumns = {
    to_translate: [],
    static: [],
    reference: ['A', 'B', 'C'],
  };
  const S: Config.ColumnMap = { columns: [] };
  const D: Config.ColumnMap = { columns: [] };
  expect(isMappingOnlyDocument(A, S, D, testSheet)).toEqual(true);
});

test('mapping::isMappingOnlyDocument src dest specified only', () => {
  const testSheet: CidDocument = { name: '', data: [{ A: 1, B: 2, C: 3 }] };
  const A: Config.AlgorithmColumns = {
    to_translate: [],
    static: [],
    reference: [],
  };
  let S: Config.ColumnMap;
  let D: Config.ColumnMap;

  // src config doesn't include all sheet columns, dest empty
  S = { columns: [{ name: 'A', alias: 'A' }] };
  D = { columns: [] };
  expect(isMappingOnlyDocument(A, S, D, testSheet)).toEqual(false);
  // src config doesn't include all sheet columns
  S = { columns: [{ name: 'A', alias: 'A' }] };
  D = { columns: [{ name: 'A', alias: 'A' }] };
  expect(isMappingOnlyDocument(A, S, D, testSheet)).toEqual(false);
  // set of config columns doesn't include all sheet columns in both configs
  S.columns = [
    { name: 'A', alias: 'A' },
    { name: 'B', alias: 'B' },
    { name: 'C', alias: 'C' },
  ];
  D.columns = [{ name: 'A', alias: 'A' }];
  expect(isMappingOnlyDocument(A, S, D, testSheet)).toEqual(false);
  // set of config columns in both configs fully includes sheet columns
  S.columns = [
    { name: 'A', alias: 'A' },
    { name: 'B', alias: 'B' },
    { name: 'C', alias: 'C' },
  ];
  D.columns = [
    { name: 'A', alias: 'A' },
    { name: 'B', alias: 'B' },
    { name: 'C', alias: 'C' },
  ];
  expect(isMappingOnlyDocument(A, S, D, testSheet)).toEqual(true);
});
