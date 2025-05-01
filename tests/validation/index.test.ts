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

import {
  makeValidatorListDict,
  validateDocumentWithListDict,
  makeValidationResultDocument,
} from '../../src/validation/index';
import { OptionsValidator } from '../../src/validation/validators/options';
import { SUPPORTED_VALIDATORS } from '../../src/validation/Validation';

import type { Config } from '../../src/config/Config';
import type { Validated } from '../../src/validation/Validation';
import type { CidDocument } from '../../src/document';

// get the class name
const className = (obj: object) => obj.constructor.name;

test('makeValidatorListDict types', () => {
  const TEST_CONFIG: Config.CoreConfiguration['validations'] = {
    col_a: [
      { op: SUPPORTED_VALIDATORS.DATE_DIFF, value: ':3M' },
      { op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, target: 'col_b', value: ':1M' },
      { op: SUPPORTED_VALIDATORS.FIELD_TYPE, value: 'string' },
      { op: SUPPORTED_VALIDATORS.LANGUAGE_CHECK, value: 'arabic' },
      { op: SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH, value: 10 },
      { op: SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH, value: 1 },
      { op: SUPPORTED_VALIDATORS.MAX_VALUE, value: 1000 },
      { op: SUPPORTED_VALIDATORS.MIN_VALUE, value: -1000 },
      { op: SUPPORTED_VALIDATORS.OPTIONS, value: ['A', 'A0'] },
      { op: SUPPORTED_VALIDATORS.REGEX_MATCH, value: 'B[0-9]*' },
      { op: SUPPORTED_VALIDATORS.LINKED_FIELD, target: 'col_b' },
      { op: SUPPORTED_VALIDATORS.SAME_VALUE_FOR_ALL_ROWS },
    ],
  };

  const d = makeValidatorListDict(TEST_CONFIG);
  const v = d.col_a;

  [
    'DateDiffValidator',
    'DateFieldDiffValidator',
    'FieldTypeValidator',
    'LanguageCheckValidator',
    'MaxFieldLengthValidator',
    'MinFieldLengthValidator',
    'MaxValueValidator',
    'MinValueValidator',
    'OptionsValidator',
    'RegexpValidator',
    'LinkedFieldValidator',
    'SameValueForAllRowsValidator',
  ].forEach((name, i) => {
    expect(className(v[i])).toEqual(name);
  });
});

test('makeValidatorListDict columns', () => {
  const TEST_CONFIG: Config.CoreConfiguration["validations"] = {
    '*': [{ op: SUPPORTED_VALIDATORS.OPTIONS, value: ['A', 'A0'] }],
    col_a: [],
    col_b: [],
  };

  const d = makeValidatorListDict(TEST_CONFIG);

  expect(d.col_a.length).toEqual(1);
  expect(d.col_b.length).toEqual(1);

  expect(className(d.col_a[0])).toEqual('OptionsValidator');
  expect(className(d.col_b[0])).toEqual('OptionsValidator');
});

////////////////////////////////////////////////////////////////////////////////

test('validateDocumentWithListDict OK', () => {
  const VALIDATOR_DICT = {
    col_a: [new OptionsValidator({ op: SUPPORTED_VALIDATORS.OPTIONS, value: ['A', 'A0'] })],
    col_b: [new OptionsValidator({ op: SUPPORTED_VALIDATORS.OPTIONS, value: ['B', 'B0'] })],
  };

  const TEST_DOC_OK: CidDocument = {
    name: '',
    data: [
      { col_a: 'A0', col_b: 'B0' },
      { col_a: 'A', col_b: 'B' },
    ],
  };

  const res = validateDocumentWithListDict(VALIDATOR_DICT, TEST_DOC_OK);

  expect(res.ok).toEqual(true);
  expect(res.results.length).toEqual(2);

  res.results.forEach((result, rowIdx) => {
    expect(result.ok).toEqual(true);
    expect(result.row).toEqual(TEST_DOC_OK.data[rowIdx]);
  });
});

test('validateDocumentWithListDict ERROR', () => {
  const VALIDATOR_DICT = {
    col_a: [new OptionsValidator({ op: SUPPORTED_VALIDATORS.OPTIONS, value: ['A', 'A0'] })],
    col_b: [new OptionsValidator({ op: SUPPORTED_VALIDATORS.OPTIONS, value: ['B', 'B0'] })],
  };

  const TEST_DOC_OK = {
    name: 'Sheet 2',
    data: [
      { col_a: 'A1', col_b: 'B1' },
      { col_a: 'A0', col_b: 'B0' },
    ],
  };

  const res = validateDocumentWithListDict(VALIDATOR_DICT, TEST_DOC_OK);

  expect(res.ok).toEqual(false);
  expect(res.results.length).toEqual(2);

  expect(res.results[1].ok).toEqual(true);

  const errRow = res.results[0];
  expect(errRow.ok).toEqual(false);
  expect(errRow.errors.length).toEqual(2);
  expect(errRow.errors[0].column).toEqual('col_a');
  expect(errRow.errors[1].column).toEqual('col_b');
  expect(errRow.errors[0].errors.length).toEqual(1);
  expect(errRow.errors[1].errors.length).toEqual(1);
});

////////////////////////////////////////////////////////////////////////////////

test('makeValidationResultDocument', () => {
  const TEST_CONFIG = { columns: [{ name: 'A', alias: 'col_a' }] };

  const TEST_RESULT: Validated.Document = {
    ok: true,
    results: [
      { row: { col_a: 'A0', col_b: 'B0' }, ok: true, errors: [] },
      { row: { col_a: 'A', col_b: 'B' }, ok: true, errors: [] },
    ],
  };

  const doc = makeValidationResultDocument(TEST_CONFIG, TEST_RESULT);

  expect(doc.name).toEqual('validationResult');
  expect(doc.data).toEqual([
    { errors: '', row_number: 2, col_a: 'A0', col_b: 'B0' },
    { errors: '', row_number: 3, col_a: 'A', col_b: 'B' },
  ]);
});

test('makeValidationResultDocument::error', () => {
  const TEST_CONFIG = { columns: [{ name: 'A', alias: 'col_a' }] };

  const TEST_RESULT: Validated.Document = {
    ok: false,
    results: [
      {
        row: { col_a: 'A1', col_b: 'B1' },
        ok: false,
        errors: [
          {
            column: 'col_a',
            errors: [
              {
                kind: SUPPORTED_VALIDATORS.OPTIONS,
                message: 'must be one of: "A", "A0"',
              },
            ],
          },
          {
            column: 'col_b',
            errors: [
              {
                kind: SUPPORTED_VALIDATORS.OPTIONS,
                message: 'must be one of: "B", "B0"',
              },
            ],
          },
        ],
      },
      { row: { col_a: 'A0', col_b: 'B0' }, ok: true, errors: [] },
    ],
  };

  const doc = makeValidationResultDocument(TEST_CONFIG, TEST_RESULT);
  const ERR_STR = 'A must be one of: "A", "A0";\ncol_b must be one of: "B", "B0";';

  expect(doc.name).toEqual('validationResult');
  expect(doc.data).toEqual([
    { errors: ERR_STR, row_number: 2, col_a: 'A1', col_b: 'B1' },
    { errors: '', row_number: 3, col_a: 'A0', col_b: 'B0' },
  ]);
});
