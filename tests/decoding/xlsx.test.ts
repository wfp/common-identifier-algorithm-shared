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

import { fileURLToPath } from 'node:url';
import { join, dirname } from 'path';
import { makeXlsxDecoder } from '../../src/decoding/xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_CFG = {
  columns: [
    { name: 'Year of Birth', alias: 'y' },
    { name: 'Organization', alias: 'o' },
  ],
};

test('XLSXDecoder', async () => {
  const d = makeXlsxDecoder(BASE_CFG);
  const decoded = await d.decodeFile(join(__dirname, 'files', 'test.xlsx'));

  expect(decoded.data.length).toEqual(10);
  expect(decoded.data[0]).toEqual({ y: '1994', o: 'ORG1' });
  expect(decoded.data[1]).toEqual({ y: '1982', o: 'ORG1' });
});

test('XLSXDecoder::with limit', async () => {
  const limit = 8;
  const d = makeXlsxDecoder(BASE_CFG, limit);
  const decoded = await d.decodeFile(join(__dirname, 'files', 'test.xlsx'));

  expect(decoded.data.length).toEqual(limit);
  expect(decoded.data[0]).toEqual({ y: '1994', o: 'ORG1' });
  expect(decoded.data[1]).toEqual({ y: '1982', o: 'ORG1' });
});

test('XLSXDecoder::multipleSheets', async () => {
  const limit = 8;
  const d = makeXlsxDecoder(BASE_CFG, limit);

  expect(
    async () => await d.decodeFile(join(__dirname, 'files', 'test_multiple_sheets.xlsx')),
  ).rejects.toThrow();
});
