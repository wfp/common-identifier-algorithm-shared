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

const FIELD_TYPE_NAMES = {
    str: "text",
    num: "number",
}

const FIELD_TYPE_MATCHERS = {
    str: (v: unknown) => typeof v === 'string',
    num: (v: unknown) => typeof v === 'number',
}

class FieldTypeValidator extends ValidatorBase {
    fieldType: keyof typeof FIELD_TYPE_MATCHERS;

    constructor(fieldType: string, opts: Config.ColumnValidation) {
        super(SUPPORTED_VALIDATORS.FIELD_TYPE, opts)
        this.fieldType = fieldType as keyof typeof FIELD_TYPE_MATCHERS;
    }

    // the default message
    defaultMessage() {
        return `must be of type: ${FIELD_TYPE_NAMES[this.fieldType]}`;
    }

    validate(value: any) {
        return FIELD_TYPE_MATCHERS[this.fieldType](value) ? this.success() : this.fail();
    }

}

// Factory function for the FieldTypeValidator
export function makeFieldTypeValidator(opts: Config.ColumnValidation) {
    let fieldType = opts.value;

    // check if there is a regexp value
    if (typeof fieldType !== 'string') {
        throw new Error(`FieldType validator must have a 'value' with the field type -- ${JSON.stringify(opts)}`)
    }

    // ensure compatibilty
    fieldType = fieldType.toLowerCase();

    // check if there is a regexp value
    let matcher = FIELD_TYPE_MATCHERS[fieldType as keyof typeof FIELD_TYPE_MATCHERS];
    if (!matcher) {
        throw new Error(`Cannot find field type: '${fieldType}' for field_type validator`)
    }

    // return a new validator
    return new FieldTypeValidator(fieldType, opts);
}
