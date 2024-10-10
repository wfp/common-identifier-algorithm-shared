const {FILE_CSV, FILE_XLSX} = require('../../document');
const {encoderForFile} = require('../../encoding/index')
const makeCsvEncoder = require('../../encoding/csv');
const makeXlsxEncoder = require('../../encoding/xlsx');



test("encoderForFile", () => {
    expect(encoderForFile(FILE_CSV)).toEqual(makeCsvEncoder);
    expect(encoderForFile(FILE_XLSX)).toEqual(makeXlsxEncoder);
    expect(() => { encoderForFile("OTHER") }).toThrow();
})
