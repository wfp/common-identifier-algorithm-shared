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

const fs = require('fs/promises');
const csv = require('csv-parse/sync');


const DecoderBase = require('./base');


// A decoder for CSVs
class CsvDecoder extends DecoderBase {

    constructor(sourceConfig, csvOptions={}) {
        super(sourceConfig)
        this.csvOptions = csvOptions;
    }

    async decodeFile(path, fileEncoding='utf-8') {
        let data = await fs.readFile(path, fileEncoding);
        let parsed = csv.parse(data, this.csvOptions);
        return this.documentFromSheets([
            this.sheetFromRawData("Sheet 1", parsed)
        ]);
    }
}


// Factory function for the CSV decoder
function makeCsvDecoder(sourceConfig) {
    return new CsvDecoder(sourceConfig);
}

module.exports = makeCsvDecoder;