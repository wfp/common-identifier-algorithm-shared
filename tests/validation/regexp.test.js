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