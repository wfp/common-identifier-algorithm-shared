// Common Identifier Application
// Copyright (C) 2024 World Food Programme

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { SUPPORTED_VALIDATORS } from '../Validation';
import type { MaxFieldLengthValidatorOptions, Validator } from '../Validation';

export class MaxFieldLengthValidator implements Validator.Base {
  kind = SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH;
  opts: MaxFieldLengthValidatorOptions;

  constructor(opts: MaxFieldLengthValidatorOptions) {
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
