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
import { LinkedFieldValidator }from '../../validation/validators/linked_field.js';

let TEST_SHEET_PARAMS = { row: { col_a: "b" }, document: { name: "", data: [] }, column: "" };

test("LinkedFieldValidator", () => {
    const v = new LinkedFieldValidator({ op: "linked_field", target: "col_a" });

    expect(v.validate("a", TEST_SHEET_PARAMS)).toEqual({ ok: true, kind: "linked_field" })
    expect(v.validate("", TEST_SHEET_PARAMS)).toEqual({ ok: true, kind: "linked_field" })

    TEST_SHEET_PARAMS.row.col_a = ""
    expect(v.validate("a", TEST_SHEET_PARAMS)).toEqual({ ok: false, kind: "linked_field", message: "is linked with field 'col_a' which cannot be empty"})

    expect(() => v.validate("a")).toThrow()
});

test("LinkedFieldValidator fails for invalid option value", () => {
    // @ts-ignore
    expect(() => new FieldTypeValidator({ op: "field_type", value: 123 })).toThrow()
})