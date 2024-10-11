const ValidationError = require('../../validation/ValidationError')
const makeOptionsValidator = require('../../validation/options')

test("OptionsValidator", () => {
    const v = makeOptionsValidator({ value: ["A", "B", "AB" ]})

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
    expect(() => makeOptionsValidator({})).toThrow()
    expect(() => makeOptionsValidator({ value: { col_a: "A"} })).toThrow()
    expect(() => makeOptionsValidator({ value: 123 })).toThrow()
    expect(() => makeOptionsValidator({ value: "[[[" })).toThrow()
})