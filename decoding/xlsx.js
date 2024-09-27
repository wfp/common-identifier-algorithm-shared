let XLSX = require("xlsx");
let fs = require("node:fs/promises");

const DecoderBase = require('./base');
const {Sheet, Document} = require('../document');

// A decoder for CSVs
class XlsxDecoder extends DecoderBase {

    constructor(sourceConfig, csvOptions={}) {
        super(sourceConfig)
        this.csvOptions = csvOptions;
    }

    async decodeFile(path, fileEncoding='utf-8') {
        let data = await fs.readFile(path);
        let workbook = XLSX.read(data);

        let sheets = workbook.SheetNames.map((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            // load the data from the sheet
            const data = XLSX.utils.sheet_to_json(worksheet, {
                // ensure that all data is retrieved as formatted strings, not raw data
                // (necessary for ID numbers with too many bits, that are not
                // representable by JS numbers)
                raw: false,
            })
            // convert the human names to aliases
            const dataWithAliases = this.renameColumnsToAliases(data)

            return new Sheet(sheetName, dataWithAliases);
        })

        let document = this.documentFromSheets(sheets);
        return document;
    }

    // Renames the incoming columns from their hunan names to their aliases
    renameColumnsToAliases(data) {
        return data.map((row) => {
            return this.prepareSingleObject(row);
        });
    }
}


// Factory function for the CSV decoder
function makeXlsxDecoder(sourceConfig) {
    return new XlsxDecoder(sourceConfig);
}

module.exports = makeXlsxDecoder;


