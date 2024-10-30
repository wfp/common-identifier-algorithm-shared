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
import {
    Duration,
    parse as date_parse,
    add as date_add,
    compareAsc as date_compareAsc,
    isValid as date_isValid,
    formatDate
} from "date-fns";

export interface ParsedDateDiff {
    isPositive: boolean;
    _key: string;
    _value: number;
    [key: string]: number | string | boolean;
}

// the default format string
const DEFAULT_FORMAT_STR = "yyyyMMdd"

export function parseDateDiff(dateDiffStr: string): ParsedDateDiff | null {

    // figure out the range type
    let key = null;

    if (dateDiffStr.endsWith('M')) key = 'months';
    if (dateDiffStr.endsWith('Y')) key = 'years';
    if (dateDiffStr.endsWith('d')) key = 'days';

    if (!key) return null;

    // if there is a range parse the integer count
    const parsedInt = parseInt(dateDiffStr.substring(0, dateDiffStr.length - 1));

    // combine into a date-fn.sub() compatible format
    return { [key]: parsedInt, isPositive: (parsedInt >= 0), _key: key, _value: parsedInt }

}

export function isValidDateDiff(dateDiffString: string) {
    const dateDiff = parseDateDiff(dateDiffString);
    return dateDiff;
}

export function attemptToParseDate(value: unknown): Date | null | undefined {
    // check for emptyness / falseness
    if (!value) {
        return;
    }
    // numbers need to be converted to string for more success
    if (typeof value !== 'string') {
        value = value.toString();
    }
    const parsedDate = date_parse(value as string, DEFAULT_FORMAT_STR, new Date() );
    if (date_isValid(parsedDate)) return parsedDate;

    return null;
}

export function formatDateWithDefaultFormat(v: unknown) {
    // empty values get empty strings
    if (!v || (v instanceof Date === false)) {
        return '';
    }

    // check if v is a date object
    if (typeof v.getMonth !== 'function') {
        return '';
    }
    return formatDate(v, DEFAULT_FORMAT_STR);
}

export function isDateInRange(diff: ParsedDateDiff, value: any, originDate=new Date()) {

    const targetDate = date_add(originDate, diff as Duration);
    const offsetCompareResult = date_compareAsc(targetDate, value);
    const originCompareResult = date_compareAsc(originDate, value);

    // diff positive, offset origin later than value
    if (diff.isPositive) {
        // diff positive, offset origin earlier then value => out of range
        if (offsetCompareResult < 0) return false;
        return true;

        // -- origin earlier then value => in range
        // -- origin later then value  => out of range
        return (originCompareResult <= 0)
    } else {
        // diff positive, offset origin earlier then value => out of range
        if (offsetCompareResult > 0) return false;
        return true;

        // -- origin earlier then value => in range
        // -- origin later then value  => out of range
        return (originCompareResult >= 0)
    }

}