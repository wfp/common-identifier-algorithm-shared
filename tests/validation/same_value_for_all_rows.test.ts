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

import { Validation, ValidationError } from '../../validation/Validation.js'
import { makeSameValueForAllRowsValidator } from '../../validation/same_value_for_all_rows.js';


const TEST_SHEET = {
    name: "TEST",
    data: [
        { col_a: "A", col_b: "B" },
    ]
}
test("SameValueForAllRowsValidator", () => {
    const v = makeSameValueForAllRowsValidator({ op: "", value: ""})

    const contextA: Validation.Data = { sheet: TEST_SHEET, column: "col_a", row: [] }
    const contextB: Validation.Data = { sheet: TEST_SHEET, column: "col_b", row: [] }

    expect(v.validate("A", contextA )).toEqual(v.success());
    expect(v.validate("B", contextA )).toEqual(v.fail());
    expect(v.validate("A0", contextA )).toEqual(v.fail());

    expect(v.validate("B", contextB )).toEqual(v.success());
    expect(v.validate("A", contextB )).toEqual(v.fail());
    expect(v.validate("B0", contextB )).toEqual(v.fail());

    expect(v.validate(null, contextB)).toBeInstanceOf(ValidationError)

})
