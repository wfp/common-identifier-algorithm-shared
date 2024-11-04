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

class MaxFieldLengthValidator extends ValidatorBase {
    maxLen: number;
    constructor(maxLen: number, opts: Config.ColumnValidation) {
        super(SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH, opts)
        this.maxLen = maxLen;
    }

    // the default message
    defaultMessage() {
        return `must be shorter than ${this.maxLen} characters`;
    }

    validate(value: any) {
        // must be a string
        if (typeof value !== 'string') {
            if (typeof value === 'number') {
                value = value.toString();
            } else {
                return this.failWith("must be a string or a number");
            }
        }

        return value.length > this.maxLen ? this.fail() : this.success();
    }

}

// Factory function for the MaxFieldLengthValidator
export function makeMaxFieldLengthValidator(opts: Config.ColumnValidation) {
    let maxLen = opts.value;

    // check if there is a regexp value
    if (typeof maxLen !== 'number') {
        throw new Error(`MaxFieldLength validator must have a 'value' with number -- ${JSON.stringify(opts)}`)
    }

    // return a new validator
    return new MaxFieldLengthValidator(maxLen, opts);
}
