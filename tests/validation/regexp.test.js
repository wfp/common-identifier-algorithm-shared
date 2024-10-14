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
const makeRegexpValidator = require('../../validation/regexp')

test("RegexpValidator", () => {
    const v = makeRegexpValidator({ value: "[a-eA-E0-9]*" })

    expect(v.validate(null)).toBeInstanceOf(ValidationError)

    expect(v.validate("")).toEqual(v.success())
    expect(v.validate("A")).toEqual(v.success())
    expect(v.validate("Ac876")).toEqual(v.success())

    expect(v.validate("AF876")).toEqual(v.fail())
    expect(v.validate(" ")).toEqual(v.fail())
    expect(v.validate("fff")).toEqual(v.fail())
})

test("RegexpValidator fails for invalid regexp", () => {
    expect(() => makeRegexpValidator({})).toThrow()
    expect(() => makeRegexpValidator({ value: 123 })).toThrow()
    expect(() => makeRegexpValidator({ value: "[[[" })).toThrow()
})