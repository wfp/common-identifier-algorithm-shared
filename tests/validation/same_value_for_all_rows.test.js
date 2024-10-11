const ValidationError = require('../../validation/ValidationError')
const makeSameValueForAllRowsValidator = require('../../validation/same_value_for_all_rows')


const TEST_SHEET = {
    name: "TEST",
    data: [
        { col_a: "A", col_b: "B" },
    ]
}
test("SameValueForAllRowsValidator", () => {
    const v = makeSameValueForAllRowsValidator({})



    expect(v.validate("A", { sheet: TEST_SHEET, column: "col_a" } )).toEqual(v.success());
    expect(v.validate("B", { sheet: TEST_SHEET, column: "col_a" } )).toEqual(v.fail());
    expect(v.validate("A0", { sheet: TEST_SHEET, column: "col_a" } )).toEqual(v.fail());

    expect(v.validate("B", { sheet: TEST_SHEET, column: "col_b" } )).toEqual(v.success());
    expect(v.validate("A", { sheet: TEST_SHEET, column: "col_b" } )).toEqual(v.fail());
    expect(v.validate("B0", { sheet: TEST_SHEET, column: "col_b" } )).toEqual(v.fail());

    expect(v.validate(null, { sheet: TEST_SHEET, column: "col_b" })).toBeInstanceOf(ValidationError)

})
