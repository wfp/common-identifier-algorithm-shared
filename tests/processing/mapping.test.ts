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

import type { Config } from '../../src/config/Config';
import type { CidDocument } from '../../src/document';
import { mapRequiredColumns, isMappingOnlyDocument } from '../../src/processing/mapping';

test('mapping::mapRequiredColumns', () => {
  expect(
    mapRequiredColumns({ process: [], static: [], reference: [] }, { columns: [] }, { columns: [] }),
  ).toEqual([]);

  expect(
    mapRequiredColumns(
      {
        process: ['first_name', 'last_name', 'father_first_name', 'father_last_name', 'mother_first_name'],
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
    process: [],
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
    process: [],
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
    process: [],
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
