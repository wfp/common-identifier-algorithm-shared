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
import os from 'node:os';
import path from 'node:path';
import { lightFormat } from "date-fns";
import { Config } from '../config/Config.js';
import { CidDocument } from '../document.js';
import Debug from 'debug';
const log = Debug('CID:Encoding')

// Name formatting via Date-Fns lightformat.
// TOKEN GUIDE: https://date-fns.org/v3.6.0/docs/lightFormat
function formatName(name: string, date: Date): string {
    return name.replace(/\{\{(.*?)\}\}/, (match) => {
        let formatString = match.slice(2, -2);
        return lightFormat(date, formatString);
    })
}

// Moves a file (uses fs.rename and falls back to fs.copyFile between FS bounds)
function moveFile(oldPath: string, newPath: string): void {
    // Create the output directory
    fs.mkdirSync(path.dirname(newPath), { recursive: true });

    try {
        // Attempt to rename the file
        fs.renameSync(oldPath, newPath);
    } catch (err) {
        // error may indicate that the paths are on different file systems
        // so check for that and copy as a fallback
        // as this is hard to test on CI / random dev machine, ignore for coverage
        /* istanbul ignore next */
        // @ts-ignore
        if (err.code === 'EXDEV') {
            // Copy the file
            fs.copyFileSync(oldPath, newPath);
            // Delete the old file
            fs.unlinkSync(oldPath);
        } else {
            // re-throw the error
            throw err;
        }
    }
}

export class EncoderBase {
    mapping: Config.ColumnMap;
    outputPath: string = ""; // add every file path the encoder has written to this array
    basePath: string = "";

    constructor(mapping: Config.ColumnMap) {
        this.mapping = mapping;
    }


    // internal helper to return a full name (with a timestamp according to the config)
    protected getOutputNameFor(baseFileName: string) {
        let fullName = `${baseFileName}${this.mapping.postfix}`;
        // TODO: add logic from config
        return formatName(fullName, new Date())
        // return baseFileName;
    }

    protected generateHeaderRow() {
        return this.mapping.columns.reduce((memo, col) => {
            return Object.assign(memo, { [col.alias] : col.name });
        }, {} as {[key: string]: string})
    }


    // Starts the wiriting of a new document (could be a single output file or multiple)
    startDocument(outputPath: string, options={}) {
        throw new Error("not implemented");
    }

    // Ends wiriting the document
    endDocument(document: CidDocument) {
        throw new Error("not implemented");
    }

    // Writes a Sheet to the pre-determined output
    writeDocument(document: CidDocument) {
        throw new Error("not implemented");
    }

    // Wraps encoding a whole document using this encoder.
    // Returns the list of files output
    encodeDocument(document: CidDocument, outputPath: string) {
        this.startDocument(outputPath);
        this.writeDocument(document)
        this.endDocument(document);
        return this.outputPath;
    }


    // Attempts to filter out the columns that should not be present in the
    protected filterDataBasedOnConfig(data: any) {
        // build a set of keys
        let keysArray = this.mapping.columns.map((col) => col.alias);
        // let keysSet = new Set(keysArray);
        return data.map((row: any) => {
            return keysArray.reduce((newRow, k) => {
                return Object.assign(newRow, { [k]: row[k] });
            }, {})
        })
    }

    protected withTemporaryFile(outputPath: string, pred: CallableFunction) {

        const temporaryFilePath = path.join(os.tmpdir(), path.basename(outputPath));

        // call the predicate with the temporary file path so it can write the output
        pred(temporaryFilePath);

        // move to the final output location
        moveFile(temporaryFilePath, outputPath);
        log("Moved output to final location:", outputPath);

    }

}
