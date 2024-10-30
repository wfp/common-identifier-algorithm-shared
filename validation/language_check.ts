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

import { Config } from '../config/Config.js';
import { ValidatorBase } from './base.js';
import { SUPPORTED_VALIDATORS } from './Validation.js';

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
        "()\\-",
        "\\s",
        "/",
        "\u0600-\u06ff",

        "\u0750-\u077f",
        "\u0870-\u089f",
        "\u08a0-\u08ff",

        "\ufb50-\ufdff",
        "\ufe70-\ufeff",

        // TODO: somehow add ones above 10xxx
    ];

    const validatorRx = new RegExp(`^[${RX_BASE.join('')}]*$`)

    return validatorRx.test(v);


}

const CHECKER_FNS = {
    "arabic": checkArabicUtf8,
}

class LanguageCheckValidator extends ValidatorBase {
    language: keyof typeof CHECKER_FNS;

    constructor(language: string, opts: Config.ColumnValidation) {
        super(SUPPORTED_VALIDATORS.LANGUAGE_CHECK, opts)
        this.language = language.toLowerCase() as keyof typeof CHECKER_FNS;
    }

    // the default message
    defaultMessage() {
        return `only readable ${this.language} characters are supported.`;
        // return `must be in the language '${this.language}'`;
    }

    validate(value: any) {
        return CHECKER_FNS[this.language](value) ? this.success() : this.fail();
    }

}

// Factory function for the LanguageCheckValidator
export function makeLanguageCheckValidator(opts: Config.ColumnValidation) {
    let language = opts.value;

    // check if there is a regexp value
    if (typeof language !== 'string') {
        throw new Error(`LanguageCheck validator must have a 'value' with language name as string -- ${JSON.stringify(opts)}`)
    }

    // ensure compatibilty
    language = language.toLowerCase();


    // check if there is a regexp value
    let matcher = CHECKER_FNS[language.toLowerCase() as keyof typeof CHECKER_FNS];
    if (!matcher) {
        throw new Error(`Cannot find field type: '${language}' for field_type validator`)
    }

    // return a new validator
    return new LanguageCheckValidator(language, opts);
}