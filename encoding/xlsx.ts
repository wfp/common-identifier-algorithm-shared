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

import * as XLSX from "xlsx";
import * as cpexcel from "xlsx/dist/cpexcel.full.mjs"
import * as fs from 'fs';
XLSX.set_fs(fs);
XLSX.set_cptable(cpexcel);

import Debug from 'debug';
const log = Debug('CID:XLSXEncoder')

import { EncoderBase } from './base.js';
import { Config } from '../config/Config.js';
import { Sheet } from '../document.js';

// The longest allowed sheet name length
const MAX_EXCEL_SHEET_NAME_LENGTH = 31;

// Takes a string and returns a valid Excel sheet name (up to 31 characters,
// trimming dashes)
function toValidSheetName(s: string) {
    // remove dashes
    return s.replace(/^[\s\-]*/g, '').replace(/[\s\-]*$/g,'')
        // trim to size
        .substring(0, MAX_EXCEL_SHEET_NAME_LENGTH);
}


class XlsxEncoder extends EncoderBase {
    // attempts to set the column widths wide enough to fit the data displayed in them.
    formatOutputDocument: Boolean = true;
    workbook: XLSX.WorkBook;

    constructor(mapping: Config.ColumnMap) {
        super(mapping)
        this.workbook = XLSX.utils.book_new();
    }

    startDocument(outputPath: string) {
        // store the base path
        this.basePath = outputPath;
    }

    // Ends wiriting the document
    endDocument() {
        // no base path means no document yet, so we'll skip
        if (!this.basePath) {
            return;
        }

        let fileOutputPath = this.getOutputNameFor(this.basePath) + '.xlsx';

        this.withTemporaryFile(fileOutputPath, (temporaryFilePath: string) => {
            XLSX.writeFile(this.workbook, temporaryFilePath, { compression: true });

            log("[XLSX] Written ", temporaryFilePath);
        })

        // add the current file to the list of outputs
        this.outputPaths.push(fileOutputPath);
        // otherwise we'll return
        return;
    }


    // Writes a Sheet to the pre-determined output
    writeSheet(sheet: Sheet) {
        // no base path means no document yet, so we'll skip
        if (!this.basePath) {
            throw new Error("No output path provided.");
        }

        // SheetJS needs the objects to have only the properties we output
        // so we filter them here
        let fullData = this.filterDataBasedOnConfig(sheet.data); //[this._generateHeaderRow()].concat( sheet.data);

        // generate a list of headers in the right order
        let headers = this.mapping.columns.reduce((memo, {alias, name}: { alias: string, name: string }) => {
            memo.aliases.push(alias);
            memo.names.push(name);
            return memo;
        }, {aliases: [], names: []} as { aliases: string[], names: string[] })

        // generate the new sheet for the Excel document from the cleaned data
        const worksheet = XLSX.utils.json_to_sheet(fullData, {header: headers.aliases});
        
        // Set up the widths of the columns
        let columnWidths = this._generateColumnWidthConfig(headers.names, fullData).map(w => ({ wch: w }))
        // update the column widths
        worksheet["!cols"] = columnWidths;
        
        // Add human names to the headers
        XLSX.utils.sheet_add_aoa(worksheet, [headers.names], { origin: "A1" });

        // the output sheet name has to be the mapping postfix, formatted
        const sheetName = toValidSheetName(this.getOutputNameFor(''));
        // add the sheet to the output document
        XLSX.utils.book_append_sheet(this.workbook, worksheet, sheetName);

        return;
    }

    _generateColumnWidthConfig(headers: string[], rows: any[]) {
        // the output column widths
        let colWidths: number[] = [];
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
export function makeXlsxEncoder(mapping: Config.ColumnMap) {
    return new XlsxEncoder(mapping);
}
