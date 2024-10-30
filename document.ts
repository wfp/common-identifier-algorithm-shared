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


export enum SUPPORTED_FILE_TYPES {
    CSV = ".csv",
    XLSX = ".xlsx"
}

export type RawData = Array<Array<any>>;
export type MappedData = { [key: string]: any };

// The data class describing a sheet
export class Sheet {
    name: string;
    data: MappedData[];
    constructor(name: string, data: MappedData[]) {
        this.name = name;
        this.data = data;
    }
}

export class CidDocument {
    sheets: Sheet[];
    constructor(sheets: Sheet[]) {
        this.sheets = sheets;
    }
}