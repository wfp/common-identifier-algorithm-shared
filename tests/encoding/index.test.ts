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


import { test, expect } from 'vitest';
import { SUPPORTED_FILE_TYPES } from '@/document';
import { encoderForFile } from '@/encoding/index';
import { makeCsvEncoder } from '@/encoding/csv';
import { makeXlsxEncoder } from '@/encoding/xlsx';

test('encoderForFile', () => {
  expect(encoderForFile(SUPPORTED_FILE_TYPES.CSV)).toEqual(makeCsvEncoder);
  expect(encoderForFile(SUPPORTED_FILE_TYPES.XLSX)).toEqual(makeXlsxEncoder);

  const badInputs = [null, '', new Date(), 1234];
  badInputs.forEach(x => expect(() => encoderForFile(x as any)).toThrow());
});
