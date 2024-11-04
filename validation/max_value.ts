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
import { SUPPORTED_VALIDATORS } from "./Validation.js";
import { makeValueValidator } from "./value_base.js";

export function makeMaxValueValidator(opts: Config.ColumnValidation) {
    enum DATE_OPTS { YEAR = "{{currentYear}}", MONTH = "{{currentMonth}}" }
    
    let maxValue: unknown = opts.value;
    
    if (Object.values(DATE_OPTS).includes(maxValue as DATE_OPTS)) {
        switch(maxValue) {
            case DATE_OPTS.YEAR: maxValue = new Date().getUTCFullYear(); break;
            case DATE_OPTS.MONTH: maxValue = new Date().getUTCMonth() + 1; break; // +1 since getUTCMonth is zero-indexed
        }
    }
    let message = `must be at most ${maxValue}`
    
    if (typeof maxValue !== 'number') {
        throw new Error(`MaxValue validator must have a 'value' with a number or a valid date string -- ${JSON.stringify(opts)}`)
    }

    return makeValueValidator(SUPPORTED_VALIDATORS.MAX_VALUE, message, (v: string) => {
        // attempt to convert to a number
        let numericValue = parseFloat(v);
        // not a number is a failed validation
        if (isNaN(numericValue)) {
            return false;
        }

        return numericValue <= maxValue;

    }, opts);
}
