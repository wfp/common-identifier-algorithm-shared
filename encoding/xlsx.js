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
const fs = require('node:fs');
const log = require('debug')('CID:XLSXEncoder')

const EncoderBase = require('./base');

// The longest allowed sheet name length
const MAX_EXCEL_SHEET_NAME_LENGTH = 31;

// Takes a string and returns a valid Excel sheet name (up to 31 characters,
// trimming dashes)
function toValidSheetName(s) {
    // remove dashes
    return s.replace(/^[\s\-]*/g, '').replace(/[\s\-]*$/g,'')
        // trim to size
        .substring(0, MAX_EXCEL_SHEET_NAME_LENGTH);
}


class XlsxEncoder extends EncoderBase {
    constructor(mapping, options) {
        super(mapping)

        this.options = options;

        // the base path of the document we'll write
        this.basePath = null;

        // attempts to set the column widths wide enough to fit the data displayed
        // in them.
        this.formatOutputDocument = true;
    }

    startDocument(document, outputPath, options={}) {
        let opts = Object.assign({
            // default options go here
        }, options);

        // store the base path
        this.basePath = outputPath;

        // create the new workbook
        this.workbook = XLSX.utils.book_new();
    }

    // Ends wiriting the document
    endDocument(document) {
        // no base path means no document yet, so we'll skip
        if (!this.basePath) {
            return;
        }

        let fileOutputPath = this._getOutputNameFor(this.basePath) + '.xlsx';

        this._withTemporaryFile(fileOutputPath, (temporaryFilePath) => {
            XLSX.writeFile(this.workbook, temporaryFilePath, { compression: true });

            log("[XLSX] Written ", temporaryFilePath);
        })

        // add the current file to the list of outputs
        this.outputPaths.push(fileOutputPath);
        // otherwise we'll return
        return;
    }


    // Writes a Sheet to the pre-determined output
    writeSheet(sheet, config) {
        // no base path means no document yet, so we'll skip
        if (!this.basePath) {
            throw new Error("No output path provided.");
        }

        // SheetJS needs the objects to have only the properties we output
        // so we filter them here
        let fullData = this._filterDataBasedOnConfig(sheet.data); //[this._generateHeaderRow()].concat( sheet.data);

        // generate a list of headers in the right order
        let headers = this.mapping.columns.reduce((memo, {alias, name}) => {
            memo.aliases.push(alias);
            memo.names.push(name);
            return memo;
        }, {aliases: [], names: []})

        // generate the new sheet for the Excel document from the cleaned data
        const worksheet = XLSX.utils.json_to_sheet(fullData, {header: headers.aliases});

        // Set up the widths of the columns
        let columnWidths = this._generateColumnWidthConfig(headers.names, fullData).map(w => ({ wch: w }))
        // update the column widths
        worksheet["!cols"] = columnWidths;

        // Add human names to the headers
        XLSX.utils.sheet_add_aoa(worksheet, [headers.names], { origin: "A1" });

        // the output sheet name has to be the mapping mostfix, formatted
        const sheetName = toValidSheetName(this._getOutputNameFor(''));
        // add the sheet to the output document
        XLSX.utils.book_append_sheet(this.workbook, worksheet, sheetName);

        return;
    }

    _generateColumnWidthConfig(headers, rows) {
        // the output column widths
        let colWidths = [];
        for (let row of rows) {
            // we'll need the index here so use forEach
            Object.keys(row).forEach((k, i) => {
                // do we have any data in the columm?
                const rowLen = row[k] ? row[k].length : 0;
                colWidths[i] = Math.max(colWidths[i] || 0, rowLen);
            })
        }

        headers.forEach((header,i) => {
            colWidths[i] = Math.max(colWidths[i] || 0, header.length);
        })

        return colWidths;
    }
}

// Factory function for the xlsx encoder
function makeXlsxEncoder(mapping, options) {
    return new XlsxEncoder(mapping, options);
}

module.exports = makeXlsxEncoder;