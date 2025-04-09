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
import type { SameValueForAllRowsValidatorOptions, Validator } from '../Validation';

export class SameValueForAllRowsValidator implements Validator.Base {
  kind = SUPPORTED_VALIDATORS.SAME_VALUE_FOR_ALL_ROWS;
  opts: SameValueForAllRowsValidatorOptions;

  constructor(opts: SameValueForAllRowsValidatorOptions) {
    this.opts = opts;
  }

  message = () => (this.opts.message ? this.opts.message : 'must have identical values in the column');

  validate(value: unknown, data?: Validator.InputData): Validator.Result {
    if (!data) throw new Error('This validator validate method must be provided with sheet context.');
    // if this validation function is called there is at least one row of data
    // in the sheet, so we dont need to check for that

    // get the value in the first row
    const targetValue = data.document.data[0][data.column];

    // check if it matches the current value
    if (value === targetValue) return { ok: true, kind: this.kind };
    return { ok: false, kind: this.kind, message: this.message() };
  }
}
