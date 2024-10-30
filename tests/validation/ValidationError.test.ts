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

import { ValidationError } from '../../validation/Validation.js';

test("ValidationError", () => {
    const TEST_KIND = "FIELD_NAME"
    const TEST_MSG = 'TEST MESSAGE';
    const e = new ValidationError(TEST_KIND, TEST_MSG)

    expect(e.toString()).toMatch(TEST_KIND.toString())
    expect(e.toString()).toMatch(/TEST MESSAGE/)
})