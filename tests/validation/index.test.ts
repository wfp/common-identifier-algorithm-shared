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

import { makeValidatorListDict, validateDocumentWithListDict, makeValidationResultDocument } from '@/validation/index';
import { OptionsValidator } from '@/validation/validators/options';
import type { Validated } from '@/validation/Validation';
import type { Config } from '@/config/Config';
import type { CidDocument } from '@/document';

import {
  SUPPORTED_VALIDATORS,
  isOptionsValidator,
  isRegexMatchValidator,
  isFieldTypeValidator,
  isLanguageCheckValidator,
  isMaxFieldLengthValidator,
  isMinFieldLengthValidator,
  isMaxValueValidator,
  isMinValueValidator,
  isDateDiffValidator,
  isSameValueForAllRowsValidator,
  isLinkedFieldValidator,
  isDateFieldDiffValidator,
} from '@/validation/Validation';
import { DATE_OPTS } from '@/validation/validators/max_value';

// get the class name
const className = (obj: object) => obj.constructor.name;

describe("validation", () => {
  test('makeValidatorListDict types', () => {
    const TEST_CONFIG: Config.CoreConfiguration['validations'] = {
      col_a: [
        { op: SUPPORTED_VALIDATORS.DATE_DIFF, value: ':3M' },
        { op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, target: 'col_b', value: ':1M' },
        { op: SUPPORTED_VALIDATORS.FIELD_TYPE, value: 'string' },
        { op: SUPPORTED_VALIDATORS.LANGUAGE_CHECK, value: 'arabic' },
        { op: SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH, value: 10 },
        { op: SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH, value: 1 },
        { op: SUPPORTED_VALIDATORS.MAX_VALUE, value: 1000 },
        { op: SUPPORTED_VALIDATORS.MIN_VALUE, value: -1000 },
        { op: SUPPORTED_VALIDATORS.OPTIONS, value: ['A', 'A0'] },
        { op: SUPPORTED_VALIDATORS.REGEX_MATCH, value: 'B[0-9]*' },
        { op: SUPPORTED_VALIDATORS.LINKED_FIELD, target: 'col_b' },
        { op: SUPPORTED_VALIDATORS.SAME_VALUE_FOR_ALL_ROWS },
      ],
    };

    const d = makeValidatorListDict(TEST_CONFIG);
    const v = d.col_a;

    [
      'DateDiffValidator',
      'DateFieldDiffValidator',
      'FieldTypeValidator',
      'LanguageCheckValidator',
      'MaxFieldLengthValidator',
      'MinFieldLengthValidator',
      'MaxValueValidator',
      'MinValueValidator',
      'OptionsValidator',
      'RegexpValidator',
      'LinkedFieldValidator',
      'SameValueForAllRowsValidator',
    ].forEach((name, i) => {
      expect(className(v[i])).toEqual(name);
    });
  });

  test('makeValidatorListDict columns', () => {
    const TEST_CONFIG: Config.CoreConfiguration["validations"] = {
      '*': [{ op: SUPPORTED_VALIDATORS.OPTIONS, value: ['A', 'A0'] }],
      col_a: [],
      col_b: [],
    };

    const d = makeValidatorListDict(TEST_CONFIG);

    expect(d.col_a.length).toEqual(1);
    expect(d.col_b.length).toEqual(1);

    expect(className(d.col_a[0])).toEqual('OptionsValidator');
    expect(className(d.col_b[0])).toEqual('OptionsValidator');
  });

  ////////////////////////////////////////////////////////////////////////////////

  test('validateDocumentWithListDict OK', () => {
    const VALIDATOR_DICT = {
      col_a: [new OptionsValidator({ op: SUPPORTED_VALIDATORS.OPTIONS, value: ['A', 'A0'] })],
      col_b: [new OptionsValidator({ op: SUPPORTED_VALIDATORS.OPTIONS, value: ['B', 'B0'] })],
    };

    const TEST_DOC_OK: CidDocument = {
      name: '',
      data: [
        { col_a: 'A0', col_b: 'B0' },
        { col_a: 'A', col_b: 'B' },
      ],
    };

    const res = validateDocumentWithListDict({ validatorListDict: VALIDATOR_DICT, document: TEST_DOC_OK });

    expect(res.ok).toEqual(true);
    expect(res.results.length).toEqual(2);

    res.results.forEach((result, rowIdx) => {
      expect(result.ok).toEqual(true);
      expect(result.row).toEqual(TEST_DOC_OK.data[rowIdx]);
    });
  });

  test('validateDocumentWithListDict ERROR', () => {
    const VALIDATOR_DICT = {
      col_a: [new OptionsValidator({ op: SUPPORTED_VALIDATORS.OPTIONS, value: ['A', 'A0'] })],
      col_b: [new OptionsValidator({ op: SUPPORTED_VALIDATORS.OPTIONS, value: ['B', 'B0'] })],
    };

    const TEST_DOC_OK = {
      name: 'Sheet 2',
      data: [
        { col_a: 'A1', col_b: 'B1' },
        { col_a: 'A0', col_b: 'B0' },
      ],
    };

    const res = validateDocumentWithListDict({ validatorListDict: VALIDATOR_DICT, document: TEST_DOC_OK });

    expect(res.ok).toEqual(false);
    expect(res.results.length).toEqual(2);

    expect(res.results[1].ok).toEqual(true);

    const errRow = res.results[0];
    expect(errRow.ok).toEqual(false);
    expect(errRow.errors.length).toEqual(2);
    expect(errRow.errors[0].column).toEqual('col_a');
    expect(errRow.errors[1].column).toEqual('col_b');
    expect(errRow.errors[0].errors.length).toEqual(1);
    expect(errRow.errors[1].errors.length).toEqual(1);
  });

  ////////////////////////////////////////////////////////////////////////////////

  test('makeValidationResultDocument', () => {
    const TEST_CONFIG = { columns: [{ name: 'A', alias: 'col_a' }] };

    const TEST_RESULT: Validated.Document = {
      ok: true,
      results: [
        { row: { col_a: 'A0', col_b: 'B0' }, ok: true, errors: [] },
        { row: { col_a: 'A', col_b: 'B' }, ok: true, errors: [] },
      ],
    };

    const doc = makeValidationResultDocument({ sourceConfig: TEST_CONFIG, documentResult: TEST_RESULT });

    expect(doc.name).toEqual('validationResult');
    expect(doc.data).toEqual([
      { errors: '', row_number: 2, col_a: 'A0', col_b: 'B0' },
      { errors: '', row_number: 3, col_a: 'A', col_b: 'B' },
    ]);
  });

  test('makeValidationResultDocument::error', () => {
    const TEST_CONFIG = { columns: [{ name: 'A', alias: 'col_a' }] };

    const TEST_RESULT: Validated.Document = {
      ok: false,
      results: [
        {
          row: { col_a: 'A1', col_b: 'B1' },
          ok: false,
          errors: [
            {
              column: 'col_a',
              errors: [
                {
                  kind: SUPPORTED_VALIDATORS.OPTIONS,
                  message: 'must be one of: "A", "A0"',
                },
              ],
            },
            {
              column: 'col_b',
              errors: [
                {
                  kind: SUPPORTED_VALIDATORS.OPTIONS,
                  message: 'must be one of: "B", "B0"',
                },
              ],
            },
          ],
        },
        { row: { col_a: 'A0', col_b: 'B0' }, ok: true, errors: [] },
      ],
    };

    const doc = makeValidationResultDocument({ sourceConfig: TEST_CONFIG, documentResult: TEST_RESULT });
    const ERR_STR = 'A must be one of: "A", "A0";\ncol_b must be one of: "B", "B0";';

    expect(doc.name).toEqual('validationResult');
    expect(doc.data).toEqual([
      { errors: ERR_STR, row_number: 2, col_a: 'A1', col_b: 'B1' },
      { errors: '', row_number: 3, col_a: 'A0', col_b: 'B0' },
    ]);
  });
});


