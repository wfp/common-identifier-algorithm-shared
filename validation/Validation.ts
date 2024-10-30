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
import { MappedData, Sheet } from "../document.js";

export enum SUPPORTED_VALIDATORS {
    FIELD_NAME = "FIELD_NAME",
    FIELD_TYPE = "FIELD_TYPE",
    LANGUAGE_CHECK = "LANGUAGE_CHECK",
    MIN_VALUE = "MIN_VALUE",
    MAX_VALUE = "MAX_VALUE",
    MIN_FIELD_LENGTH = "MIN_FIELD_LENGTH",
    MAX_FIELD_LENGTH = "MAX_FIELD_LENGTH",
    OPTIONS = "OPTIONS",
    ROW_MATCHES_VALUE = "ROW_MATCHES_VALUE",
    REGEX_MATCH = "REGEX_MATCH",
    DATE_DIFF = "DATE_DIFF",
    DATE_FIELD_DIFF = "DATE_FIELD_DIFF",
    SHEET_ROWS_ARE_EQUAL = "SHEET_ROWS_ARE_EQUAL",
}

export class ValidationError {
    kind: keyof typeof SUPPORTED_VALIDATORS;
    msg: string;
    constructor(kind: keyof typeof SUPPORTED_VALIDATORS, msg: string) {
        this.kind = kind;
        this.msg = msg;
    }

    // converts the validation error to a string for debugging purposes
    toString() {
        return `[${this.kind.toString()}]: ${this.msg}`
    }
}

export namespace Validation {
    export interface Data {
        row: MappedData;
        sheet: Sheet;
        column: string;
    }
    export interface Function {
        validate: (value: any, v: Data) => null | ValidationError
    }
    export interface ColumnResult {
        column: string;
        errors: ValidationError[];
    }
    export interface RowResult {
        row: MappedData;
        ok: Boolean;
        errors: ColumnResult[];
    }
    export interface SheetResult {
        sheet: Sheet["name"];
        ok: Boolean;
        results: RowResult[];
    }
    export type FuncMap = {[key: string]: Function[] }
    export type ErrorMap = {[key: string]: ValidationError[]}
}