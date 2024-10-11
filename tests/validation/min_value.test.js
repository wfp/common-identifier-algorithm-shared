
const ValidationError = require('../../validation/ValidationError')
const makeMinValueValidator = require('../../validation/min_value')

test("MinValueValidator", () => {
    const v = makeMinValueValidator({ value: 100})

    expect(v.validate(null)).toBeInstanceOf(ValidationError)

    expect(v.validate("")).toEqual(v.fail())

    expect(v.validate("1")).toEqual(v.fail())
    expect(v.validate("10")).toEqual(v.fail())
    expect(v.validate("100")).toEqual(v.success())
    expect(v.validate("1000")).toEqual(v.success())

    expect(v.validate(1)).toEqual(v.fail())
    expect(v.validate(10)).toEqual(v.fail())
    expect(v.validate(100)).toEqual(v.success())
    expect(v.validate(1000)).toEqual(v.success())

    expect(v.validate("AAB")).toEqual(v.fail())
    expect(v.validate(" ")).toEqual(v.fail())
    expect(v.validate("ab")).toEqual(v.fail())
})

test("MinValueValidator fails for invalid options", () => {
    expect(() => makeMinValueValidator({})).toThrow()
    expect(() => makeMinValueValidator({ value: { col_a: "A"} })).toThrow()
    expect(() => makeMinValueValidator({ value: "[[[" })).toThrow()
})