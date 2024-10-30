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

import { SUPPORTED_FILE_TYPES } from "../document.js";

import { makeCsvEncoder } from './csv.js';
import { makeXlsxEncoder } from './xlsx.js';


export function encoderForFile(fileType: SUPPORTED_FILE_TYPES) {
    switch (fileType) {
        case SUPPORTED_FILE_TYPES.CSV:
            return makeCsvEncoder;
        case SUPPORTED_FILE_TYPES.XLSX:
            return makeXlsxEncoder;
        default:
            throw new Error(`Unknown file type: '${fileType}'`)
    }

}
