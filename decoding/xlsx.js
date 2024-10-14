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

let XLSX = require("xlsx");
let fs = require("node:fs/promises");

const DecoderBase = require('./base');
const {Sheet, Document} = require('../document');
const log = require('debug')('CID:XLSXDecoder')

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
            log("RAW:", data[0])

            // convert the human names to aliases
            const dataWithAliases = this.renameColumnsToAliases(data)

            log("DECODED:", dataWithAliases[0])
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


