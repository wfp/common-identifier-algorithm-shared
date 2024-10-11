
const ValidationError = require('../../validation/ValidationError')
const makeMaxValueValidator = require('../../validation/max_value')

test("MaxValueValidator", () => {
    const v = makeMaxValueValidator({ value: 100})

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

test("MaxValueValidator fails for invalid options", () => {
    expect(() => makeMaxValueValidator({})).toThrow()
    expect(() => makeMaxValueValidator({ value: { col_a: "A"} })).toThrow()
    expect(() => makeMaxValueValidator({ value: "[[[" })).toThrow()
})