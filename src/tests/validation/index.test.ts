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

import { Config }from '../../config/Config.js';
import { makeValidatorListDict, validateDocumentWithListDict, makeValidationResultDocument }from '../../validation/index.js';
import { OptionsValidator }from '../../validation/validators/options.js';
import { SUPPORTED_VALIDATORS, Validation }from '../../validation/Validation.js';
import { CidDocument }from '../../document.js';

// get the class name
const className = (obj: object) => obj.constructor.name;

test("makeValidatorListDict types", () => {
    const TEST_CONFIG: Config.Options["validations"] = {
        "col_a": [
            { op: "date_diff", value: ":3M" },
            { op: "date_field_diff", target: "col_b", value: ":1M" },
            { op: "field_type", value: "string" },
            { op: "language_check", value: "arabic" },
            { op: "max_field_length", value: 10 },
            { op: "min_field_length", value: 1 },
            { op: "max_value", value: 1000 },
            { op: "min_value", value: -1000 },
            { op: "options", value: ["A", "A0"]},
            { op: "regex_match", value: "B[0-9]*"},
            { op: "linked_field", target: "col_b" },
            { op: "same_value_for_all_rows" },
        ],
    }

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
        expect(className(v[i])).toEqual(name)
    })

})

test("makeValidatorListDict columns", () => {
    const TEST_CONFIG = {
        "*": [ { op: "options", value: ["A", "A0"]} ],
        col_a: [],
        col_b: [],
    }


    const d = makeValidatorListDict(TEST_CONFIG);

    expect(d.col_a.length).toEqual(1)
    expect(d.col_b.length).toEqual(1)

    expect(className(d.col_a[0])).toEqual('OptionsValidator')
    expect(className(d.col_b[0])).toEqual('OptionsValidator')

})



////////////////////////////////////////////////////////////////////////////////


test("validateDocumentWithListDict OK", () => {
    const VALIDATOR_DICT = {
        col_a: [ new OptionsValidator({ op: "options", value: ["A", "A0" ]}) ],
        col_b: [ new OptionsValidator({ op: "options", value: ["B", "B0" ]}) ],
    }

    const TEST_DOC_OK: CidDocument = {
        name: "",
        data: [
            { col_a: "A0", col_b: "B0" },
            { col_a: "A", col_b: "B" },
        ]
    }

    const res = validateDocumentWithListDict(VALIDATOR_DICT, TEST_DOC_OK)

    expect(res.ok).toEqual(true);
    expect(res.results.length).toEqual(2);

    res.results.forEach((result, rowIdx) => {
        expect(result.ok).toEqual(true);
        expect(result.row).toEqual(TEST_DOC_OK.data[rowIdx])
    })
})

test("validateDocumentWithListDict ERROR", () => {
    const VALIDATOR_DICT = {
        col_a: [ new OptionsValidator({ op: "options", value: ["A", "A0" ]}) ],
        col_b: [ new OptionsValidator({ op: "options", value: ["B", "B0" ]}) ],
    }

    const TEST_DOC_OK = {
        name: "Sheet 2",
        data: [
            { col_a: "A1", col_b: "B1" },
            { col_a: "A0", col_b: "B0" },
        ]
    }

    const res = validateDocumentWithListDict(VALIDATOR_DICT, TEST_DOC_OK)

    expect(res.ok).toEqual(false);
    expect(res.results.length).toEqual(2);

    expect(res.results[1].ok).toEqual(true)

    const errRow = res.results[0];
    expect(errRow.ok).toEqual(false);
    expect(errRow.errors.length).toEqual(2);
    expect(errRow.errors[0].column).toEqual("col_a");
    expect(errRow.errors[1].column).toEqual("col_b");
    expect(errRow.errors[0].errors.length).toEqual(1);
    expect(errRow.errors[1].errors.length).toEqual(1);
})


////////////////////////////////////////////////////////////////////////////////


test("makeValidationResultDocument", () => {
    const TEST_CONFIG = { columns: [ { name: "A", alias: "col_a" } ]};

    const TEST_RESULT: Validation.DocumentResult = {
        ok: true,
        results: [
            { row: { col_a: 'A0', col_b: 'B0' }, ok: true, errors: [] },
            { row: { col_a: 'A', col_b: 'B' }, ok: true, errors: [] }
        ]
    }

    const doc = makeValidationResultDocument(TEST_CONFIG, TEST_RESULT);

    expect(doc.name).toEqual("validationResult");
    expect(doc.data).toEqual([
        { errors: '', row_number: 2, col_a: "A0", col_b: "B0" },
        { errors: '', row_number: 3, col_a: "A",  col_b: "B" },
    ]);
});

test("makeValidationResultDocument::error", () => {
    const TEST_CONFIG = { columns: [ { name: "A", alias: "col_a" } ]};

    const TEST_RESULT: Validation.DocumentResult = {
        ok: false,
        results: [
            {
                row: { col_a: 'A1', col_b: 'B1' },
                ok: false,
                errors: [
                    { column: 'col_a', errors: [ { kind: SUPPORTED_VALIDATORS.OPTIONS, message: 'must be one of: "A", "A0"' }]},
                    { column: 'col_b', errors: [ { kind: SUPPORTED_VALIDATORS.OPTIONS, message: 'must be one of: "B", "B0"' }]}
                ]
            },
            { row: { col_a: 'A0', col_b: 'B0' }, ok: true, errors: [] }
            ]
        }

    const doc = makeValidationResultDocument(TEST_CONFIG, TEST_RESULT);
    const ERR_STR = 'A must be one of: "A", "A0";\ncol_b must be one of: "B", "B0";';

    expect(doc.name).toEqual("validationResult");
    expect(doc.data).toEqual([
        { errors: ERR_STR, row_number: 2, col_a: "A1", col_b: "B1" },
        { errors: '', row_number: 3, col_a: "A0", col_b: "B0" },
    ]);
})