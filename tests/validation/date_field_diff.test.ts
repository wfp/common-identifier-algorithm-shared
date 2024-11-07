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
import { DateFieldDiffValidator } from "../../validation/validators/date_field_diff.js";

let TEST_SHEET_PARAMS: any = { row: { col_a: "19910101" }, sheet: { name: "", data: [] }, column: "" };

test("DateFieldDiffValidator", () => {
    const v = new DateFieldDiffValidator({ op: "date_field_diff", target: "col_a", value: "-3M:0M" });
    expect(v.validate("19910102", TEST_SHEET_PARAMS)).toEqual({ ok: false, kind: "date_field_diff", message: "must be within -3 months and col_a" });
    expect(v.validate("19910202", TEST_SHEET_PARAMS)).toEqual({ ok: false, kind: "date_field_diff", message: "must be within -3 months and col_a" });

    // the other side of the edge => valid
    expect(v.validate("19901201", TEST_SHEET_PARAMS)).toEqual({ ok: true, kind: "date_field_diff" });
    expect(v.validate("19901001", TEST_SHEET_PARAMS)).toEqual({ ok: true, kind: "date_field_diff" });
    expect(v.validate("19920406", TEST_SHEET_PARAMS)).toEqual({ ok: false, kind: "date_field_diff", message: "must be within -3 months and col_a" });
})

test("DateFieldDiffValidator::positive", () => {
    TEST_SHEET_PARAMS.row.col_a = "20241001";
    const v = new DateFieldDiffValidator({ op: "date_field_diff", target: "col_a", value: ":+12M" });
    expect(v.validate("20241101", TEST_SHEET_PARAMS)).toEqual({ ok: true, kind: "date_field_diff" });
    expect(v.validate("20251001", TEST_SHEET_PARAMS)).toEqual({ ok: true, kind: "date_field_diff" });
    expect(v.validate("20240930", TEST_SHEET_PARAMS)).toEqual({ ok: false, kind: "date_field_diff", message: "must be within col_a and 12 months" });
})

test("DateFieldDiffValidator fails for invalid values", () => {
    const v = new DateFieldDiffValidator({ op: "date_field_diff", target: "col_a", value: "-3M:0M" })

    expect(v.validate(123, TEST_SHEET_PARAMS)).toEqual({ ok: false, kind: "date_field_diff", message: "must be a date"});

    TEST_SHEET_PARAMS.row.col_a = {};
    expect(v.validate("19910101", TEST_SHEET_PARAMS)).toEqual({ ok: false, kind: "date_field_diff", message: "target column 'col_a' must be a date"});
    
    TEST_SHEET_PARAMS.row.col_a = "";
    expect(v.validate("19910101", TEST_SHEET_PARAMS)).toEqual({ ok: false, kind: "date_field_diff", message: "target column 'col_a' is empty"});

    TEST_SHEET_PARAMS.row.col_a = "1991/12/21";
    expect(v.validate("19910101", TEST_SHEET_PARAMS)).toEqual({ ok: false, kind: "date_field_diff", message: "target column 'col_a' must be a date"});
})

test("DateFieldDiffValidator fails for invalid options", () => {
    // @ts-ignore
    expect(() => new DateFieldDiffValidator({})).toThrow()
    // @ts-ignore
    expect(() => new DateFieldDiffValidator({ op: "date_field_diff", value: 123 })).toThrow()
    // @ts-ignore
    expect(() => new DateFieldDiffValidator({ op: "date_field_diff", value: "[[[" })).toThrow()
    // @ts-ignore
    expect(() => new DateFieldDiffValidator({ op: "date_field_diff", target: "col_a", value: 123 })).toThrow()
    // @ts-ignore
    expect(() => new DateFieldDiffValidator({ op: "date_field_diff", target: "col_a", value: "" })).toThrow()
})