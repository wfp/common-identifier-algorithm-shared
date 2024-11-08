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
import { SUPPORTED_VALIDATORS, Validation, Validator } from "../Validation.js";

export class SameValueForAllRowsValidator implements Validator.Base {
    kind = SUPPORTED_VALIDATORS.SAME_VALUE_FOR_ALL_ROWS;
    opts: Validator.Options.SameValueForAllRows;

    constructor(opts: Validator.Options.SameValueForAllRows) {
        this.opts = opts;
    }

    message = () => this.opts.message ? this.opts.message : "must have identical values in the column";

    validate(value: unknown, data?: Validation.Data): Validator.Result {
        if (!data) throw new Error("This validator validate method must be provided with sheet context.");
        // if this validation function is called there is at least one row of data
        // in the sheet, so we dont need to check for that

        // get the value in the first row
        const targetValue = data.document.data[0][data.column];

        // check if it matches the current value
        if (value === targetValue) return { ok: true, kind: this.kind }
        return { ok: false, kind: this.kind, message: this.message() }
    }

}
