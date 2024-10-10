const DecoderBase = require('../../decoding/base')

const BASE_CFG = {
    columns: [
        {name: "A", alias: "col_a"},
        {name: "B", alias: "col_b", default: "B_DEFAULT"},
    ]
}

const TEST_DATA = [
    ["A", "B", "C"],
    ["A0", "B0", "C0"],
    ["A1", "B1", "C1"],
    ["A2", undefined, "C2"],
    [undefined, "B3", "C3"],
]

const TEST_DATA_OUT = [
    { col_a: "A0", col_b: "B0" },
    { col_a: "A1", col_b: "B1" },
    { col_a: "A2", col_b: "B_DEFAULT" },
    { col_b: "B3" },
];

function makeDecoderBase(cfg=BASE_CFG) {
    return new DecoderBase(cfg)
}

test("Decoderbase::decodeFile", async () => {
    const d = makeDecoderBase();
    await expect(async () => await d.decodeFile("SOME PATH")).rejects.toThrow(Error);
})

test("Decoderbase::documentFromSheets", () => {
    const d = makeDecoderBase();
    const SHEETS = [{ name: "x", data: []}]
    const doc = d.documentFromSheets(SHEETS)
    expect(doc.sheets).toEqual(SHEETS)
})

test("Decoderbase::sheetFromRawData", () => {
    const d = makeDecoderBase();
    const s = d.sheetFromRawData("sheet1", TEST_DATA);
    expect(s.data).toEqual(TEST_DATA_OUT)
})



test("Decoderbase::mapColumnNamesToIds", () => {
    const d = makeDecoderBase();

    expect(d.mapColumnNamesToIds(["A", "B", "C"])).toEqual(["col_a", "col_b", "C"])

})

test("Decoderbase::convertSheetRowsToObjects", () => {
    const d = makeDecoderBase();
    expect(d.convertSheetRowsToObjects([])).toEqual([])
    expect(d.convertSheetRowsToObjects([ ["A", "B", "C"] ])).toEqual([])

    expect(d.convertSheetRowsToObjects(TEST_DATA)).toEqual(TEST_DATA_OUT)

})