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

class MinFieldLengthValidator extends ValidatorBase {
    minLen: number;
    constructor(minLen: number, opts: Config.ColumnValidation) {
        super(SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH, opts)
        this.minLen = minLen;
    }

    // the default message
    defaultMessage() {
        return `must be longer than ${this.minLen} digits / characters`;
    }

    validate(value: string | number) {
        // must be a string
        if (typeof value !== 'string') {
            if (typeof value === 'number') {
                value = value.toString();
            } else {
                return this.failWith("must be text or a number");
            }
        }

        return value.length < this.minLen ? this.fail() : this.success();
    }

}

// Factory function for the MinFieldLengthValidator
export function makeMinFieldLengthValidator(opts: Config.ColumnValidation) {
    let minLen = opts.value;

    // check if there is a regexp value
    if (typeof minLen !== 'number') {
        throw new Error(`MinFieldLength validator must have a 'value' with number -- ${JSON.stringify(opts)}`)
    }

    // return a new validator
    return new MinFieldLengthValidator(minLen, opts);
}