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
import { FieldTypeValidator } from "../../validation/validators/field_type.js";

test("FieldTypeValidator", () => {
    {
        let v = new FieldTypeValidator({ op: "field_type", value: "string" });        
        expect(v.validate(123)).toEqual({ ok: false, kind: "field_type", message: "must be of type: text" });
        expect(v.validate("123")).toEqual({ ok: true, kind: "field_type" });
    }
    {
        const v = new FieldTypeValidator({ op: "field_type", value: "number" })
        expect(v.validate(123)).toEqual({ ok: true, kind: "field_type" });
        expect(v.validate("123")).toEqual({ ok: false, kind: "field_type", message: "must be of type: number" });
    }
});

test("FieldTypeValidator fails for invalid option value", () => {
    // @ts-ignore
    expect(() => new FieldTypeValidator({ op: "field_type", value: 123 })).toThrow()
    // @ts-ignore
    expect(() => new FieldTypeValidator({ op: "field_type", value: "[[[" })).toThrow()
})