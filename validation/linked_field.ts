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

/* Linked Field validator checks that if source column has a value, the other linked column also contains a value */
class LinkedFieldValidator extends ValidatorBase {
    targetField: string;

    constructor(opts: Config.ColumnValidation) {
        super(SUPPORTED_VALIDATORS.LINKED_FIELD, opts)
        this.targetField = opts.target!;
    }

    // the default message
    defaultMessage() {
        return `is linked with '${this.targetField},' both must have valid values`;
    }

    validate(value: any, { row }: Validation.Data) {
        // if no value in this field, no need to check the linked one
        if (!value) return this.success();

        const otherFieldValue = row[this.targetField];

        if (!otherFieldValue) return this.failWith(`is linked with field '${this.targetField}' which cannot be empty`);

        return this.success();
    }

}

// Factory function for the DateDiffValidator
export function makeLinkedFieldValidator(opts: Config.ColumnValidation) {
    return new LinkedFieldValidator(opts);
}