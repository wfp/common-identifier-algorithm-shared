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


/* Linked Field validator checks that if source column has a value, the other linked column also contains a value */
export class LinkedFieldValidator implements Validator.Base {
    kind = SUPPORTED_VALIDATORS.LINKED_FIELD;
    opts: Validator.Options.LinkedField;

    constructor(opts: Validator.Options.LinkedField) {
        if (typeof opts.target !== "string") {
            throw new Error("LinkedFieldValidator must be provided with target field as a string.")
        }
        this.opts = opts;
    }

    // the default message
    message = (msg?: string) => this.opts.message ? this.opts.message : msg ? msg : `is linked with '${this.opts.target},' both must have valid values`

    validate(value: unknown, data?: Validation.Data): Validator.Result {
            if (!data) throw new Error("This validator validate method must be provided with row context.");

            // if no value in this field, no need to check the linked one
            if (!value) return { ok: true, kind: this.kind }
    
            const otherFieldValue = data.row[this.opts.target];
            if (!otherFieldValue) return {
                ok: false, kind: this.kind,
                message: this.message(`is linked with field '${this.opts.target}' which cannot be empty`)
            }
    
            return { ok: true, kind: this.kind }
        }
}