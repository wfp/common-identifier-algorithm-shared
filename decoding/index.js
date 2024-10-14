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

const {FILE_CSV, FILE_XLSX} = require('../document');

const makeCsvDecoder = require('./csv');
const makeXlsxDecoder = require('./xlsx');


// Returns the file type based on the file name
function fileTypeOf(filePath) {
    if (filePath.endsWith(".xlsx")) {
        return FILE_XLSX
    }

    if (filePath.endsWith(".csv")) {
        return FILE_CSV
    }


    // unknown type
    return null;
}

// Returns an appropriate decoder for a file
function decoderForFile(fileType) {
    switch (fileType) {
        case FILE_XLSX:
            return makeXlsxDecoder;
        case FILE_CSV:
            return makeCsvDecoder;
        default:
            throw new Error(`Unknown file type: '${fileType}'`)
    }
}


module.exports = {
    fileTypeOf,
    decoderForFile,
}