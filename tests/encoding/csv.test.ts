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


import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { existsSync, unlinkSync, readFileSync } from 'node:fs';
import { makeCsvEncoder } from '../../encoding/csv.js';
import { Config } from '../../config/Config.js';
import { CidDocument } from '../../document.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEST_MAPPING: Config.ColumnMap = {
    postfix: "_POSTFIX",
    columns: [
        { name: "A", alias: "col_a" },
        { name: "B", alias: "col_b" },
    ],
}

const TEST_DOC: CidDocument = {
    name: "qwerty",
    data: [
            {col_a: "A0", col_b: "B0" },
            {col_a: "A1", col_b: "B1" },
    ]
};

test("makeCsvEncoder creation", () => {
    const e = makeCsvEncoder(TEST_MAPPING);

    const test_output_path = join(__dirname, "csv_encoder_test")
    const test_output_path_postfixed = join(__dirname, "csv_encoder_test_POSTFIX.csv")

    if (existsSync(test_output_path_postfixed)) {
        unlinkSync(test_output_path_postfixed);
    }

    e.encodeDocument(TEST_DOC, test_output_path)

    expect(readFileSync(test_output_path_postfixed, 'utf-8')).toEqual("A,B\nA0,B0\nA1,B1\n")
    
    if (existsSync(test_output_path_postfixed)) {
        unlinkSync(test_output_path_postfixed);
    }

});

test("CsvEncoder::must start document before writing or ending", () => {
    const e = makeCsvEncoder(TEST_MAPPING);

    expect(() => e.writeDocument(TEST_DOC)).toThrow();
    expect(e.endDocument()).toBe(undefined);
})