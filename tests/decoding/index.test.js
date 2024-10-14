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

const {FILE_CSV, FILE_XLSX} = require('../../document');
const {decoderForFile, fileTypeOf} = require('../../decoding/index')
const makeCsvDecoder = require('../../decoding/csv');
const makeXlsxDecoder = require('../../decoding/xlsx');



test("decoderForFile", () => {
    expect(decoderForFile(FILE_CSV)).toEqual(makeCsvDecoder);
    expect(decoderForFile(FILE_XLSX)).toEqual(makeXlsxDecoder);
    expect(() => { decoderForFile("OTHER") }).toThrow();
})

test("fileTypeOf", () => {
    expect(fileTypeOf("file.xlsx")).toEqual(FILE_XLSX);
    expect(fileTypeOf("file.csv")).toEqual(FILE_CSV);
    expect(fileTypeOf("file")).toEqual(null);
})
