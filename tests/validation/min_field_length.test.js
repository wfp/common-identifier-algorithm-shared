
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