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

import { SUPPORTED_FILE_TYPES } from '../document';

import { makeCsvEncoder } from './csv';
import { makeXlsxEncoder } from './xlsx';

export function encoderForFile(fileType: SUPPORTED_FILE_TYPES) {
  switch (fileType) {
    case SUPPORTED_FILE_TYPES.CSV:
      return makeCsvEncoder;
    case SUPPORTED_FILE_TYPES.XLSX:
      return makeXlsxEncoder;
    default:
      throw new Error(`Unknown file type: '${fileType}'`);
  }
}
