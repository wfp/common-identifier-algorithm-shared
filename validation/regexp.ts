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

import { Config } from "../config/Config.js";
import { ValidatorBase } from "./base.js";
import { SUPPORTED_VALIDATORS } from "./Validation.js";

class RegexpValidator extends ValidatorBase {
    rx: RegExp;
    regexp: string;

    constructor(rx: string, opts: Config.ColumnValidation) {
        super(SUPPORTED_VALIDATORS.REGEX_MATCH, opts)
        // extract the regular expression
        this.regexp = rx;

        // allocate the regular expression
        this.rx = new RegExp(wrapRegexpString(rx));
    }

    // the default message
    defaultMessage() {
        return `must match regular expression /^${this.regexp}$/`;
    }

    // the core validation function that takes a field and returns nothing / a validationError
    validate(value: any) {
        // null and undefined cannot be converted to string, so fail here
        if (typeof value === 'undefined' || value === null) {
            return this.failWith("must not be empty");
        }
        // Convert the value to string
        const stringValue = value.toString();
        // check if the regexp matches
        if (this.rx.test(stringValue)) {
            return this.success();
        }

        // fail if not
        return this.fail();
    }

}

// Returns the regexp string rx wrapped in "^...$" -- to ensure that the whole test string is checked
// TODO: this reduces regexp functionality but seems to be a WFP requirement
function wrapRegexpString(rx: string) {
    return `^${rx}$`;
}

// Factory function for the RegexpValidator
export function makeRegexpValidator(opts: Config.ColumnValidation) {
    let rx = opts.value;

    // check if there is a regexp value
    if (typeof rx !== 'string') {
        throw new Error(`Regexp validator must have a 'value' with a regexp -- options are: ${JSON.stringify(opts)}`)
    }

    // attempt to compile the regexp
    try {
        new RegExp(wrapRegexpString(rx));
    } catch(e) {
        // fail if invalid
        throw new Error(`Error while compiling regular expression: "${rx}": ${e}`)
    }


    // return a new validator
    return new RegexpValidator(rx, opts);
}