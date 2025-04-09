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

import { LanguageCheckValidator } from '../../src/validation/validators/language_check';
import { SUPPORTED_VALIDATORS } from '../../src/validation';

test('LanguageCheckValidator', () => {
  const v = new LanguageCheckValidator({ op: SUPPORTED_VALIDATORS.LANGUAGE_CHECK, value: 'arabic' });

  expect(v.validate('ABCD')).toEqual({
    ok: false,
    kind: 'language_check',
    message: 'only readable Arabic characters are supported',
  });
  expect(v.validate('ميار')).toEqual({ ok: true, kind: 'language_check' });
  expect(v.validate('吉')).toEqual({
    ok: false,
    kind: 'language_check',
    message: 'only readable Arabic characters are supported',
  });
});

test('LanguageCheckValidator fails for invalid options', () => {
  expect(
    // @ts-ignore
    () => new LanguageCheckValidator({ op: SUPPORTED_VALIDATORS.LANGUAGE_CHECK, value: 123 }),
  ).toThrow();
  expect(
    () =>
      // @ts-ignore
      new LanguageCheckValidator({ op: SUPPORTED_VALIDATORS.LANGUAGE_CHECK, value: 'nothing' }),
  ).toThrow();
});
