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

import { SUPPORTED_VALIDATORS } from '../../validation/Validation.js';
import {makeValueValidator} from '../../validation/value_base.js';

const DEFAULT_MESSAGE =  "DEFAULT_MESSAGE";
const TEST_VALIDATOR = SUPPORTED_VALIDATORS.MIN_VALUE;

test("ValueValidatorBase", () => {
    function predicate(v: string) {
        return v === 'A';
    }
    const v = makeValueValidator(TEST_VALIDATOR, DEFAULT_MESSAGE, predicate, { op: "min_value", "value": 10 });

    expect(v.message()).toEqual(DEFAULT_MESSAGE);

    expect(v.validate("A")).toEqual(v.success());
    expect(v.validate("B")).toEqual(v.fail());
})