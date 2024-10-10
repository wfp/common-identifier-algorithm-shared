const {FILE_CSV, FILE_XLSX} = require('../../document');
const {decoderForFile, fileTypeOf} = require('../../decoding/index')
const makeCsvDecoder = require('../../decoding/csv');
const makeXlsxDecoder = require('../../decoding/xlsx');



test("decoderForFile", () => {
    expect(decoderForFile(FILE_CSV)).toEqual(makeCsvDecoder);
    expect(decoderForFile(FILE_XLSX)).toEqual(makeXlsxDecoder);
    expect(() => { decoderForFile("OTHER") }).toThrow();
})

test("fileTypeOf", () => {
    expect(fileTypeOf("file.xlsx")).toEqual(FILE_XLSX);
    expect(fileTypeOf("file.csv")).toEqual(FILE_CSV);
    expect(fileTypeOf("file")).toEqual(null);
})
