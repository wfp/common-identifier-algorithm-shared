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

import { SUPPORTED_VALIDATORS } from '../Validation.js';
import type { Validator } from '../Validation.js';

export class MaxFieldLengthValidator implements Validator.Base {
  kind = SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH;
  opts: Validator.Options.MaxFieldLength;

  constructor(opts: Validator.Options.MaxFieldLength) {
    if (typeof opts.value !== 'number') {
      throw new Error(`MaxFieldLength validator must have a 'value' with number -- ${JSON.stringify(opts)}`);
    }
    this.opts = opts;
  }

  message = (msg?: string) =>
    this.opts.message ? this.opts.message : msg ? msg : `must be shorter than ${this.opts.value} characters`;

  validate = (value: unknown): Validator.Result => {
    if (typeof value !== 'string' && typeof value !== 'number') {
      return {
        ok: false,
        kind: this.kind,
        message: 'must be text or a number',
      };
    }

    if (`${value}`.length > this.opts.value) return { ok: false, kind: this.kind, message: this.message() };
    return { ok: true, kind: this.kind };
  };
}
