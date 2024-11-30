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
import { RegexpValidator } from '../../src/validation/validators/regexp.js';

test('RegexpValidator', () => {
  const v = new RegexpValidator({ op: 'regex_match', value: '[a-eA-E0-9]*' });

  expect(v.validate('')).toEqual({ ok: true, kind: 'regex_match' });
  expect(v.validate('A')).toEqual({ ok: true, kind: 'regex_match' });
  expect(v.validate('Ac876')).toEqual({ ok: true, kind: 'regex_match' });

  expect(v.validate(undefined)).toEqual({
    ok: false,
    kind: 'regex_match',
    message: 'must not be empty',
  });
  expect(v.validate(null)).toEqual({
    ok: false,
    kind: 'regex_match',
    message: 'must not be empty',
  });

  expect(v.validate('AF876')).toEqual({
    ok: false,
    kind: 'regex_match',
    message: 'must match regular expression /^[a-eA-E0-9]*$/',
  });
  expect(v.validate(' ')).toEqual({
    ok: false,
    kind: 'regex_match',
    message: 'must match regular expression /^[a-eA-E0-9]*$/',
  });
  expect(v.validate('fff')).toEqual({
    ok: false,
    kind: 'regex_match',
    message: 'must match regular expression /^[a-eA-E0-9]*$/',
  });
});

test('RegexpValidator fails for invalid regexp', () => {
  expect(
    // @ts-ignore
    () => new RegexpValidator({ op: 'regex_match', value: 123 }),
  ).toThrow();
  expect(
    // @ts-ignore
    () => new RegexpValidator({ op: 'regex_match', value: '[[[' }),
  ).toThrow();
});
