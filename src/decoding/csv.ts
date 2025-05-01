// Common Identifier Application
// Copyright (C) 2024 World Food Programme

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import fs from 'node:fs';
import { parse as csv_parse } from 'csv-parse/sync';
import type { Options as CsvOptions } from 'csv-parse/sync';

import { DecoderBase } from './base';
import type { Config } from '../config/Config';

// A decoder for CSVs
class CsvDecoder extends DecoderBase {
  csvOptions: CsvOptions = {};

  constructor(sourceConfig: Config.CoreConfiguration['source'], limit?: number) {
    super(sourceConfig);
    if (limit) this.csvOptions.to = limit + 1; // n+1 since header is included
  }

  decodeFile(path: string, fileEncoding: fs.EncodingOption = 'utf-8') {
    let data = fs.readFileSync(path, fileEncoding);
    let parsed = csv_parse(data, this.csvOptions);
    return this.documentFromRawData(path, parsed);
  }
}

export function makeCsvDecoder(sourceConfig: Config.CoreConfiguration['source'], limit?: number) {
  return new CsvDecoder(sourceConfig, limit);
}
