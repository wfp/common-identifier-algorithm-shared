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

import { makeLinkedFieldValidator } from '../../validation/linked_field.js';

const TEST_CONFIG = { op: "linked_field", target: "col_a"}
const TEST_SHEET_PARAMS = { sheet: { name: "", data: [] }, column: "" };

test("LinkedFieldValidator", () => {
    const v = makeLinkedFieldValidator(TEST_CONFIG);
    let TEST_ROW = { "col_a": "b" }
    expect(v.validate("a", { row: TEST_ROW, ...TEST_SHEET_PARAMS})).toEqual(v.success())
    expect(v.validate("", { row: TEST_ROW, ...TEST_SHEET_PARAMS})).toEqual(v.success()) // no input value, no check

    TEST_ROW = { "col_a": "" }
    expect(v.validate("a", { row: TEST_ROW, ...TEST_SHEET_PARAMS})?.msg).toEqual("is linked with field 'col_a' which cannot be empty")
});