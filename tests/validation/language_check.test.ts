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

import { makeLanguageCheckValidator } from '../../validation/language_check.js';

test("LanguageCheckValidator", () => {

    const v = makeLanguageCheckValidator({ op: "language_check", value: "arabic" })

    expect(v.validate("ABCD")).toEqual(v.fail());
    expect(v.validate("ميار")).toEqual(v.success());
    expect(v.validate("吉")).toEqual(v.fail());


})

test("LanguageCheckValidator fails for invalid options", () => {
    expect(() => makeLanguageCheckValidator({ op: "language_check", value: 123})).toThrow()
    expect(() => makeLanguageCheckValidator({ op: "language_check", value: "nothing"})).toThrow()
})