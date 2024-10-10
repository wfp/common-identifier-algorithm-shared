const makeCsvDecoder = require('../../decoding/csv')
const path = require('path')

const BASE_CFG = {
    columns: [
        {name: "A", alias: "col_a"},
        {name: "B", alias: "col_b", default: "B_DEFAULT"},
    ]
}

const TEST_DATA_OUT = [
    { col_a: "A0", col_b: "B0" },
    { col_a: "A1", col_b: "B1" },
    { col_a: "A2", col_b: "" },
    { col_a: "", col_b: "B3" },
];

test("CSVDecoder", async () => {
    const d = makeCsvDecoder(BASE_CFG);
    const decoded = await d.decodeFile(path.join(__dirname, "test.csv"))

    expect(decoded.sheets.length).toEqual(1)
    expect(decoded.sheets[0].data).toEqual(TEST_DATA_OUT)
})