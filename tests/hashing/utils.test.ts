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

import { extractAlgoColumnsFromObject, joinFieldsForHash, cleanValueList } from '../../hashing/utils.js'

test("extractAlgoColumnsFromObject", () => {
    // expect(() => { extractAlgoColumnsFromObject("", {}) }).toThrow()
    // expect(() => { extractAlgoColumnsFromObject({ }, {}) }).toThrow()

    expect(extractAlgoColumnsFromObject({
        static: [],
        to_translate: [],
        reference: []
    }, {})).toEqual({
        static: [],
        to_translate: [],
        reference: []
    })

    expect(extractAlgoColumnsFromObject({
        static: ["col_a", "col_b"],
        to_translate: ["col_tra", "col_trb"],
        reference: ["col_refa", "col_refb"]
    }, {})).toEqual({
        static: [],
        to_translate: [],
        reference: []
    })

    expect(extractAlgoColumnsFromObject({
        static: ["col_a", "col_b"],
        to_translate: ["col_tra", "col_trb"],
        reference: ["col_refa", "col_refb"]
    }, {
        col_a: "a", col_b: "b",
        col_tra: "tra", col_trb: "trb",
        col_refa: "refa", col_refb: "refb",
    })).toEqual({
        static: ["a", "b"],
        to_translate: ["tra", "trb"],
        reference: ["refa", "refb"]
    })
})

test("joinFieldsForHash", () => {
    expect(joinFieldsForHash([])).toEqual("")
    expect(joinFieldsForHash(["a", "b"])).toEqual("ab")
})

test("cleanValueList", () => {
    expect(cleanValueList([])).toEqual([])
    expect(cleanValueList(["a", "b"])).toEqual(["a", "b"])
    expect(cleanValueList(["a", "b", 10, "c", null, "d"])).toEqual(["a", "b", "", "c", "", "d"])
})