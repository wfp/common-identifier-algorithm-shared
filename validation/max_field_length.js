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

const ValidatorBase = require('./base');

const KIND_MAXFIELDLENGTH = "maxFieldLength"


class MaxFieldLengthValidator extends ValidatorBase {
    constructor(maxLen, opts) {
        super(KIND_MAXFIELDLENGTH, opts)
        this.maxLen = maxLen;
    }

    // the default message
    defaultMessage() {
        return `must be shorter than ${this.maxLen} digits / characters`;
    }

    validate(value) {
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
function makeMaxFieldLengthValidator(opts) {
    let maxLen = opts.value;

    // check if there is a regexp value
    if (typeof maxLen !== 'number') {
        throw new Error(`MaxFieldLength validator must have a 'value' with number -- ${JSON.stringify(opts)}`)
    }

    // return a new validator
    return new MaxFieldLengthValidator(maxLen, opts);
}

// export the factory function
module.exports = makeMaxFieldLengthValidator;