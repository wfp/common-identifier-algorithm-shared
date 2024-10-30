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

import { mapRequiredColumns } from '../../processing/mapRequiredColumns.js'


test("mapRequiredColumns", () => {
    expect(mapRequiredColumns(
        { to_translate: [], static: [], reference: [] },
        { columns: [] },
        { columns: [] },
    )).toEqual([])

    expect(mapRequiredColumns(
        {
            to_translate: [ "first_name", "last_name", "father_first_name", "father_last_name", "mother_first_name" ],
            static: [ "dob_year" ],
            reference: [ "document_type", "document_id" ],
        },
        {
            columns: [
                { name: "A", alias: "col_a" },
                { name: "B", alias: "col_b" },
                { name: "MAPPING", alias: "col_mapping" },
            ]
        },
        {
            columns: [
                { name: "C", alias: "col_c" },
                { name: "D", alias: "col_d" },
                { name: "MAPPING", alias: "col_mapping" },
            ]
        },
    )).toEqual([
        "first_name",
        "last_name",
        "father_first_name",
        "father_last_name",
        "mother_first_name",
        "dob_year",
        "document_type", "document_id",
        "col_mapping"
    ])
})