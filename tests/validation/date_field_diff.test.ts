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

import { ValidationError } from '../../validation/Validation.js';
import { makeDateFieldDiffValidator } from '../../validation/date_field_diff.js';

const TEST_ROW = { col_a: "19910101" };
const TEST_SHEET_PARAMS = { sheet: { name: "", data: [] }, column: "" };

test("DateFieldDiffValidator", () => {
    const TEST_CONFIG = { op: "", target: "col_a", value: "-3M:0M" };
    const v = makeDateFieldDiffValidator(TEST_CONFIG);
    expect(v.validate("19910102", { row: TEST_ROW, ...TEST_SHEET_PARAMS})).toEqual(v.fail());
    expect(v.validate("19910202", { row: TEST_ROW, ...TEST_SHEET_PARAMS})).toEqual(v.fail());

    // the other side of the edge => valid
    expect(v.validate("19901201", { row: TEST_ROW, ...TEST_SHEET_PARAMS})).toEqual(v.success());
    expect(v.validate("19901001", { row: TEST_ROW, ...TEST_SHEET_PARAMS})).toEqual(v.success());
    expect(v.validate("19920406", { row: TEST_ROW, ...TEST_SHEET_PARAMS})).toEqual(v.fail());
})

test("DateFieldDiffValidator::positive", () => {
    let testRow = { col_a: "20241001" }
    const TEST_CONFIG = { op: "", target: "col_a", value: ":+12M" };
    const v = makeDateFieldDiffValidator(TEST_CONFIG);
    expect(v.validate("20241101", { row: testRow, ...TEST_SHEET_PARAMS})).toEqual(v.success());
    expect(v.validate("20251001", { row: testRow, ...TEST_SHEET_PARAMS})).toEqual(v.success());
    expect(v.validate("20240930", { row: testRow, ...TEST_SHEET_PARAMS})).toEqual(v.fail());
})

test("DateFieldDiffValidator fails for invalid values", () => {
    const TEST_CONFIG = { op: "", target: "col_a", value: "-3M:0M" };
    const v = makeDateFieldDiffValidator(TEST_CONFIG)

    expect(v.validate(123, { row: TEST_ROW, ...TEST_SHEET_PARAMS })).toBeInstanceOf(ValidationError)
    expect(v.validate("19910101", { row: {}, ...TEST_SHEET_PARAMS })).toBeInstanceOf(ValidationError)
    expect(v.validate("19910101", { row: { col_a: "1991/12/21" }, ...TEST_SHEET_PARAMS })).toBeInstanceOf(ValidationError)
})

test("DateFieldDiffValidator fails for invalid options", () => {
    // expect(() => makeDateFieldDiffValidator({})).toThrow()
    // expect(() => makeDateFieldDiffValidator({ op: "date_field_diff", value: { col_a: "A"} })).toThrow()
    expect(() => makeDateFieldDiffValidator({ op: "date_field_diff", value: 123 })).toThrow()
    expect(() => makeDateFieldDiffValidator({ op: "date_field_diff", value: "[[[" })).toThrow()

    // expect(() => makeDateFieldDiffValidator({ op: "date_field_diff", target: 123 })).toThrow()
    expect(() => makeDateFieldDiffValidator({ op: "date_field_diff", target: "col_a", value: 123 })).toThrow()
    expect(() => makeDateFieldDiffValidator({ op: "date_field_diff", target: "col_a", value: "" })).toThrow()
})