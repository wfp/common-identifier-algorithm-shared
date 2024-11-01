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


import {ValidationError} from '../../validation/Validation.js'
import {makeMaxValueValidator} from '../../validation/max_value.js'

test("MaxValueValidator", () => {
    const v = makeMaxValueValidator({ op: "max_value", value: 100})

    expect(v.validate(null)).toBeInstanceOf(ValidationError)

    expect(v.validate("")).toEqual(v.fail())

    expect(v.validate("1")).toEqual(v.success())
    expect(v.validate("10")).toEqual(v.success())
    expect(v.validate("100")).toEqual(v.success())
    expect(v.validate("1000")).toEqual(v.fail())

    expect(v.validate(1)).toEqual(v.success())
    expect(v.validate(10)).toEqual(v.success())
    expect(v.validate(100)).toEqual(v.success())
    expect(v.validate(1000)).toEqual(v.fail())

    expect(v.validate("AAB")).toEqual(v.fail())
    expect(v.validate(" ")).toEqual(v.fail())
    expect(v.validate("ab")).toEqual(v.fail())
})

test("MaxValueValidator::dateString [year]", () => {
    const v = makeMaxValueValidator({ op: "max_value", value: "{{currentYear}}"})

    expect(v.validate("1")).toEqual(v.success())
    expect(v.validate("10")).toEqual(v.success())
    expect(v.validate("100")).toEqual(v.success())
    expect(v.validate("3000")).toEqual(v.fail())

    expect(v.validate(1)).toEqual(v.success())
    expect(v.validate(10)).toEqual(v.success())
    expect(v.validate(100)).toEqual(v.success())
    expect(v.validate(3000)).toEqual(v.fail())

    expect(v.validate("AAB")).toEqual(v.fail())
    expect(v.validate(" ")).toEqual(v.fail())
    expect(v.validate("ab")).toEqual(v.fail())
})

test("MaxValueValidator::dateString [month]", () => {
    const v = makeMaxValueValidator({ op: "max_value", value: "{{currentMonth}}"})

    const month = new Date().getUTCMonth();

    expect(v.validate(month-2)).toEqual(v.success())
    expect(v.validate(month-1)).toEqual(v.success())
    expect(v.validate(month)).toEqual(v.success())
    expect(v.validate(month+1)).toEqual(v.success())
    expect(v.validate(month+2)).toEqual(v.fail())
})

test("MaxValueValidator fails for invalid options", () => {
    expect(() => makeMaxValueValidator({ op: "max_value", value: "[[[" })).toThrow()
})