const {extractAlgoColumnsFromObject, joinFieldsForHash, cleanValueList} = require('../../hashing/utils')

test("extractAlgoColumnsFromObject", () => {
    expect(() => { extractAlgoColumnsFromObject("", {}) }).toThrow()
    expect(() => { extractAlgoColumnsFromObject({ }, {}) }).toThrow()


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