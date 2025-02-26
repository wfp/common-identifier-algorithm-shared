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
import * as XLSX from 'xlsx';
import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs';
XLSX.set_fs(fs);
XLSX.set_cptable(cpexcel);

import Debug from 'debug';
const log = Debug('CID:XLSXDecoder');

import { DecoderBase } from './base';
import type { Config } from '../config/Config';
import type { CidDocument } from '../document';

// A decoder for CSVs
class XlsxDecoder extends DecoderBase {
  decodeOptions: XLSX.ParsingOptions = {};

  constructor(sourceConfig: Config.Options['source'], limit?: number) {
    super(sourceConfig);
    if (limit) this.decodeOptions.sheetRows = limit + 1; // n+1 since header is included
  }

  async decodeFile(path: string) {
    const workbook = XLSX.readFile(path, this.decodeOptions);

    // workbook always has one sheet, and we only care about single sheet workbooks
    if (workbook.SheetNames.length > 1) throw new Error('Only single sheet XSLX workbooks are supported.');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    // load the data from the sheet
    const data = XLSX.utils.sheet_to_json(worksheet, {
      // ensure that all data is retrieved as formatted strings, not raw data
      // (necessary for ID numbers with too many bits, that are not
      // representable by JS numbers)
      raw: false,
    });
    log('RAW:', data[0]);

    // convert the human names to aliases
    const dataWithAliases = this.renameColumnsToAliases(data);

    log('DECODED:', dataWithAliases[0]);
    return { name: path, data: dataWithAliases };
  }

  // Renames the incoming columns from their hunan names to their aliases
  renameColumnsToAliases(data: any) {
    return data.map((row: any) => {
      return this.prepareSingleObject(row);
    });
  }
}

// Factory function for the CSV decoder
export function makeXlsxDecoder(sourceConfig: Config.Options['source'], limit?: number) {
  return new XlsxDecoder(sourceConfig, limit);
}
