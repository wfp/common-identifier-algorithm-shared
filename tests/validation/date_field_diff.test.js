const ValidationError = require('../../validation/ValidationError')
const makeDateFieldDiffValidator = require('../../validation/date_field_diff')

const TEST_CONFIG = { target: "col_a", value: "-3M" };
const TEST_ROW = { col_a: "19910101" };

test("DateFieldDiffValidator", () => {
    const v = makeDateFieldDiffValidator(TEST_CONFIG);


    [
        ["19910102", v.success()],
        ["19910202", v.success()],

        ["19900202", v.fail()],
        ["19920406", v.fail()],
    ].forEach(([input, expected]) => {
        expect(v.validate(input, { row: TEST_ROW })).toEqual(expected)
    })

})

test("DateFieldDiffValidator fails for invalid values", () => {
    const v = makeDateFieldDiffValidator(TEST_CONFIG)

    expect(v.validate(123, { row: TEST_ROW })).toBeInstanceOf(ValidationError)
    expect(v.validate("19910101", { row: {} })).toBeInstanceOf(ValidationError)
    expect(v.validate("19910101", { row: { col_a: "1991/12/21" } })).toBeInstanceOf(ValidationError)
})

test("DateFieldDiffValidator fails for invalid options", () => {
    expect(() => makeDateFieldDiffValidator({})).toThrow()
    expect(() => makeDateFieldDiffValidator({ value: { col_a: "A"} })).toThrow()
    expect(() => makeDateFieldDiffValidator({ value: 123 })).toThrow()
    expect(() => makeDateFieldDiffValidator({ value: "[[[" })).toThrow()

    expect(() => makeDateFieldDiffValidator({ target: 123 })).toThrow()
    expect(() => makeDateFieldDiffValidator({ target: "col_a", value: 123 })).toThrow()
    expect(() => makeDateFieldDiffValidator({ target: "col_a", value: "" })).toThrow()
})