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
import type { Validation } from '../../src/validation/Validation.js';
import { SameValueForAllRowsValidator } from '../../src/validation/validators/same_value_for_all_rows.js';

const TEST_DOCUMENT = {
  name: 'TEST',
  data: [{ col_a: 'A', col_b: 'B' }],
};
test('SameValueForAllRowsValidator', () => {
  const v = new SameValueForAllRowsValidator({
    op: 'same_value_for_all_rows',
    value: '',
  });

  const contextA: Validation.Data = {
    document: TEST_DOCUMENT,
    column: 'col_a',
    row: [],
  };
  const contextB: Validation.Data = {
    document: TEST_DOCUMENT,
    column: 'col_b',
    row: [],
  };

  expect(v.validate('A', contextA)).toEqual({
    ok: true,
    kind: 'same_value_for_all_rows',
  });
  expect(v.validate('B', contextA)).toEqual({
    ok: false,
    kind: 'same_value_for_all_rows',
    message: 'must have identical values in the column',
  });
  expect(v.validate('A0', contextA)).toEqual({
    ok: false,
    kind: 'same_value_for_all_rows',
    message: 'must have identical values in the column',
  });

  expect(v.validate('B', contextB)).toEqual({
    ok: true,
    kind: 'same_value_for_all_rows',
  });
  expect(v.validate('A', contextB)).toEqual({
    ok: false,
    kind: 'same_value_for_all_rows',
    message: 'must have identical values in the column',
  });
  expect(v.validate('B0', contextB)).toEqual({
    ok: false,
    kind: 'same_value_for_all_rows',
    message: 'must have identical values in the column',
  });

  expect(() => v.validate('B0')).toThrow();
});
