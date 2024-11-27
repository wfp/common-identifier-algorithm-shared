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
import { MaxValueValidator }from '../../validation/validators/max_value.js';

test("MaxValueValidator", () => {
    const v = new MaxValueValidator({ op: "max_value", value: 100})

    expect(v.validate("")).toEqual({ ok: false, kind: "max_value", message: "must be text or a number" });

    expect(v.validate("1")).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate("10")).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate("100")).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate("1000")).toEqual({ ok: false, kind: "max_value", message: "must be at most 100" });

    expect(v.validate(1)).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate(10)).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate(100)).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate(1000)).toEqual({ ok: false, kind: "max_value", message: "must be at most 100" });

    expect(v.validate("AAB")).toEqual({ ok: false, kind: "max_value", message: "must be text or a number" });
    expect(v.validate(" ")).toEqual({ ok: false, kind: "max_value", message: "must be text or a number" });
    expect(v.validate("ab")).toEqual({ ok: false, kind: "max_value", message: "must be text or a number" });
    
    expect(v.validate(null)).toEqual({ ok: false, kind: "max_value", message: "must be text or a number" });
    expect(v.validate(undefined)).toEqual({ ok: false, kind: "max_value", message: "must be text or a number" });
    expect(v.validate(new Date())).toEqual({ ok: false, kind: "max_value", message: "must be text or a number" });
})

test("MaxValueValidator::dateString [year]", () => {
    const v = new MaxValueValidator({ op: "max_value", value: "{{currentYear}}"});

    const year = new Date().getUTCFullYear();

    expect(v.validate("1")).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate("10")).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate("100")).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate("3000")).toEqual({ ok: false, kind: "max_value", message: `must be at most ${year}` });

    expect(v.validate(year - 2)).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate(year - 1)).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate(year)).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate(year + 1)).toEqual({ ok: false, kind: "max_value", message: `must be at most ${year}` });
    expect(v.validate(year + 2)).toEqual({ ok: false, kind: "max_value", message: `must be at most ${year}` });
})

test("MaxValueValidator::dateString [month]", () => {
    const v = new MaxValueValidator({ op: "max_value", value: "{{currentMonth}}"});

    const month = new Date().getUTCMonth();

    expect(v.validate(month-2)).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate(month-1)).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate(month)).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate(month+1)).toEqual({ ok: true, kind: "max_value" });
    expect(v.validate(month+2)).toEqual({ ok: false, kind: "max_value", message: `must be at most ${month + 1}` });
})

test("MaxValueValidator fails for invalid options", () => {
    // @ts-ignore
    expect(() => new MaxValueValidator({ op: "max_value", value: "[[[" })).toThrow()
})