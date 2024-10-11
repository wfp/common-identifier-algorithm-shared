
const ValidationError = require('../../validation/ValidationError')
const makeMaxFieldLengthValidator = require('../../validation/max_field_length')

test("MaxFieldLengthValidator", () => {
    const v = makeMaxFieldLengthValidator({ value: 2 })

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
    expect(() => makeMaxFieldLengthValidator({})).toThrow()
    expect(() => makeMaxFieldLengthValidator({ value: { col_a: "A"} })).toThrow()
    expect(() => makeMaxFieldLengthValidator({ value: "[[[" })).toThrow()
})