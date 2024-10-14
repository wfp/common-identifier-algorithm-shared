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