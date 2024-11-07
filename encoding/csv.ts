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

import fs from 'node:fs';

import { stringify } from 'csv-stringify/sync';
import { EncoderBase } from './base.js';
import { Config } from '../config/Config.js';
import type { Sheet } from '../document.js';

import Debug from 'debug';
const log = Debug('CID:CSVEncoder')


class CsvEncoder extends EncoderBase {
    constructor(mapping: Config.ColumnMap) {
        super(mapping)
    }

    startDocument(outputPath: string) {
        // store the base path
        this.basePath = outputPath;
    }

    // Ends writing the document
    endDocument() {
        // no base path means no document yet, so we'll skip
        if (!this.basePath) return;

        // otherwise we'll return
        // TODO: this is where metadata injection (writing a summary text file next to the output files) can happen
        return;
    }

    // Writes a Sheet to the pre-determined output
    writeSheet(sheet: Sheet, { length }: { length: number }) {
        // no base path means no document yet, so we'll skip
        if (!this.basePath) {
            throw new Error("No output path provided.");
        }

        // is this the only sheet in the document?
        const hasOnlyOneSheet = (length === 1);
        // generate the full output path
        let outputBaseName = hasOnlyOneSheet ? this.basePath : `${this.basePath}-${sheet.name}`;

        // if there is only one sheet we don't need the sheet name in the filename
        let outputPath = this.getOutputNameFor(outputBaseName) + '.csv';

        // attempt to write the data from the sheet as rows
        let fullData = [this.generateHeaderRow()].concat( sheet.data);
        let generated = stringify(fullData, {});

        // write the file to a temporary location
        // --------------------------------------

        // write to a temporary location then move the file
        this.withTemporaryFile(outputPath, (temporaryFilePath: string) => {
            // write to the disk
            // fs.writeFileSync(outputPath, generated, 'utf-8');
            fs.writeFileSync(temporaryFilePath, generated, 'utf-8');
            log("Saved output to temporary location:", temporaryFilePath);
        });

        // add the current file to the list of outputs
        this.outputPath = outputPath;

        log("[CSV] Written", outputPath);
    }

}

export function makeCsvEncoder(mapping: Config.ColumnMap) {
    return new CsvEncoder(mapping);
}
