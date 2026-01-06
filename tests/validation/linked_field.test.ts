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

import { SUPPORTED_VALIDATORS } from '@/validation';
import { LinkedFieldValidator } from '@/validation/validators/linked_field';

let TEST_SHEET_PARAMS = {
  row: { col_a: 'b' },
  document: { name: '', data: [] },
  column: '',
};

describe("validation::linkedField", () => {
  test('LinkedFieldValidator', () => {
    const v = new LinkedFieldValidator({ op: SUPPORTED_VALIDATORS.LINKED_FIELD, target: 'col_a' });

    expect(v.validate('a', TEST_SHEET_PARAMS)).toEqual({
      ok: true,
      kind: 'linked_field',
    });
    expect(v.validate('', TEST_SHEET_PARAMS)).toEqual({
      ok: true,
      kind: 'linked_field',
    });

    TEST_SHEET_PARAMS.row.col_a = '';
    expect(v.validate('a', TEST_SHEET_PARAMS)).toEqual({
      ok: false,
      kind: 'linked_field',
      message: "is linked with field 'col_a' which cannot be empty",
    });

    expect(() => v.validate('a')).toThrow();
  });

  test('fails for invalid option value', () => {
    expect(
      // @ts-ignore
      () => new FieldTypeValidator({ op: 'field_type', value: 123 }),
    ).toThrow();
  });
});