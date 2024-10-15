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

const {
    parseDateDiff,
    isValidDateDiff,
    attemptToParseDate,
    formatDateWithDefaultFormat,
    isDateInRange,
} = require('../../validation/date_shared')



test("parseDateDiff", () => {
    [
        ["1M", { months: 1, isPositive: true, _key: "months", _value: 1 }],
        ["-2M", { months: -2, isPositive: false, _key: "months", _value: -2 }],
        ["9Y", { years: 9, isPositive: true, _key: "years", _value: 9 }],
        ["-12d", { days: -12, isPositive: false, _key: "days", _value: -12 }],
        ["1Z", null],

    ].forEach(([input, expected]) => {
        expect(parseDateDiff(input)).toEqual(expected)
        expect(isValidDateDiff(input) ? true : false).toEqual(expected !== null)
    })

})

test("attemptToParseDate", () => {
    const BAD_DATE = null;
    [
        [undefined, undefined],
        [123, BAD_DATE],
        ["1992", BAD_DATE],
        ["1992/12/23", BAD_DATE],
        ["12/23/1991", BAD_DATE],

        ["19911223", new Date(1991, 11, 23)],

    ].forEach(([input, expected]) => {
        expect(attemptToParseDate(input)).toEqual(expected)
    })

})


test("formatDateWithDefaultFormat", () => {
    const BAD_DATE = null;
    [
        [undefined, ""],
        [123, ""],
        [new Date(1991, 11, 11), "19911211"]

    ].forEach(([input, expected]) => {
        expect(formatDateWithDefaultFormat(input)).toEqual(expected)
    })

})

test("isDateInRange", () => {
    // if the target date is on the other side of the edge accept it
    expect(isDateInRange(
        { months: 3, isPositive: true, _key: 'months', _value: 3 },
        new Date("1990-12-31T23:00:00.000Z"),
        new Date("1992-04-05T22:00:00.000Z"),
    )).toEqual(true)

    expect(isDateInRange(
        { months: 3, isPositive: true, _key: 'months', _value: 3 },
        new Date("1991-01-01T23:00:00.000Z"),
        new Date("1990-12-31T23:00:00.000Z"),
    )).toEqual(true)

    expect(isDateInRange(
        { months: 2, isPositive: true, _key: 'months', _value: 2 },
        new Date("2024-11-01T23:00:00.000Z"),
        new Date("2024-10-15T23:00:00.000Z"),
    )).toEqual(true)


    const baseDate = new Date(1991,1,1);
    [
        [{ months: 1, isPositive: true, _key: "months", _value: 1 }, [
            [new Date(1991, 1, 11), true],
            [new Date(1991, 2, 11), false],
        ]],
        [{ months: 3, isPositive: true, _key: "months", _value: 3 }, [
            [new Date(1991, 1, 11), true],
            [new Date(1991, 4, 12), false],
        ]],
        [{ months: -2, isPositive: false, _key: "months", _value: -2 }, [
            [new Date(1991, 0, 11), true],
            [new Date(1990, 10, 11), false],
        ]],

    ].forEach(([input, expecteds]) => {
        expecteds.forEach(([targetDate, expected]) => {
            expect(isDateInRange(input, targetDate, baseDate)).toEqual(expected)
        })
    })



})