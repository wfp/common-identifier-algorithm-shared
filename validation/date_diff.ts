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

import { parseDateDiff, isValidDateDiff, attemptToParseDate, isDateInRange, ParsedDateDiff } from './date_shared.js';
import { SUPPORTED_VALIDATORS } from "./Validation.js";

class DateDiffValidator extends ValidatorBase {
    dateDiff: string;
    parsedDateDiff: ParsedDateDiff | null;
    constructor(dateDiff: string, opts: Config.ColumnValidation) {
        super(SUPPORTED_VALIDATORS.DATE_DIFF, opts)
        this.dateDiff = dateDiff;
        this.parsedDateDiff = parseDateDiff(dateDiff);
    }

    // the default message
    defaultMessage() {
        if (!this.parsedDateDiff) return `: no date diff specified in configuration`
        const { _key, _value } = this.parsedDateDiff;
        return `must be within ${_value} ${_key} of today`;
    }

    validate(value: any) {
        let parsedDate = attemptToParseDate(value);

        if (!parsedDate) {
            return this.failWith("must be a date: " + value);
        }

        if (!isDateInRange(this.parsedDateDiff!, parsedDate)) {
            return this.fail();
        }

        return this.success();
    }

}

// Factory function for the DateDiffValidator
export function makeDateDiffValidator(opts: Config.ColumnValidation) {
    let dateDiff = opts.value;

    // check if there is a regexp value
    if (typeof dateDiff !== 'string') {
        throw new Error(`DateDiff validator must have a 'value' with the date difference as a string -- ${JSON.stringify(opts)}`)
    }

    // TODO: validate the date diff format here
    if (!isValidDateDiff(dateDiff)) {
        throw new Error(`'${dateDiff}' is not a valid date difference`)
    }

    // return a new validator
    return new DateDiffValidator(dateDiff, opts);
}