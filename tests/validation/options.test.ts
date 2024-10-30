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
import { makeOptionsValidator } from "../../validation/options.js";

test("OptionsValidator", () => {
    const v = makeOptionsValidator({ op: "options", value: ["A", "B", "AB" ]})

    expect(v.validate(null)).toBeInstanceOf(ValidationError)

    expect(v.validate("")).toEqual(v.fail())
    expect(v.validate("A")).toEqual(v.success())
    expect(v.validate("B")).toEqual(v.success())
    expect(v.validate("AB")).toEqual(v.success())
    expect(v.validate("AAB")).toEqual(v.fail())
    expect(v.validate(" ")).toEqual(v.fail())
    expect(v.validate("ab")).toEqual(v.fail())
})

test("OptionsValidator fails for invalid options", () => {
    expect(() => makeOptionsValidator({ op: "options", value: 123 })).toThrow()
    expect(() => makeOptionsValidator({ op: "options", value: "[[[" })).toThrow()
})