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

const SUPPORTED_FIELD_TYPES = [
  { type: 'string', value: 'text' },
  { type: 'number', value: 'number' },
];

export class FieldTypeValidator implements Validator.Base {
  kind = SUPPORTED_VALIDATORS.FIELD_TYPE;
  opts: Validator.Options.FieldType;
  fieldType: string;
  fieldTypeName: string;

  constructor(opts: Validator.Options.FieldType) {
    if (typeof opts.value !== 'string') {
      throw new Error(
        `FieldType validator must have a 'value' with the field type -- ${JSON.stringify(opts)}`,
      );
    }

    // ensure compatibilty
    const fieldType = opts.value.toLowerCase();

    const matched = SUPPORTED_FIELD_TYPES.find((t) => t.type === fieldType);

    if (!matched) {
      throw new Error(`Cannot find field type: '${fieldType}' for field_type validator`);
    }

    this.fieldType = fieldType;
    this.fieldTypeName = matched.value;
    this.opts = opts;
  }

  message = (msg: string = '') => (this.opts.message ? this.opts.message : msg);

  validate = (value: unknown): Validator.Result => {
    if (typeof value === 'string' && this.fieldType === 'string') return { ok: true, kind: this.kind };
    if (typeof value === 'number' && this.fieldType === 'number') return { ok: true, kind: this.kind };

    return {
      ok: false,
      kind: this.kind,
      message: this.message(`must be of type: ${this.fieldTypeName}`),
    };
  };
}
