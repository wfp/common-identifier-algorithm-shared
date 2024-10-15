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
const makeDateDiffValidator = require('../../validation/date_diff')
const dateFns = require('date-fns')

test("DateDiffValidator", () => {
    // just for success and failiure
    const v = makeDateDiffValidator({ value: "3M"})

    function toDateStr(offset) {
        const d = dateFns.add(new Date(), offset);
        const leadingZero = (v) => `${v < 10 ? '0' : ''}${v}`;
        return `${d.getFullYear()}${leadingZero(d.getMonth() + 1)}${leadingZero(d.getDate())}`
    }


    [
        // to allow composition of asymetric positive and negative ranges
        // allow values on the other side of the origin
        [toDateStr({ days: -100}), v.success()],
        [toDateStr({ months: -100}), v.success()],

        [toDateStr({ days: 10}), v.success()],
        [toDateStr({ days: 100}), v.fail()],

        [toDateStr({ months: 1}), v.success()],
        [toDateStr({ months: 3}), v.success()],
        [toDateStr({ months: 3, days: 1}), v.fail()],

    ].forEach(([input, expected]) => {
        expect(v.validate(input)).toEqual(expected)
    })

    expect(v.validate(null)).toBeInstanceOf(ValidationError)

})

test("DateDiffValidator fails for invalid options", () => {
    expect(() => makeDateDiffValidator({})).toThrow()
    expect(() => makeDateDiffValidator({ value: { col_a: "A"} })).toThrow()
    expect(() => makeDateDiffValidator({ value: 123 })).toThrow()
    expect(() => makeDateDiffValidator({ value: "[[[" })).toThrow()
})