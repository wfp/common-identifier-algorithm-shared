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

import { SUPPORTED_FILE_TYPES } from '../../document.js';
import { decoderForFile, fileTypeOf } from '../../decoding/index.js';
import { makeCsvDecoder } from '../../decoding/csv.js';
import { makeXlsxDecoder } from '../../decoding/xlsx.js';

test("decoderForFile", () => {
    expect(decoderForFile(SUPPORTED_FILE_TYPES.CSV)).toEqual(makeCsvDecoder);
    expect(decoderForFile(SUPPORTED_FILE_TYPES.XLSX)).toEqual(makeXlsxDecoder);
    // @ts-ignore
    expect(() => { decoderForFile("OTHER") }).toThrow();
})

test("fileTypeOf", () => {
    expect(fileTypeOf("file.xlsx")).toEqual(SUPPORTED_FILE_TYPES.XLSX);
    expect(fileTypeOf("file.csv")).toEqual(SUPPORTED_FILE_TYPES.CSV);
    expect(() => fileTypeOf("file")).toThrow("Unknown file type");
})
