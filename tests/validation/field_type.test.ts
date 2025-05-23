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
import { FieldTypeValidator } from '../../src/validation/validators/field_type';

test('FieldTypeValidator', () => {
  {
    let v = new FieldTypeValidator({ op: SUPPORTED_VALIDATORS.FIELD_TYPE, value: 'string' });
    expect(v.validate(123)).toEqual({
      ok: false,
      kind: 'field_type',
      message: 'must be of type: text',
    });
    expect(v.validate('123')).toEqual({ ok: true, kind: 'field_type' });
  }
  {
    const v = new FieldTypeValidator({ op: SUPPORTED_VALIDATORS.FIELD_TYPE, value: 'number' });
    expect(v.validate(123)).toEqual({ ok: true, kind: 'field_type' });
    expect(v.validate('123')).toEqual({
      ok: false,
      kind: 'field_type',
      message: 'must be of type: number',
    });
  }
});

test('FieldTypeValidator fails for invalid option value', () => {
  // @ts-expect-error
  expect(() => new FieldTypeValidator({ op: SUPPORTED_VALIDATORS.FIELD_TYPE, value: 123 })).toThrow();
  // @ts-expect-error
  expect(() => new FieldTypeValidator({ op: SUPPORTED_VALIDATORS.FIELD_TYPE, value: "[[[" })).toThrow();
});
