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
import {makeMaxFieldLengthValidator} from '../../validation/max_field_length.js';

test("MaxFieldLengthValidator", () => {
    const v = makeMaxFieldLengthValidator({ op: "max_field_length", value: 2 })

    expect(v.validate(null)).toBeInstanceOf(ValidationError)

    expect(v.validate("")).toEqual(v.success())
    expect(v.validate(" ")).toEqual(v.success())

    expect(v.validate("A")).toEqual(v.success())
    expect(v.validate("AB")).toEqual(v.success())
    expect(v.validate("ABC")).toEqual(v.fail())
    expect(v.validate("ABCD")).toEqual(v.fail())

    expect(v.validate(1)).toEqual(v.success())
    expect(v.validate(10)).toEqual(v.success())
    expect(v.validate(100)).toEqual(v.fail())
    expect(v.validate(1000)).toEqual(v.fail())
})

test("MaxFieldLengthValidator fails for invalid options", () => {
    expect(() => makeMaxFieldLengthValidator({ op: "max_field_length", value: "[[[" })).toThrow()
})