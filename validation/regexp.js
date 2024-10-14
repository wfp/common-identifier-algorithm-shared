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

const KIND_REGEXP = "regexp"


class RegexpValidator extends ValidatorBase {
    constructor(rx, rxOpts, opts) {
        super(KIND_REGEXP, opts)
        // extract the regular expression
        this.regexp = rx;
        this.regexpOpts = rxOpts || "";

        // allocate the regular expression
        this.rx = new RegExp(wrapRegexpString(rx), rxOpts);
    }

    // the default message
    defaultMessage() {
        return `must match regular expression /^${this.regexp}$/${this.regexpOpts}`;
    }

    // the core validation function that takes a field and returns nothing / a validationError
    validate(value) {
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
function wrapRegexpString(rx) {
    return `^${rx}$`;
}

// Factory function for the RegexpValidator
function makeRegexpValidator(opts) {
    let rx = opts.value;
    let rxOpts = opts.options;

    // check if there is a regexp value
    if (typeof rx !== 'string') {
        throw new Error(`Regexp validator must have a 'value' with a regexp -- options are: ${JSON.stringify(opts)}`)
    }

    // attempt to compile the regexp
    try {
        let regexp = new RegExp(wrapRegexpString(rx), opts.options);
    } catch(e) {
        // fail if invalid
        throw new Error(`Error while compiling regular expression: "${rx}" with options "${rxOpts}": ${e}`)
    }


    // return a new validator
    return new RegexpValidator(rx, rxOpts, opts);
}

// export the factory function
module.exports = makeRegexpValidator;