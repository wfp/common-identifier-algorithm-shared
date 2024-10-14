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

const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const { stringify } = require('csv-stringify/sync');

const EncoderBase = require('./base');

const log = require('debug')('CID:CSVEncoder')



class CsvEncoder extends EncoderBase {
    constructor(mapping, options) {
        super(mapping)

        this.options = options;

        // the base path of the document we'll write
        this.basePath = null;
    }

    startDocument(document, outputPath, options={}) {
        let opts = Object.assign({
            // default options go here
        }, options);

        // store the base path
        this.basePath = outputPath;
    }

    // Ends wiriting the document
    endDocument(document) {
        // no base path means no document yet, so we'll skip
        if (!this.basePath) {
            return;
        }

        // otherwise we'll return
        // TODO: this is where metadata injection (writing a summary text file next to the output files) can happen
        return;
    }


    // Writes a Sheet to the pre-determined output
    writeSheet(sheet, config, { current, length }) {
        // no base path means no document yet, so we'll skip
        if (!this.basePath) {
            throw new Error("No output path provided.");
        }

        // is this the only sheet in the document?
        const hasOnlyOneSheet = (length === 1);
        // generate the full output path
        let outputBaseName = hasOnlyOneSheet ? this.basePath : `${this.basePath}-${sheet.name}`;

        // if there is only one sheet we don't need the sheet name in the filename
        let outputPath = this._getOutputNameFor(outputBaseName) + '.csv';

        // attempt to write the data from the sheet as rows
        let fullData = [this._generateHeaderRow()].concat( sheet.data);
        // console.log(fullData);
        let generated = stringify(fullData, {});

        // write the file to a temporary location
        // --------------------------------------

        // write to a temporary location then move the file
        this._withTemporaryFile(outputPath, (temporaryFilePath) => {
            // write to the disk
            // fs.writeFileSync(outputPath, generated, 'utf-8');
            fs.writeFileSync(temporaryFilePath, generated, 'utf-8');
            log("Saved output to temporary location:", temporaryFilePath);
        });

        // add the current file to the list of outputs
        this.outputPaths.push(outputPath);

        log("[CSV] Written", outputPath);
    }

}

// Factory function for the CSV encoder
function makeCsvEncoder(mapping, options) {
    // TODO: validate encoder config here.
    return new CsvEncoder(mapping, options);
}

module.exports = makeCsvEncoder;