
const makeXlsxDecoder = require('../../decoding/xlsx')
const path = require('path')

const BASE_CFG = {
    columns: [
        {name: "Year of Birth", alias: "y"},
        {name: "Organization", alias: "o" },
    ]
}

const TEST_DATA_OUT = [
    { col_a: "A0", col_b: "B0" },
    { col_a: "A1", col_b: "B1" },
    { col_a: "A2", col_b: "" },
    { col_a: "", col_b: "B3" },
];

test("CSVDecoder", async () => {
    const d = makeXlsxDecoder(BASE_CFG);
    const decoded = await d.decodeFile(path.join(__dirname, "test.xlsx"))

    expect(decoded.sheets.length).toEqual(1)
    expect(decoded.sheets[0].data[0]).toEqual({ y: "1994", o: "ORG1" })
    expect(decoded.sheets[0].data[1]).toEqual({ y: "1982", o: "ORG1" })
})