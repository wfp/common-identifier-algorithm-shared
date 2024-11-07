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

import { OptionsValidator } from "../../validation/validators/options.js";

test("OptionsValidator", () => {
    const v = new OptionsValidator({ op: "options", value: ["A", "B", "AB" ]})
    expect(v.validate("")).toEqual({ ok: false, kind: "options", message: 'must be one of: "A", "B", "AB"' });

    expect(v.validate("A")).toEqual({ ok: true, kind: "options" })
    expect(v.validate("B")).toEqual({ ok: true, kind: "options" })
    expect(v.validate("AB")).toEqual({ ok: true, kind: "options" })

    expect(v.validate("AAB")).toEqual({ ok: false, kind: "options", message: 'must be one of: "A", "B", "AB"' })
    expect(v.validate(" ")).toEqual({ ok: false, kind: "options", message: 'must be one of: "A", "B", "AB"' })
    expect(v.validate("ab")).toEqual({ ok: false, kind: "options", message: 'must be one of: "A", "B", "AB"' })
    
    expect(v.validate(null)).toEqual({ ok: false, kind: "options", message: 'values must be either a number or a string' })
    expect(v.validate(new Date())).toEqual({ ok: false, kind: "options", message: 'values must be either a number or a string' })
});

test("OptionsValidator fails for invalid options", () => {
    // @ts-ignore
    expect(() => new OptionsValidator({ op: "options", value: 123 })).toThrow()
    // @ts-ignore
    expect(() => new OptionsValidator({ op: "options", value: "[[[" })).toThrow()
    // @ts-ignore
    expect(() => new OptionsValidator({ op: "options", value: [ null, "qwerty", new Date() ]})).toThrow()
})