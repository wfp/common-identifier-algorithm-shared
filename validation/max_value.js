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
const makeValueValidator = require("./value_base");

function makeMaxValueValidator(opts) {
    let maxValue = opts.value;

    // check if there is a regexp value
    if (typeof maxValue !== 'number') {
        throw new Error(`MinValue validator must have a 'value' with a number -- ${JSON.stringify(opts)}`)
    }

    return makeValueValidator("min_value", `must be at most ${maxValue}`, (v) => {
        // attempt to convert to a number
        let numericValue = parseFloat(v);
        // not a number is a failed validation
        if (isNaN(numericValue)) {
            return false;
        }

        return numericValue <= maxValue;

    }, opts);
}

// export the factory function
module.exports = makeMaxValueValidator;
