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
import { SUPPORTED_VALIDATORS, Validator } from "../Validation.js";

export class MinValueValidator implements Validator.Base {
    kind = SUPPORTED_VALIDATORS.MIN_VALUE;
    opts: Validator.Options.MinValue;

    constructor(opts: Validator.Options.MinValue) {
        if (typeof opts.value !== 'number') {
            throw new Error(`MinValue validator must have a 'value' with a number -- ${JSON.stringify(opts)}`)
        }
        this.opts = opts;
    }

    message = (msg?: string) => this.opts.message
        ? this.opts.message
            : msg
                ? msg
                    : `must be at least ${this.opts.value}`

    validate = (value: unknown): Validator.Result => {
        if (typeof value !== 'string' && typeof value !== 'number') {
            return { ok: false, kind: this.kind, message: "must be text or a number" }
        }

        let numericValue = typeof value === "string" ? parseFloat(value) : value;
        if (isNaN(numericValue)) return { ok: false, kind: this.kind, message: "must be text or a number"};

        if (numericValue >= this.opts.value) return { ok: true, kind: this.kind };
        return { ok: false, kind: this.kind, message: this.message() }

    }
}
