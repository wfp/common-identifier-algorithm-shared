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
import type { Validator } from '../Validation';

export class OptionsValidator implements Validator.Base {
  kind = SUPPORTED_VALIDATORS.OPTIONS;
  opts: Validator.Options.Options;

  constructor(opts: Validator.Options.Options) {
    if (!Array.isArray(opts.value)) {
      throw new Error(
        `Options validator must have a 'value' with a list of values -- options are: ${JSON.stringify(opts)}`,
      );
    }
    // all items in the array must either be string | number
    const unsupportedTypes = opts.value.filter((t) => typeof t !== 'string' && typeof t !== 'number');
    if (unsupportedTypes.length > 0) {
      throw new Error(
        `Options validator array must contain only strings or numbers -- options are: ${JSON.stringify(opts)}`,
      );
    }
    this.opts = opts;
  }

  message = () => {
    if (this.opts.message) return this.opts.message;
    return `must be one of: "${this.opts.value.join('", "')}"`;
  };

  validate = (value: unknown): Validator.Result => {
    if (typeof value !== 'string' && typeof value !== 'number')
      return {
        ok: false,
        kind: this.kind,
        message: `values must be either a number or a string`,
      };
    if (!this.opts.value.includes(value))
      return {
        ok: false,
        kind: this.kind,
        message: this.message(),
      };
    return { ok: true, kind: this.kind };
  };
}
