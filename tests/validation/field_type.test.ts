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

import { makeFieldTypeValidator } from '../../validation/field_type.js';

test("FieldTypeValidator", () => {
    {
        let v = makeFieldTypeValidator({ op: "field_type", value: "str" });        
        expect(v.validate(123)).toEqual(v.fail());
        expect(v.validate("123")).toEqual(v.success());
        expect(v.validate(123)?.toString()).toMatch(/text/);
    }
    {
        const v = makeFieldTypeValidator({ op: "field_type", value: "num" })
        expect(v.validate(123)).toEqual(v.success());
        expect(v.validate("123")).toEqual(v.fail());
        expect(v.validate("123")?.toString()).toMatch(/number/)
    }
});