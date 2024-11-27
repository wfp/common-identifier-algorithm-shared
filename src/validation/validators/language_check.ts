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
import { SUPPORTED_VALIDATORS } from '../Validation.js';
import type { Validator } from '../Validation.js';

function checkArabicUtf8(v: string) {
  // As of Unicode 15.1, the Arabic script is contained in the following blocks:[3]

  // Arabic (0600–06FF, 256 characters)

  // Arabic Supplement (0750–077F, 48 characters)
  // Arabic Extended-B (0870–089F, 41 characters)
  // Arabic Extended-A (08A0–08FF, 96 characters)

  // Arabic Presentation Forms-A (FB50–FDFF, 631 characters)
  // Arabic Presentation Forms-B (FE70–FEFF, 141 characters)

  // Rumi Numeral Symbols (10E60–10E7F, 31 characters)

  // Arabic Extended-C (10EC0-10EFF, 3 characters)

  // Indic Siyaq Numbers (1EC70–1ECBF, 68 characters)

  // Ottoman Siyaq Numbers (1ED00–1ED4F, 61 characters)

  // Arabic Mathematical Alphabetic Symbols (1EE00–1EEFF, 143 characters)

  const RX_BASE = [
    // English characters are out-of-spec
    // "a-z",
    // "A-Z",
    // "0-9",
    '()\\-',
    '\\s',
    '/',
    '\u0600-\u06ff',

    '\u0750-\u077f',
    '\u0870-\u089f',
    '\u08a0-\u08ff',

    '\ufb50-\ufdff',
    '\ufe70-\ufeff',

    // TODO: somehow add ones above 10xxx
  ];

  const validatorRx = new RegExp(`^[${RX_BASE.join('')}]*$`);
  return validatorRx.test(v);
}

const SUPPORTED_LANGUAGES = [
  {
    type: 'arabic',
    value: 'Arabic',
    checker: (v: string) => checkArabicUtf8(v),
  },
];

export class LanguageCheckValidator implements Validator.Base {
  kind = SUPPORTED_VALIDATORS.LANGUAGE_CHECK;
  opts: Validator.Options.LanguageCheck;
  language: string;
  languageName: string;

  constructor(opts: Validator.Options.LanguageCheck) {
    if (typeof opts.value !== 'string') {
      throw new Error(
        `LanguageCheck validator must have a 'value' with language name as string -- ${JSON.stringify(opts)}`,
      );
    }

    // ensure compatibilty
    const language = opts.value.toLowerCase();

    // check if there is a regexp value
    const matched = SUPPORTED_LANGUAGES.find((t) => t.type === language);
    if (!matched) {
      throw new Error(`LanguageCheck must use a supported language`);
    }

    this.language = language;
    this.languageName = matched.value;
    this.opts = opts;
  }

  message = () =>
    this.opts.message
      ? this.opts.message
      : `only readable ${this.languageName} characters are supported`;

  validate = (value: unknown): Validator.Result => {
    if (typeof value !== 'string')
      return {
        ok: false,
        kind: this.kind,
        message: 'only text values are supported',
      };
    if (!checkArabicUtf8(value))
      return { ok: false, kind: this.kind, message: this.message() };

    return { ok: true, kind: this.kind };
  };
}
