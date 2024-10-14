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
const makeMinFieldLengthValidator = require('../../validation/min_field_length')

test("MinFieldLengthValidator", () => {
    const v = makeMinFieldLengthValidator({ value: 2 })

    expect(v.validate(null)).toBeInstanceOf(ValidationError)

    expect(v.validate("")).toEqual(v.fail())
    expect(v.validate(" ")).toEqual(v.fail())

    expect(v.validate("A")).toEqual(v.fail())
    expect(v.validate("AB")).toEqual(v.success())
    expect(v.validate("ABC")).toEqual(v.success())
    expect(v.validate("ABCD")).toEqual(v.success())

    expect(v.validate(1)).toEqual(v.fail())
    expect(v.validate(10)).toEqual(v.success())
    expect(v.validate(100)).toEqual(v.success())
    expect(v.validate(1000)).toEqual(v.success())

})

test("MinFieldLengthValidator fails for invalid options", () => {
    expect(() => makeMinFieldLengthValidator({})).toThrow()
    expect(() => makeMinFieldLengthValidator({ value: { col_a: "A"} })).toThrow()
    expect(() => makeMinFieldLengthValidator({ value: "[[[" })).toThrow()
})