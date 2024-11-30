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

import { SUPPORTED_VALIDATORS } from '../Validation.js';
import type { Validator } from '../Validation.js';

export class RegexpValidator implements Validator.Base {
  kind = SUPPORTED_VALIDATORS.REGEX_MATCH;
  opts: Validator.Options.RegexMatch;

  rx: RegExp;
  regexp: string;

  constructor(opts: Validator.Options.RegexMatch) {
    if (typeof opts.value !== 'string') {
      throw new Error(
        `Regexp validator must have a 'value' with a regexp -- options are: ${JSON.stringify(opts)}`,
      );
    }

    // attempt to compile the regexp
    try {
      this.rx = new RegExp(this.wrapRegexpString(opts.value));
    } catch (e) {
      throw new Error(`Error while compiling regular expression: "${opts.value}": ${e}`);
    }

    this.opts = opts;

    // extract the regular expression
    this.regexp = opts.value;
    // allocate the regular expression
    this.rx = new RegExp(this.wrapRegexpString(opts.value));
  }

  // Returns the regexp string rx wrapped in "^...$" -- to ensure that the whole test string is checked
  // TODO: is this really need for all use-cases?
  wrapRegexpString = (rx: string) => `^${rx}$`;

  // the default message
  message = () => {
    if (this.opts.message) return this.opts.message;
    return `must match regular expression /^${this.regexp}$/`;
  };

  // the core validation function that takes a field and returns nothing / a validationError
  validate = (value: unknown): Validator.Result => {
    // null and undefined cannot be converted to string, so fail here
    if (typeof value === 'undefined' || value === null) {
      return { ok: false, kind: this.kind, message: 'must not be empty' };
    }
    // Convert the value to string
    const stringValue = value.toString();
    // check if the regexp matches
    if (this.rx.test(stringValue)) {
      return { ok: true, kind: this.kind };
    }

    // fail if not
    return { ok: false, kind: this.kind, message: this.message() };
  };
}
