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
const makeSameValueForAllRowsValidator = require('../../validation/same_value_for_all_rows')


const TEST_SHEET = {
    name: "TEST",
    data: [
        { col_a: "A", col_b: "B" },
    ]
}
test("SameValueForAllRowsValidator", () => {
    const v = makeSameValueForAllRowsValidator({})



    expect(v.validate("A", { sheet: TEST_SHEET, column: "col_a" } )).toEqual(v.success());
    expect(v.validate("B", { sheet: TEST_SHEET, column: "col_a" } )).toEqual(v.fail());
    expect(v.validate("A0", { sheet: TEST_SHEET, column: "col_a" } )).toEqual(v.fail());

    expect(v.validate("B", { sheet: TEST_SHEET, column: "col_b" } )).toEqual(v.success());
    expect(v.validate("A", { sheet: TEST_SHEET, column: "col_b" } )).toEqual(v.fail());
    expect(v.validate("B0", { sheet: TEST_SHEET, column: "col_b" } )).toEqual(v.fail());

    expect(v.validate(null, { sheet: TEST_SHEET, column: "col_b" })).toBeInstanceOf(ValidationError)

})
