/*
 * This file is part of Building Blocks CommonID Tool
 * Copyright (c) 2024 WFP
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

const ValidatorBase = require('../../validation/base')
const ValidationError = require('../../validation/ValidationError');

const TEST_MESSAGE = "OTHER MESSAGE";

test("ValidatorBase abstract methods", () => {

    const v = new ValidatorBase('test_validator', {})

    expect(() => v.defaultMessage()).toThrow()
    expect(() => v.validate("A", { row: { col_a: "A" }, sheet: {}, column: "col_a"})).toThrow()
})

////////////////////////////////////////////////////////////////////////////////

class TestValidator extends ValidatorBase {
    constructor(opts) {
        super("test_validator", opts)
    }

    defaultMessage() { return "DEFAULT MESSAGE"; }
    validate(value, _context) {
        if (value !== 'A') return this.fail();
        return this.success();
    }
}


test("ValidatorBase result helpers", () => {


    const v = new TestValidator({})

    expect(v.success()).toEqual(null);


    {
        const res = v.fail();
        expect(res).toBeInstanceOf(ValidationError)
        expect(res.kind).toEqual(v.kind)
        expect(res.msg).toEqual(v.defaultMessage())
    }

    {
        const res = v.failWith(TEST_MESSAGE);
        expect(res).toBeInstanceOf(ValidationError)
        expect(res.kind).toEqual(v.kind)
        expect(res.msg).toEqual(TEST_MESSAGE)
    }




})



test("ValidatorBase::message", () => {

    // no message option
    {
        const v = new TestValidator({})
        expect(v.message()).toEqual(v.defaultMessage());
        expect(v.validate("B", {}).toString()).toMatch(/DEFAULT MESSAGE/);
    }

    // have message option
    {
        const v = new TestValidator({ message: TEST_MESSAGE })
        expect(v.message()).toEqual(TEST_MESSAGE);
        expect(v.validate("B", {}).toString()).toMatch(/OTHER MESSAGE/);
    }
})


