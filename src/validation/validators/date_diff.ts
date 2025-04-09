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
import type { DateDiffValidatorOptions, Validator } from '../Validation';

import { parseDateDiff, isValidDateDiff, attemptToParseDate, isDateInRange } from './date_shared';
import type { ParsedDateDiff } from './date_shared';

export class DateDiffValidator implements Validator.Base {
  kind = SUPPORTED_VALIDATORS.DATE_DIFF;
  opts: DateDiffValidatorOptions;
  parsedDateDiff: ParsedDateDiff[] | null;

  constructor(opts: DateDiffValidatorOptions) {
    // check if there is a regexp value
    if (typeof opts.value !== 'string') {
      throw new Error(
        `DateDiff validator must have a 'value' with the date difference as a string -- ${JSON.stringify(opts)}`,
      );
    }

    // TODO: validate the date diff format here
    if (!isValidDateDiff(opts.value)) {
      throw new Error(`'${opts.value}' is not a valid date difference`);
    }
    this.parsedDateDiff = parseDateDiff(opts.value);
    this.opts = opts;
  }

  message = () => {
    if (this.opts.message) return this.opts.message;

    if (!this.parsedDateDiff) return `: no date diff specified in configuration`;
    const left = this.parsedDateDiff[0];
    const right = this.parsedDateDiff[1];

    if (left._value === 0) return `must be between today and ${right._value} ${right._key}`;
    if (right._value === 0) return `must be between ${left._value} ${left._key} and today`;
    return `must be within ${left._value} ${left._key} and ${right._value} ${right._key} of today`;
  };

  validate = (value: unknown): Validator.Result => {
    let parsedDate = attemptToParseDate(value);

    if (!parsedDate) return { ok: false, kind: this.kind, message: `must be a date` };

    if (!isDateInRange(this.parsedDateDiff!, parsedDate))
      return { ok: false, kind: this.kind, message: this.message() };

    return { ok: true, kind: this.kind };
  };
}
