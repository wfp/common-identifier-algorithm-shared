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

const ValidationError = require('../../validation/ValidationError')
const makeDateFieldDiffValidator = require('../../validation/date_field_diff')

const TEST_CONFIG = { target: "col_a", value: "-3M" };
const TEST_ROW = { col_a: "19910101" };

test("DateFieldDiffValidator", () => {
    const v = makeDateFieldDiffValidator(TEST_CONFIG);


    [
        ["19910102", v.success()],
        ["19910202", v.success()],

        // the other side of the edge => valid
        ["19900202", v.success()],
        ["19920406", v.fail()],
    ].forEach(([input, expected]) => {
        expect(v.validate(input, { row: TEST_ROW })).toEqual(expected)
    })

})

test("DateFieldDiffValidator fails for invalid values", () => {
    const v = makeDateFieldDiffValidator(TEST_CONFIG)

    expect(v.validate(123, { row: TEST_ROW })).toBeInstanceOf(ValidationError)
    expect(v.validate("19910101", { row: {} })).toBeInstanceOf(ValidationError)
    expect(v.validate("19910101", { row: { col_a: "1991/12/21" } })).toBeInstanceOf(ValidationError)
})

test("DateFieldDiffValidator fails for invalid options", () => {
    expect(() => makeDateFieldDiffValidator({})).toThrow()
    expect(() => makeDateFieldDiffValidator({ value: { col_a: "A"} })).toThrow()
    expect(() => makeDateFieldDiffValidator({ value: 123 })).toThrow()
    expect(() => makeDateFieldDiffValidator({ value: "[[[" })).toThrow()

    expect(() => makeDateFieldDiffValidator({ target: 123 })).toThrow()
    expect(() => makeDateFieldDiffValidator({ target: "col_a", value: 123 })).toThrow()
    expect(() => makeDateFieldDiffValidator({ target: "col_a", value: "" })).toThrow()
})