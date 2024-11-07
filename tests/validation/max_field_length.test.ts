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
import { MaxFieldLengthValidator } from "../../validation/validators/max_field_length.js"

test("MaxFieldLengthValidator", () => {
    const v = new MaxFieldLengthValidator({ op: "max_field_length", value: 2 })

    expect(v.validate("")).toEqual({ ok: true, kind: "max_field_length" });
    expect(v.validate(" ")).toEqual({ ok: true, kind: "max_field_length" });

    expect(v.validate("A")).toEqual({ ok: true, kind: "max_field_length" });
    expect(v.validate("AB")).toEqual({ ok: true, kind: "max_field_length" });
    expect(v.validate("ABC")).toEqual({ ok: false, kind: "max_field_length", message: "must be shorter than 2 characters" });
    expect(v.validate("ABCD")).toEqual({ ok: false, kind: "max_field_length", message: "must be shorter than 2 characters" });

    expect(v.validate(1)).toEqual({ ok: true, kind: "max_field_length" });
    expect(v.validate(10)).toEqual({ ok: true, kind: "max_field_length" });
    expect(v.validate(100)).toEqual({ ok: false, kind: "max_field_length", message: "must be shorter than 2 characters" });
    expect(v.validate(1000)).toEqual({ ok: false, kind: "max_field_length", message: "must be shorter than 2 characters" });
    
    expect(v.validate(null)).toEqual({ ok: false, kind: "max_field_length", message: "must be text or a number" })
    expect(v.validate(new Date())).toEqual({ ok: false, kind: "max_field_length", message: "must be text or a number" })
})

test("MaxFieldLengthValidator fails for invalid options", () => {
    // @ts-ignore
    expect(() => new MaxFieldLengthValidator({ op: "max_field_length", value: "[[[" })).toThrow()
})