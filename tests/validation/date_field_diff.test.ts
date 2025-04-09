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
import { SUPPORTED_VALIDATORS } from '../../src/validation/Validation';
import { DateFieldDiffValidator } from '../../src/validation/validators/date_field_diff';

let TEST_SHEET_PARAMS: any = {
  row: { col_a: '19910101' },
  sheet: { name: '', data: [] },
  column: '',
};

test('DateFieldDiffValidator', () => {
  const v = new DateFieldDiffValidator({ op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, target: 'col_a', value: '-3M:0M' });

  expect(v.validate('19910102', TEST_SHEET_PARAMS)).toEqual({
    ok: false,
    kind: 'date_field_diff',
    message: 'must be within -3 months and col_a',
  });
  expect(v.validate('19910202', TEST_SHEET_PARAMS)).toEqual({
    ok: false,
    kind: 'date_field_diff',
    message: 'must be within -3 months and col_a',
  });

  // the other side of the edge => valid
  expect(v.validate('19901201', TEST_SHEET_PARAMS)).toEqual({
    ok: true,
    kind: 'date_field_diff',
  });
  expect(v.validate('19901001', TEST_SHEET_PARAMS)).toEqual({
    ok: true,
    kind: 'date_field_diff',
  });
  expect(v.validate('19920406', TEST_SHEET_PARAMS)).toEqual({
    ok: false,
    kind: 'date_field_diff',
    message: 'must be within -3 months and col_a',
  });
});

test('DateFieldDiffValidator::positive', () => {
  TEST_SHEET_PARAMS.row.col_a = '20241001';
  const v = new DateFieldDiffValidator({
    op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF,
    target: 'col_a',
    value: ':+12M',
  });
  expect(v.validate('20241101', TEST_SHEET_PARAMS)).toEqual({
    ok: true,
    kind: 'date_field_diff',
  });
  expect(v.validate('20251001', TEST_SHEET_PARAMS)).toEqual({
    ok: true,
    kind: 'date_field_diff',
  });
  expect(v.validate('20240930', TEST_SHEET_PARAMS)).toEqual({
    ok: false,
    kind: 'date_field_diff',
    message: 'must be within col_a and 12 months',
  });
});

test('DateFieldDiffValidator fails for invalid values', () => {
  const v = new DateFieldDiffValidator({
    op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF,
    target: 'col_a',
    value: '-3M:0M',
  });

  expect(v.validate(123, TEST_SHEET_PARAMS)).toEqual({
    ok: false,
    kind: 'date_field_diff',
    message: 'must be a date',
  });

  TEST_SHEET_PARAMS.row.col_a = {};
  expect(v.validate('19910101', TEST_SHEET_PARAMS)).toEqual({
    ok: false,
    kind: 'date_field_diff',
    message: "target column 'col_a' must be a date",
  });

  TEST_SHEET_PARAMS.row.col_a = '';
  expect(v.validate('19910101', TEST_SHEET_PARAMS)).toEqual({
    ok: false,
    kind: 'date_field_diff',
    message: "target column 'col_a' is empty",
  });

  TEST_SHEET_PARAMS.row.col_a = '1991/12/21';
  expect(v.validate('19910101', TEST_SHEET_PARAMS)).toEqual({
    ok: false,
    kind: 'date_field_diff',
    message: "target column 'col_a' must be a date",
  });
});

test('DateFieldDiffValidator fails for invalid options', () => {
  // @ts-expect-error
  expect(() => new DateFieldDiffValidator({})).toThrow();
  // @ts-expect-error
  expect(() => new DateFieldDiffValidator({ op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, value: 123 })).toThrow();
  // @ts-expect-error
  expect(() => new DateFieldDiffValidator({ op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, value: '[[[' })).toThrow();
  // @ts-expect-error
  expect(() => new DateFieldDiffValidator({ op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF,  target: 'col_a', value: 123 })).toThrow();
  
  expect(() => new DateFieldDiffValidator({ op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, target: 'col_a', value: '' })).toThrow();
});
