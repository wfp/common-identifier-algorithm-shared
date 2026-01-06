/* ************************************************************************
*  Common Identifier Application
*  Copyright (C) 2026  World Food Programme
*  
*  This program is free software: you can redistribute it and/or modify
*  it under the terms of the GNU Affero General Public License as published by
*  the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
*  
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU Affero General Public License for more details.
*  
*  You should have received a copy of the GNU Affero General Public License
*  along with this program.  If not, see <http://www.gnu.org/licenses/>.
************************************************************************ */

import fs from 'node:fs';
import { parse as csv_parse } from 'csv-parse/sync';
import type { Options as CsvOptions } from 'csv-parse/sync';

import Debug from 'debug';
const log = Debug('cid::engine::decoding::csv');

import { DecoderBase } from './base';
import type { Config } from '../config/Config';

class CsvDecoder extends DecoderBase {
  csvOptions: CsvOptions = {};

  constructor(sourceConfig: Config.CoreConfiguration['source'], limit?: number) {
    super(sourceConfig);
    if (limit) this.csvOptions.to = limit + 1; // n+1 since header is included
  }

  decodeFile(path: string, fileEncoding: fs.EncodingOption = 'utf-8') {
    log(`[INFO] Reading CSV file from ${path} with encoding '${fileEncoding}'`);
    const data = fs.readFileSync(path, fileEncoding);
    const parsed = csv_parse(data, this.csvOptions);
    log(`[INFO] Parsed ${parsed.length} rows from CSV file '${path}'`);

    log(`[DEBUG] Found ${parsed[0].length} columns: [${parsed[0].join(', ')}]`);
    const document = this.documentFromRawData(path, parsed);
    log(`[DEBUG] Renamed columns to aliases, columns: [${Object.keys(document.data[0]).join(', ')}]`);

    return document;
  }
}

export function makeCsvDecoder(sourceConfig: Config.CoreConfiguration['source'], limit?: number) {
  return new CsvDecoder(sourceConfig, limit);
}
