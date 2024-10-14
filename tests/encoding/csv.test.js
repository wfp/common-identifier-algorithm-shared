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


const makeCsvEncoder = require('../../encoding/csv');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const TEST_MAPPING = {
    postfix: "_POSTFIX",
    columns: [
        { name: "A", alias: "col_a" },
        { name: "B", alias: "col_b" },
    ],
}

const TEST_DOC = {
        sheets: [
            { name: "sheet1", data: [
                {col_a: "A0", col_b: "B0" },
                {col_a: "A1", col_b: "B1" },
            ]}
        ]
    };

test("fail when calling without calling startDocument before", () => {
    const e = makeCsvEncoder(TEST_MAPPING);

    // fail when calling writeSheet whout
    expect(() => { e.writeSheet("sheet", "config", { current:0, length:1 }) } ).toThrow()

})

test("makeCsvEncoder creation", () => {
    const e = makeCsvEncoder(TEST_MAPPING);

    const test_output_path = path.join(__dirname, "csv_encoder_test")
    const test_output_path_postfixed = path.join(__dirname, "csv_encoder_test_POSTFIX.csv")

    if (fs.existsSync(test_output_path_postfixed)) {
        fs.unlinkSync(test_output_path_postfixed);
    }

    e.encodeDocument(TEST_DOC, test_output_path)

    expect(fs.readFileSync(test_output_path_postfixed, 'utf-8')).toEqual("A,B\nA0,B0\nA1,B1\n")

    fs.unlinkSync(test_output_path_postfixed);
})