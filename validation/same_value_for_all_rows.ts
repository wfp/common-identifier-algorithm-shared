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
import { SUPPORTED_VALIDATORS, Validation } from "./Validation.js";

class SameValueForAllRowsValidator extends ValidatorBase {
    constructor(opts: Config.ColumnValidation) {
        super(SUPPORTED_VALIDATORS.ROW_MATCHES_VALUE, opts);
    }

    // the default message
    defaultMessage() {
        return `must be identical for all items in the file`;
    }

    validate(value: any, { sheet, column }: Validation.Data) {
        // if this validation function is called there is at least one row of data
        // in the sheet, so we dont need to check for that

        // get the value in the first row
        const targetValue = sheet.data[0][column];

        // check if it matches the current value
        // return value == targetValue ? this.success() : this.failWith(`must be '${targetValue}'`)
        return value == targetValue ? this.success() : this.fail();
    }

}

// Factory function for the SameValueForAllRowsValidator
export function makeSameValueForAllRowsValidator(opts: Config.ColumnValidation) {

    // return a new validator
    return new SameValueForAllRowsValidator(opts);
}
