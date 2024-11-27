/*
 * This file is part of Building Blocks CommonID Tool
 * Copyright (c) 2024 WFP
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import { LanguageCheckValidator } from '../../validation/validators/language_check.js';

test('LanguageCheckValidator', () => {
  const v = new LanguageCheckValidator({
    op: 'language_check',
    value: 'arabic',
  });

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
  // @ts-ignore
  expect(
    () => new LanguageCheckValidator({ op: 'language_check', value: 123 }),
  ).toThrow();
  // @ts-ignore
  expect(
    () =>
      new LanguageCheckValidator({ op: 'language_check', value: 'nothing' }),
  ).toThrow();
});
