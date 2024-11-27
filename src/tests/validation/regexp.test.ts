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
import { RegexpValidator }from '../../validation/validators/regexp.js';

test("RegexpValidator", () => {
    const v = new RegexpValidator({ op: "regex_match", value: "[a-eA-E0-9]*" });

    expect(v.validate("")).toEqual({ ok: true, kind: "regex_match" });
    expect(v.validate("A")).toEqual({ ok: true, kind: "regex_match" });
    expect(v.validate("Ac876")).toEqual({ ok: true, kind: "regex_match" });
    
    expect(v.validate(undefined)).toEqual({ ok: false, kind: "regex_match", message: "must not be empty" })
    expect(v.validate(null)).toEqual({ ok: false, kind: "regex_match", message: "must not be empty" })
    
    expect(v.validate("AF876")).toEqual({ ok: false, kind: "regex_match", message: "must match regular expression /^[a-eA-E0-9]*$/" })
    expect(v.validate(" ")).toEqual({ ok: false, kind: "regex_match", message: "must match regular expression /^[a-eA-E0-9]*$/" })
    expect(v.validate("fff")).toEqual({ ok: false, kind: "regex_match", message: "must match regular expression /^[a-eA-E0-9]*$/" })
})

test("RegexpValidator fails for invalid regexp", () => {
    // @ts-ignore
    expect(() => new RegexpValidator({ op: "regex_match", value: 123 })).toThrow()
    // @ts-ignore
    expect(() => new RegexpValidator({ op: "regex_match", value: "[[[" })).toThrow()
})