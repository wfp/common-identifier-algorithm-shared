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
import { parse as csv_parse, Options as CsvOptions } from 'csv-parse/sync';


import { DecoderBase } from './base.js';
import type { Config } from '../config/Config.js';


// A decoder for CSVs
class CsvDecoder extends DecoderBase {
    csvOptions: CsvOptions;

    constructor(sourceConfig: Config.Options["source"], csvOptions: CsvOptions={}) {
        super(sourceConfig)
        this.csvOptions = csvOptions;
    }

    decodeFile(path: string, fileEncoding: fs.EncodingOption='utf-8') {
        let data = fs.readFileSync(path, fileEncoding);
        let parsed = csv_parse(data, this.csvOptions);
        return this.documentFromSheets([
            this.sheetFromRawData("Sheet1", parsed)
        ]);
    }
}

export function makeCsvDecoder(sourceConfig: Config.Options["source"]) {
    return new CsvDecoder(sourceConfig);
}