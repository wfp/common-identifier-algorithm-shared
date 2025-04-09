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
import type { MaxValueValidatorOptions, Validator } from '../Validation';

enum DATE_OPTS {
  YEAR = '{{currentYear}}',
  MONTH = '{{currentMonth}}',
}

export class MaxValueValidator implements Validator.Base {
  kind = SUPPORTED_VALIDATORS.MAX_VALUE;
  opts: MaxValueValidatorOptions;
  maxValue: number;

  constructor(opts: MaxValueValidatorOptions) {
    // validate if string, {{currentYear}}
    let maxValue: unknown = opts.value;

    if (Object.values(DATE_OPTS).includes(maxValue as DATE_OPTS)) {
      switch (maxValue) {
        case DATE_OPTS.YEAR:
          maxValue = new Date().getUTCFullYear();
          break;
        case DATE_OPTS.MONTH:
          maxValue = new Date().getUTCMonth() + 1;
          break; // +1 since getUTCMonth is zero-indexed
      }
    }

    if (typeof maxValue !== 'number') {
      throw new Error(
        `MaxValue validator must have a 'value' with a number or a valid date string -- ${JSON.stringify(opts)}`,
      );
    }

    this.opts = opts;
    this.maxValue = maxValue;
  }

  message = (msg?: string) =>
    this.opts.message ? this.opts.message : msg ? msg : `must be at most ${this.maxValue}`;

  validate = (value: unknown): Validator.Result => {
    if (typeof value !== 'string' && typeof value !== 'number') {
      return {
        ok: false,
        kind: this.kind,
        message: 'must be text or a number',
      };
    }

    let numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue))
      return {
        ok: false,
        kind: this.kind,
        message: 'must be text or a number',
      };

    if (numericValue <= this.maxValue) return { ok: true, kind: this.kind };
    return { ok: false, kind: this.kind, message: this.message() };
  };
}
