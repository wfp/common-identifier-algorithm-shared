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
import { Config } from '../config/Config.js';
import { ValidatorBase } from './base.js';
import { SUPPORTED_VALIDATORS } from './Validation.js';

class OptionsValidator extends ValidatorBase {
    values: Config.ColumnValidation["value"][]

    constructor(values: Config.ColumnValidation["value"][], opts: Config.ColumnValidation) {
        super(SUPPORTED_VALIDATORS.OPTIONS, opts)
        this.values = values;
    }

    // the default message
    defaultMessage() {
        return `must be one of: "${this.values.join('", "')}"`;
    }

    // the core validation function that takes a field and returns nothing / a validationError
    validate(value: any) {
        if (this.values.indexOf(value) < 0) {
            return this.fail();
        }

        return this.success();
    }

}

// Factory function for the OptionsValidator
export function makeOptionsValidator(opts: Config.ColumnValidation) {
    let values = opts.value;

    // check if there is a regexp value
    if (!Array.isArray(values)) {
        throw new Error(`Options validator must have a 'value' with a list of values -- options are: ${JSON.stringify(opts)}`)
    }

    // return a new validator
    return new OptionsValidator(values, opts);
}