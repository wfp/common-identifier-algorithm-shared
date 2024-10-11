const ValidationError = require('../../validation/ValidationError')

test("ValidationError", () => {
    const TEST_KIND = 'test_kind';
    const TEST_MSG = 'TEST MESSAGE';
    const e = new ValidationError(TEST_KIND, TEST_MSG)

    expect(e.toString()).toMatch(/test_kind/)
    expect(e.toString()).toMatch(/TEST MESSAGE/)
})