describe('validation::typeguards', () => {
  const prefix = 'rule';

  describe('isOptionsValidator', () => {
    it('rejects wrong op', () => {
      const msg = isOptionsValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_VALUE, value: [1] } as any);
      expect(msg).toBe(`${prefix} is not a supported validation function, got ${SUPPORTED_VALIDATORS.MIN_VALUE}`);
    });

    it('rejects non-array value', () => {
      const msg = isOptionsValidator(prefix, { op: SUPPORTED_VALIDATORS.OPTIONS, value: 1 } as any);
      expect(msg).toBe(`${prefix}.value must be an Array of numbers or strings, got number`);
    });

    it('rejects empty array', () => {
      const msg = isOptionsValidator(prefix, { op: SUPPORTED_VALIDATORS.OPTIONS, value: [] });
      expect(msg).toBe(`${prefix}.value must be an Array of numbers of strings, got empty Array`);
    });

    it('rejects wrong item types', () => {
      const msg = isOptionsValidator(prefix, { op: SUPPORTED_VALIDATORS.OPTIONS, value: ['ok', { bad: true } as any] });
      expect(msg).toBe(`${prefix}.value must be an Array of number or strings, got object`);
    });

    it('accepts numbers and strings', () => {
      const msg = isOptionsValidator(prefix, { op: SUPPORTED_VALIDATORS.OPTIONS, value: ['a', 2] });
      expect(msg).toBeUndefined();
    });
  });

  describe('isRegexMatchValidator', () => {
    it('rejects wrong op', () => {
      const msg = isRegexMatchValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_VALUE, value: '' } as any);
      expect(msg).toBe(`${prefix} is not a supported validation function, got ${SUPPORTED_VALIDATORS.MIN_VALUE}`);
    });

    it('rejects non-string', () => {
      const msg = isRegexMatchValidator(prefix, { op: SUPPORTED_VALIDATORS.REGEX_MATCH, value: 123 as any });
      expect(msg).toBe(`${prefix}.value must be a non-empty string`);
    });

    it('rejects empty string', () => {
      const msg = isRegexMatchValidator(prefix, { op: SUPPORTED_VALIDATORS.REGEX_MATCH, value: '' });
      expect(msg).toBe(`${prefix}.value must be a non-empty string`);
    });

    it('accepts non-empty string', () => {
      const msg = isRegexMatchValidator(prefix, { op: SUPPORTED_VALIDATORS.REGEX_MATCH, value: '^[a]$' });
      expect(msg).toBeUndefined();
    });
  });

  describe('isFieldTypeValidator', () => {
    it('rejects wrong op', () => {
      const msg = isFieldTypeValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_VALUE, value: 'string' } as any);
      expect(msg).toBe(`${prefix} is not a supported validation function, got ${SUPPORTED_VALIDATORS.MIN_VALUE}`);
    });

    it('rejects non-string value', () => {
      const msg = isFieldTypeValidator(prefix, { op: SUPPORTED_VALIDATORS.FIELD_TYPE, value: 1 as any });
      expect(msg).toBe(`${prefix}.value must be either "number" or "string"`);
    });

    it('rejects wrong string', () => {
      const msg = isFieldTypeValidator(prefix, { op: SUPPORTED_VALIDATORS.FIELD_TYPE, value: 'bool' as any });
      expect(msg).toBe(`${prefix}.value must be either "number" or "string"`);
    });

    it('accepts "string"', () => {
      const msg = isFieldTypeValidator(prefix, { op: SUPPORTED_VALIDATORS.FIELD_TYPE, value: 'string' });
      expect(msg).toBeUndefined();
    });

    it('accepts "number"', () => {
      const msg = isFieldTypeValidator(prefix, { op: SUPPORTED_VALIDATORS.FIELD_TYPE, value: 'number' });
      expect(msg).toBeUndefined();
    });
  });

  describe('isLanguageCheckValidator', () => {
    it('rejects wrong op', () => {
      const msg = isLanguageCheckValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_VALUE, value: '' } as any);
      expect(msg).toBe(`${prefix} is not a supported validation function, got ${SUPPORTED_VALIDATORS.MIN_VALUE}`);
    });

    it('rejects non-string', () => {
      const msg = isLanguageCheckValidator(prefix, { op: SUPPORTED_VALIDATORS.LANGUAGE_CHECK, value: 1 as any });
      expect(msg).toBe(`${prefix}.value must be a non-empty string`);
    });

    it('rejects empty string', () => {
      const msg = isLanguageCheckValidator(prefix, { op: SUPPORTED_VALIDATORS.LANGUAGE_CHECK, value: '' });
      expect(msg).toBe(`${prefix}.value must be a non-empty string`);
    });

    it('accepts non-empty string', () => {
      const msg = isLanguageCheckValidator(prefix, { op: SUPPORTED_VALIDATORS.LANGUAGE_CHECK, value: 'en' });
      expect(msg).toBeUndefined();
    });
  });

  describe('isMaxFieldLengthValidator', () => {
    it('rejects wrong op', () => {
      const msg = isMaxFieldLengthValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_VALUE, value: 10 } as any);
      expect(msg).toBe(`${prefix} is not a supported validation function, got ${SUPPORTED_VALIDATORS.MIN_VALUE}`);
    });

    it('rejects non-number', () => {
      const msg = isMaxFieldLengthValidator(prefix, { op: SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH, value: 'x' as any });
      expect(msg).toBe(`${prefix}.value must be a number`);
    });

    it('accepts number', () => {
      const msg = isMaxFieldLengthValidator(prefix, { op: SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH, value: 10 });
      expect(msg).toBeUndefined();
    });
  });

  describe('isMinFieldLengthValidator', () => {
    it('rejects wrong op', () => {
      const msg = isMinFieldLengthValidator(prefix, { op: SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH, value: 10 } as any);
      expect(msg).toBe(`${prefix} is not a supported validation function, got ${SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH}`);
    });

    it('rejects non-number', () => {
      const msg = isMinFieldLengthValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH, value: 'x' as any });
      expect(msg).toBe(`${prefix}.value must be a number`);
    });

    it('accepts number', () => {
      const msg = isMinFieldLengthValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH, value: 1 });
      expect(msg).toBeUndefined();
    });
  });

  describe('isMaxValueValidator', () => {
    it('rejects wrong op', () => {
      const msg = isMaxValueValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_VALUE, value: 10 } as any);
      expect(msg).toBe(`${prefix} is not a supported validation function, got ${SUPPORTED_VALIDATORS.MIN_VALUE}`);
    });

    it('rejects wrong type', () => {
      const msg = isMaxValueValidator(prefix, { op: SUPPORTED_VALIDATORS.MAX_VALUE, value: { a: 1 } as any });
      expect(msg).toBe(`${prefix}.value must be a number or supported datestring`);
    });

    it('rejects invalid DATE_OPTS string', () => {
      const msg = isMaxValueValidator(prefix, { op: SUPPORTED_VALIDATORS.MAX_VALUE, value: 'not-supported' as any });
      expect(msg).toBe(`${prefix}.value must be a number or supported datestring`);
    });

    it('accepts number', () => {
      const msg = isMaxValueValidator(prefix, { op: SUPPORTED_VALIDATORS.MAX_VALUE, value: 2025 });
      expect(msg).toBeUndefined();
    });

    it('accepts valid DATE_OPTS', () => {
      const anyValid = Object.values(DATE_OPTS)[0] as DATE_OPTS;
      const msg = isMaxValueValidator(prefix, { op: SUPPORTED_VALIDATORS.MAX_VALUE, value: anyValid });
      expect(msg).toBeUndefined();
    });
  });

  describe('isMinValueValidator', () => {
    it('rejects wrong op', () => {
      const msg = isMinValueValidator(prefix, { op: SUPPORTED_VALIDATORS.MAX_VALUE, value: 1 } as any);
      expect(msg).toBe(`${prefix} is not a supported validation function, got ${SUPPORTED_VALIDATORS.MAX_VALUE}`);
    });

    it('rejects non-number', () => {
      const msg = isMinValueValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_VALUE, value: 'x' as any });
      expect(msg).toBe(`${prefix}.value must be a number`);
    });

    it('accepts number', () => {
      const msg = isMinValueValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_VALUE, value: 1 });
      expect(msg).toBeUndefined();
    });
  });

  describe('isDateDiffValidator', () => {
    it('rejects wrong op', () => {
      const msg = isDateDiffValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_VALUE, value: 'P1D' } as any);
      expect(msg).toBe(`${prefix} is not a supported validation function, got ${SUPPORTED_VALIDATORS.MIN_VALUE}`);
    });

    it('rejects non-string', () => {
      const msg = isDateDiffValidator(prefix, { op: SUPPORTED_VALIDATORS.DATE_DIFF, value: 1 as any });
      expect(msg).toBe(`${prefix}.value must be a non-empty string`);
    });

    it('rejects empty string', () => {
      const msg = isDateDiffValidator(prefix, { op: SUPPORTED_VALIDATORS.DATE_DIFF, value: '' });
      expect(msg).toBe(`${prefix}.value must be a non-empty string`);
    });

    it('accepts non-empty string', () => {
      const msg = isDateDiffValidator(prefix, { op: SUPPORTED_VALIDATORS.DATE_DIFF, value: 'P1D' });
      expect(msg).toBeUndefined();
    });
  });

  describe('isSameValueForAllRowsValidator', () => {
    it('rejects wrong op', () => {
      const msg = isSameValueForAllRowsValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_VALUE } as any);
      expect(msg).toBe(`${prefix} is not a supported validation function, got ${SUPPORTED_VALIDATORS.MIN_VALUE}`);
    });

    it('accepts correct op', () => {
      const msg = isSameValueForAllRowsValidator(prefix, { op: SUPPORTED_VALIDATORS.SAME_VALUE_FOR_ALL_ROWS } as any);
      expect(msg).toBeUndefined();
    });
  });

  describe('isLinkedFieldValidator', () => {
    const sourceColumns = ['colA', 'colB'];

    it('rejects wrong op', () => {
      const msg = isLinkedFieldValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_VALUE, target: 'colA' } as any, sourceColumns);
      expect(msg).toBe(`${prefix} is not a supported validation function, got ${SUPPORTED_VALIDATORS.MIN_VALUE}`);
    });

    it('rejects non-string target', () => {
      const msg = isLinkedFieldValidator(prefix, { op: SUPPORTED_VALIDATORS.LINKED_FIELD, target: 1 as any }, sourceColumns);
      expect(msg).toBe(`${prefix}.target must be a non-empty string`);
    });

    it('rejects empty target', () => {
      const msg = isLinkedFieldValidator(prefix, { op: SUPPORTED_VALIDATORS.LINKED_FIELD, target: '' }, sourceColumns);
      expect(msg).toBe(`${prefix}.target must be a non-empty string`);
    });

    it('rejects when sourceColumns provided and missing target', () => {
      const msg = isLinkedFieldValidator(prefix, { op: SUPPORTED_VALIDATORS.LINKED_FIELD, target: 'missing' }, sourceColumns);
      expect(msg).toBe(`${prefix} does not have a corresponding [source] column`);
    });

    it('accepts valid target in sourceColumns', () => {
      const msg = isLinkedFieldValidator(prefix, { op: SUPPORTED_VALIDATORS.LINKED_FIELD, target: 'colA' }, sourceColumns);
      expect(msg).toBeUndefined();
    });

    it('accepts valid target when sourceColumns undefined', () => {
      const msg = isLinkedFieldValidator(prefix, { op: SUPPORTED_VALIDATORS.LINKED_FIELD, target: 'colA' }, undefined);
      expect(msg).toBeUndefined();
    });
  });

  describe('isDateFieldDiffValidator', () => {
    const sourceColumns = ['startDate', 'endDate'];

    it('rejects wrong op', () => {
      const msg = isDateFieldDiffValidator(prefix, { op: SUPPORTED_VALIDATORS.MIN_VALUE, target: 'startDate', value: 'P1D' } as any, sourceColumns);
      expect(msg).toBe(`${prefix} is not a supported validation function, got ${SUPPORTED_VALIDATORS.MIN_VALUE}`);
    });

    it('rejects non-string value', () => {
      const msg = isDateFieldDiffValidator(prefix, { op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, target: 'startDate', value: 1 as any }, sourceColumns);
      expect(msg).toBe(`${prefix}.value must be a non-empty string`);
    });

    it('rejects empty value', () => {
      const msg = isDateFieldDiffValidator(prefix, { op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, target: 'startDate', value: '' }, sourceColumns);
      expect(msg).toBe(`${prefix}.value must be a non-empty string`);
    });

    it('rejects non-string target', () => {
      const msg = isDateFieldDiffValidator(prefix, { op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, target: 1 as any, value: 'P1D' }, sourceColumns);
      expect(msg).toBe(`${prefix}.target must be a non-empty string`);
    });

    it('rejects empty target', () => {
      const msg = isDateFieldDiffValidator(prefix, { op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, target: '', value: 'P1D' }, sourceColumns);
      expect(msg).toBe(`${prefix}.target must be a non-empty string`);
    });

    it('rejects when sourceColumns provided and missing target', () => {
      const msg = isDateFieldDiffValidator(prefix, { op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, target: 'missing', value: 'P1D' }, sourceColumns);
      expect(msg).toBe(`${prefix} does not have a corresponding [source] column`);
    });

    it('accepts valid target and value', () => {
      const msg = isDateFieldDiffValidator(prefix, { op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, target: 'startDate', value: 'P1D' }, sourceColumns);
      expect(msg).toBeUndefined();
    });

    it('accepts when sourceColumns undefined', () => {
      const msg = isDateFieldDiffValidator(prefix, { op: SUPPORTED_VALIDATORS.DATE_FIELD_DIFF, target: 'startDate', value: 'P1D' }, undefined);
      expect(msg).toBeUndefined();
    });
  });
});