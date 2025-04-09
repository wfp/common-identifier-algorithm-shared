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
import { OptionsValidator } from '../../src/validation/validators/options';

test('OptionsValidator', () => {
  const v = new OptionsValidator({ op: SUPPORTED_VALIDATORS.OPTIONS, value: ['A', 'B', 'AB'] });
  expect(v.validate('')).toEqual({
    ok: false,
    kind: 'options',
    message: 'must be one of: "A", "B", "AB"',
  });

  expect(v.validate('A')).toEqual({ ok: true, kind: 'options' });
  expect(v.validate('B')).toEqual({ ok: true, kind: 'options' });
  expect(v.validate('AB')).toEqual({ ok: true, kind: 'options' });

  expect(v.validate('AAB')).toEqual({
    ok: false,
    kind: 'options',
    message: 'must be one of: "A", "B", "AB"',
  });
  expect(v.validate(' ')).toEqual({
    ok: false,
    kind: 'options',
    message: 'must be one of: "A", "B", "AB"',
  });
  expect(v.validate('ab')).toEqual({
    ok: false,
    kind: 'options',
    message: 'must be one of: "A", "B", "AB"',
  });

  expect(v.validate(null)).toEqual({
    ok: false,
    kind: 'options',
    message: 'values must be either a number or a string',
  });
  expect(v.validate(new Date())).toEqual({
    ok: false,
    kind: 'options',
    message: 'values must be either a number or a string',
  });
});

test('OptionsValidator fails for invalid options', () => {
  // @ts-expect-error
  expect(() => new OptionsValidator({ op: SUPPORTED_VALIDATORS.OPTIONS, value: 123 })).toThrow();
  // @ts-expect-error
  expect(() => new OptionsValidator({ op: SUPPORTED_VALIDATORS.OPTIONS, value: '[[[' })).toThrow();
  // @ts-expect-error
  expect(() => new OptionsValidator({op: SUPPORTED_VALIDATORS.OPTIONS,value: [null, 'qwerty', new Date()]})).toThrow();
});
