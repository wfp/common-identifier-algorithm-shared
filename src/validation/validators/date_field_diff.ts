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
import type { Validation, Validator } from '../Validation.js';

import {
  parseDateDiff,
  isValidDateDiff,
  attemptToParseDate,
  isDateInRange,
} from './date_shared.js';
import type { ParsedDateDiff } from './date_shared.js';

export class DateFieldDiffValidator implements Validator.Base {
  kind = SUPPORTED_VALIDATORS.DATE_FIELD_DIFF;
  opts: Validator.Options.DateFieldDiff;

  parsedDateDiff: ParsedDateDiff[] | null;

  constructor(opts: Validator.Options.DateFieldDiff) {
    // check if there is a target field specified
    if (typeof opts.target !== 'string') {
      throw new Error(
        `DateFieldDiff validator must have a 'target' with the target column name -- ${JSON.stringify(opts)}`,
      );
    }

    // check if there is a date diff value
    if (typeof opts.value !== 'string') {
      throw new Error(
        `DateFieldDiff validator must have a 'value' with the date difference as a string -- ${JSON.stringify(opts)}`,
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

    if (!this.parsedDateDiff)
      return `No date diff field specified in configuration.`;
    const left = this.parsedDateDiff[0];
    const right = this.parsedDateDiff[1];

    if (left._value === 0)
      return `must be within ${this.opts.target} and ${right._value} ${right._key}`;
    if (right._value === 0)
      return `must be within ${left._value} ${left._key} and ${this.opts.target}`;
    return `must be within ${left._value} ${left._key} and ${right._value} ${right._key} of ${this.opts.target}`;
  };

  validate = (value: any, data?: Validation.Data): Validator.Result => {
    if (!data)
      throw new Error(
        'This validator validate method must be provided with row context.',
      );

    let otherFieldValue = data.row[this.opts.target];
    // if there is no other field value fail
    if (!otherFieldValue)
      return {
        ok: false,
        kind: this.kind,
        message: `target column '${this.opts.target}' is empty`,
      };

    let originDate = attemptToParseDate(otherFieldValue);
    if (!originDate)
      return {
        ok: false,
        kind: this.kind,
        message: `target column '${this.opts.target}' must be a date`,
      };

    let currentFieldDate = attemptToParseDate(value);
    if (!currentFieldDate)
      return { ok: false, kind: this.kind, message: 'must be a date' };

    if (!isDateInRange(this.parsedDateDiff!, currentFieldDate, originDate)) {
      return { ok: false, kind: this.kind, message: this.message() };
    }
    return { ok: true, kind: this.kind };
  };
}
