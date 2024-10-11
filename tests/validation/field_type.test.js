const makeFieldTypeValidator = require('../../validation/field_type')

test("FieldTypeValidator", () => {

    {
        const v = makeFieldTypeValidator({ value: "str" })

        expect(v.validate(123)).toEqual(v.fail());
        expect(v.validate("123")).toEqual(v.success());

        expect(v.validate(123).toString()).toMatch(/text/)
    }

    {
        const v = makeFieldTypeValidator({ value: "num" })

        expect(v.validate(123)).toEqual(v.success());
        expect(v.validate("123")).toEqual(v.fail());

        expect(v.validate("123").toString()).toMatch(/number/)
    }
})

test("FieldTypeValidator fails for invalid options", () => {
    expect(() => makeFieldTypeValidator({})).toThrow()
    expect(() => makeFieldTypeValidator({ value: { col_a: "A"} })).toThrow()
    expect(() => makeFieldTypeValidator({ value: 123})).toThrow()
    expect(() => makeFieldTypeValidator({ value: "nothing"})).toThrow()
})