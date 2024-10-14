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


const makeXlsxDecoder = require('../../decoding/xlsx')
const path = require('path')

const BASE_CFG = {
    columns: [
        {name: "Year of Birth", alias: "y"},
        {name: "Organization", alias: "o" },
    ]
}

const TEST_DATA_OUT = [
    { col_a: "A0", col_b: "B0" },
    { col_a: "A1", col_b: "B1" },
    { col_a: "A2", col_b: "" },
    { col_a: "", col_b: "B3" },
];

test("CSVDecoder", async () => {
    const d = makeXlsxDecoder(BASE_CFG);
    const decoded = await d.decodeFile(path.join(__dirname, "test.xlsx"))

    expect(decoded.sheets.length).toEqual(1)
    expect(decoded.sheets[0].data[0]).toEqual({ y: "1994", o: "ORG1" })
    expect(decoded.sheets[0].data[1]).toEqual({ y: "1982", o: "ORG1" })
})