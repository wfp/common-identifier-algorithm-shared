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

import { SUPPORTED_FILE_TYPES } from '../../src/document.js';
import { decoderForFile, fileTypeOf } from '../../src/decoding/index.js';
import { makeCsvDecoder } from '../../src/decoding/csv.js';
import { makeXlsxDecoder } from '../../src/decoding/xlsx.js';

test('decoderForFile', () => {
  expect(decoderForFile(SUPPORTED_FILE_TYPES.CSV)).toEqual(makeCsvDecoder);
  expect(decoderForFile(SUPPORTED_FILE_TYPES.XLSX)).toEqual(makeXlsxDecoder);
  expect(() => {
    // @ts-ignore
    decoderForFile('OTHER');
  }).toThrow();
});

test('fileTypeOf', () => {
  expect(fileTypeOf('file.xlsx')).toEqual(SUPPORTED_FILE_TYPES.XLSX);
  expect(fileTypeOf('file.csv')).toEqual(SUPPORTED_FILE_TYPES.CSV);
  expect(() => fileTypeOf('file')).toThrow('Unknown file type');
});
