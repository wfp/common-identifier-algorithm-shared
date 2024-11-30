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
import { MinValueValidator } from '../../src/validation/validators/min_value.js';

test('MinValueValidator', () => {
  const v = new MinValueValidator({ op: 'min_value', value: 100 });

  expect(v.validate('')).toEqual({
    ok: false,
    kind: 'min_value',
    message: 'must be text or a number',
  });

  expect(v.validate('1')).toEqual({
    ok: false,
    kind: 'min_value',
    message: 'must be at least 100',
  });
  expect(v.validate('10')).toEqual({
    ok: false,
    kind: 'min_value',
    message: 'must be at least 100',
  });
  expect(v.validate('100')).toEqual({ ok: true, kind: 'min_value' });
  expect(v.validate('1000')).toEqual({ ok: true, kind: 'min_value' });

  expect(v.validate(1)).toEqual({
    ok: false,
    kind: 'min_value',
    message: 'must be at least 100',
  });
  expect(v.validate(10)).toEqual({
    ok: false,
    kind: 'min_value',
    message: 'must be at least 100',
  });
  expect(v.validate(100)).toEqual({ ok: true, kind: 'min_value' });
  expect(v.validate(1000)).toEqual({ ok: true, kind: 'min_value' });

  expect(v.validate('AAB')).toEqual({
    ok: false,
    kind: 'min_value',
    message: 'must be text or a number',
  });
  expect(v.validate(' ')).toEqual({
    ok: false,
    kind: 'min_value',
    message: 'must be text or a number',
  });
  expect(v.validate('ab')).toEqual({
    ok: false,
    kind: 'min_value',
    message: 'must be text or a number',
  });
});

test('MinValueValidator fails for invalid options', () => {
  expect(
    // @ts-ignore
    () => new MinValueValidator({ op: 'min_value', value: '[[[' }),
  ).toThrow();
});
