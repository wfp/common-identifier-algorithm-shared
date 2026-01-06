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
import { test, expect } from 'vitest';

import { SUPPORTED_FILE_TYPES } from '@/document';
import { decoderForFile, fileTypeOf } from '@/decoding/index';
import { makeCsvDecoder } from '@/decoding/csv';
import { makeXlsxDecoder } from '@/decoding/xlsx';


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
