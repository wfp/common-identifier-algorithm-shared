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

const {Document, Sheet} = require('../document')

const SHEETS = [
    new Sheet("sheet1", [ {a:"A"}]),
    new Sheet("sheet2", []),

];

const DOCUMENT = new Document(SHEETS);


test("Document", () => {
    expect(DOCUMENT.sheets).toEqual(SHEETS)
})

test("Sheet", () => {
    const s = SHEETS[0];
    expect(s.name).toEqual("sheet1")
    expect(s.data).toEqual([ {a:"A"}])
})