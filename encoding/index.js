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

const {FILE_CSV, FILE_XLSX} = require('../document');

const makeCsvEncoder = require('./csv');
const makeXlsxEncoder = require('./xlsx');


function encoderForFile(fileType) {
    switch (fileType) {
        case FILE_CSV:
            return makeCsvEncoder;
        case FILE_XLSX:
            return makeXlsxEncoder;
        default:
            throw new Error(`Unknown file type: '${fileType}'`)
    }

}


module.exports = {
    FILE_CSV,
    FILE_XLSX,
    encoderForFile,
}
