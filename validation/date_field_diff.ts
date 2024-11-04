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
import { SUPPORTED_VALIDATORS, Validation } from "./Validation.js";

class DateFieldDiffValidator extends ValidatorBase {
    targetField: string;
    dateDiff: string;
    parsedDateDiff: ParsedDateDiff | null;

    constructor(dateDiff: string, targetField: string, opts: Config.ColumnValidation) {
        super(SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, opts)
        this.targetField = targetField;
        this.dateDiff = dateDiff;
        this.parsedDateDiff = parseDateDiff(dateDiff);
    }

    // the default message
    defaultMessage() {
        if (!this.parsedDateDiff) return `No date diff field specified in configuration.`

        const { _key, _value } = this.parsedDateDiff;
        return `must be in the date range compared to '${this.targetField}': ${_value} ${_key}`;
    }

    validate(value: any, { row }: Validation.Data) {

        let otherFieldValue = row[this.targetField];
        // if there is no other field value fail
        if (!otherFieldValue) {
            this.failWith(`target column '${this.targetField}' is empty`)
        }

        let originDate = attemptToParseDate(otherFieldValue);

        if (!originDate) {
            return this.failWith(`target column '${this.targetField}' must be a date: ${value}`);
        }

        let currentFieldDate = attemptToParseDate(value);

        if (!currentFieldDate) {
            return this.failWith("must be a date: " + value);
        }

        if (!isDateInRange(this.parsedDateDiff!, originDate, currentFieldDate)) {
            return this.fail();
        }

        return this.success();
    }

}

// Factory function for the DateDiffValidator
export function makeDateFieldDiffValidator(opts: Config.ColumnValidation) {
    let dateDiff = opts.value;
    let targetField = opts.target;

    // check if there is a target field specified
    if (typeof targetField !== 'string') {
        throw new Error(`DateFieldDiff validator must have a 'target' with the target column name -- ${JSON.stringify(opts)}`)
    }


    // check if there is a date diff value
    if (typeof dateDiff !== 'string') {
        throw new Error(`DateFieldDiff validator must have a 'value' with the date difference as a string -- ${JSON.stringify(opts)}`)
    }

    // TODO: validate the date diff format here
    if (!isValidDateDiff(dateDiff)) {
        throw new Error(`'${dateDiff}' is not a valid date difference`)
    }

    // return a new validator
    return new DateFieldDiffValidator(dateDiff, targetField, opts);
}