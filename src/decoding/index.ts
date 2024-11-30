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

import { SUPPORTED_FILE_TYPES } from '../document.js';

import { makeCsvDecoder } from './csv.js';
import { makeXlsxDecoder } from './xlsx.js';

// Returns the file type based on the file name
export function fileTypeOf(filePath: string) {
  if (filePath.endsWith('.xlsx')) {
    return SUPPORTED_FILE_TYPES.XLSX;
  }
  if (filePath.endsWith('.csv')) {
    return SUPPORTED_FILE_TYPES.CSV;
  }
  throw new Error('Unknown file type');
}

// Returns an appropriate decoder for a file
export function decoderForFile(fileType: SUPPORTED_FILE_TYPES) {
  switch (fileType) {
    case SUPPORTED_FILE_TYPES.XLSX:
      return makeXlsxDecoder;
    case SUPPORTED_FILE_TYPES.CSV:
      return makeCsvDecoder;
    default:
      throw new Error(`Unknown file type: '${fileType}'`);
  }
}
