const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const XLSX = require('xlsx')
const makeXlsxEncoder = require('../../encoding/xlsx');

const TEST_MAPPING = {
    postfix: "_POSTFIX",
    columns: [
        { name: "A", alias: "col_a" },
        { name: "B", alias: "col_b" },
    ],
}

const TEST_DOC = {
        sheets: [
            { name: "sheet1", data: [
                {col_a: "A0", col_b: "B0" },
                {col_a: "A1", col_b: "B1" },
            ]}
        ]
    };

// test("fail when calling without calling startDocument before", () => {
//     const e = makeXlsxEncoder(TEST_MAPPING);

//     // fail when calling writeSheet whout
//     expect(() => { e.writeSheet("sheet", "config", { current:0, length:1 }) } ).toThrow()

//     expect(() => { e.encodeDocument("sheet", "config", { current:0, length:1 }) } ).toThrow()
// })

test("makeXlsxEncoder creation", () => {
    const e = makeXlsxEncoder(TEST_MAPPING);

    const test_output_path = path.join(__dirname, "xlsx_encoder_test")
    const test_output_path_postfixed = path.join(__dirname, "xlsx_encoder_test_POSTFIX.xlsx")

    if (fs.existsSync(test_output_path_postfixed)) {
        fs.unlinkSync(test_output_path_postfixed);
    }

    e.encodeDocument(TEST_DOC, test_output_path)


    let data = fs.readFileSync(test_output_path_postfixed);
    let workbook = XLSX.read(data);


    expect(workbook.SheetNames.length).toEqual(1)

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];


    const decodedData = XLSX.utils.sheet_to_json(worksheet, {
        // ensure that all data is retrieved as formatted strings, not raw data
        // (necessary for ID numbers with too many bits, that are not
        // representable by JS numbers)
        raw: false,
    })


    expect(decodedData).toEqual([
        {A: "A0", B: "B0"},
        {A: "A1", B: "B1"},
    ])

    fs.unlinkSync(test_output_path_postfixed);
})