const makeValueValidator = require('../../validation/value_base');

const DEFAULT_MESSAGE =  "DEFAULT_MESSAGE";

test("ValueValidatorBase", () => {
    function predicate(v) {
        return v === 'A';
    }
    const v = makeValueValidator("test_validator", DEFAULT_MESSAGE, predicate, {});

    expect(v.message()).toEqual(DEFAULT_MESSAGE);

    expect(v.validate("A")).toEqual(v.success());
    expect(v.validate("B")).toEqual(v.fail());
})