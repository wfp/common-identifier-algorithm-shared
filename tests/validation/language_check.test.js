const makeLanguageCheckValidator = require('../../validation/language_check')

test("LanguageCheckValidator", () => {

    const v = makeLanguageCheckValidator({ value: "arabic" })

    expect(v.validate("ABCD")).toEqual(v.fail());
    expect(v.validate("ميار")).toEqual(v.success());
    expect(v.validate("吉")).toEqual(v.fail());


})

test("LanguageCheckValidator fails for invalid options", () => {
    expect(() => makeLanguageCheckValidator({})).toThrow()
    expect(() => makeLanguageCheckValidator({ value: { col_a: "A"} })).toThrow()
    expect(() => makeLanguageCheckValidator({ value: 123})).toThrow()
    expect(() => makeLanguageCheckValidator({ value: "nothing"})).toThrow()
})