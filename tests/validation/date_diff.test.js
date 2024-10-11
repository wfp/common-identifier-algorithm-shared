const ValidationError = require('../../validation/ValidationError')
const makeDateDiffValidator = require('../../validation/date_diff')
const dateFns = require('date-fns')

test("DateDiffValidator", () => {
    const v = makeDateDiffValidator({ value: "3M"})

    function toDateStr(offset) {
        const d = dateFns.add(new Date(), offset);
        const leadingZero = (v) => `${v < 10 ? '0' : ''}${v}`;
        return `${d.getFullYear()}${leadingZero(d.getMonth() + 1)}${leadingZero(d.getDate())}`
    }


    [
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