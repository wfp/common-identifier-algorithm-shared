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
import { SUPPORTED_VALIDATORS } from '../../src/validation';
import { MinFieldLengthValidator } from '../../src/validation/validators/min_field_length';

test('MinFieldLengthValidator', () => {
  const v = new MinFieldLengthValidator({ op: SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH, value: 2 });

  expect(v.validate('')).toEqual({
    ok: false,
    kind: 'min_field_length',
    message: 'must be longer than 2 characters',
  });
  expect(v.validate(' ')).toEqual({
    ok: false,
    kind: 'min_field_length',
    message: 'must be longer than 2 characters',
  });

  expect(v.validate('A')).toEqual({
    ok: false,
    kind: 'min_field_length',
    message: 'must be longer than 2 characters',
  });
  expect(v.validate('AB')).toEqual({ ok: true, kind: 'min_field_length' });
  expect(v.validate('ABC')).toEqual({ ok: true, kind: 'min_field_length' });
  expect(v.validate('ABCD')).toEqual({ ok: true, kind: 'min_field_length' });

  expect(v.validate(1)).toEqual({
    ok: false,
    kind: 'min_field_length',
    message: 'must be longer than 2 characters',
  });
  expect(v.validate(10)).toEqual({ ok: true, kind: 'min_field_length' });
  expect(v.validate(100)).toEqual({ ok: true, kind: 'min_field_length' });
  expect(v.validate(1000)).toEqual({ ok: true, kind: 'min_field_length' });

  expect(v.validate(null)).toEqual({
    ok: false,
    kind: 'min_field_length',
    message: 'must be text or a number',
  });
  expect(v.validate(new Date())).toEqual({
    ok: false,
    kind: 'min_field_length',
    message: 'must be text or a number',
  });
});

test('MinFieldLengthValidator fails for invalid options', () => {
  // @ts-expect-error
  expect(() => new MinFieldLengthValidator({ op: SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH, value: '[[[' })).toThrow();
});
