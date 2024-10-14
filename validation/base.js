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


// Validation engine

const ValidationError = require('./ValidationError');

// base error type for low-level validator errors
const ERROR_CORE = "core";

// Base class for validators
class ValidatorBase {
    constructor(kind, opts) {
        this.kind = kind;
        this.opts = opts;
    }

    // returns the failiure message of the validator
    // (if the user specified an error message it gets returned here, otherwise
    // the defaultMessage() instance method return value is used)
    message() {
        // check if there is a message from the options
        if (this.opts.message) {
            return this.opts.message;
        }
        // otherwise return the default message
        return this.defaultMessage();
    }


    // helper that returns a validation error suited for this
    // validator
    fail() {
        return new ValidationError(this.kind, this.message());
    }

    // helper that returns a validation error with the user provided error message
    failWith(msg) {
        return new ValidationError(this.kind, msg);
    }

    // helper to return a value that is actually valid
    success() {
        return null;
    }


    ////////////////////////////////////////
    // Implement the following in subclasses


    // the default message
    defaultMessage() {
        throw new Error(`No 'defaultMessage' specified for validator type '${this.kind}'`)
    }

    // the core validation function that takes a field and returns nothing / a validationError
    validate(value, {row, sheet, column}) {
        throw new Error(`No 'validate()' defined for validator type '${this.kind}'`)
        // return new ValidationError(ERROR_CODE, "not implemented");
    }

}



module.exports = ValidatorBase;