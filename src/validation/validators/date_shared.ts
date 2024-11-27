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
  parse as date_parse,
  add as date_add,
  isValid as date_isValid,
  formatDate,
  isWithinInterval,
} from 'date-fns';
import type { Duration } from 'date-fns';
import { utc, UTCDate } from '@date-fns/utc';

export interface ParsedDateDiff {
  isPositive: boolean;
  _key: string;
  _value: number;
  [key: string]: number | string | boolean;
}

// the default format string
const DEFAULT_FORMAT_STR = 'yyyyMMdd';

export function parseDateDiff(dateDiffStr: string): ParsedDateDiff[] | null {
  // opts.value expected format "<past value>:<future value>"
  if (!dateDiffStr.includes(':')) return null;

  // split past / future components
  const [left, right] = dateDiffStr.split(':', 2).map((range) => {
    let unit = null;
    if (range.endsWith('M')) unit = 'months';
    if (range.endsWith('Y')) unit = 'years';
    if (range.endsWith('d')) unit = 'days';

    if (!unit) {
      unit = 'days';
      range = '0';
    }
    return { range: range, unit: unit };
  });

  // if there is a range parse the integer count and sort ranges into ascending order
  const lInt = parseInt(left.range);
  const rInt = parseInt(right.range);

  // if both ranges are zero, return and raise error
  if (lInt === 0 && rInt === 0) return null;

  // combine into a date-fn.sub() compatible format
  // TODO: fix the sorting to account for units rather than just value
  return [
    { [left.unit]: lInt, isPositive: lInt >= 0, _key: left.unit, _value: lInt },
    {
      [right.unit]: rInt,
      isPositive: rInt >= 0,
      _key: right.unit,
      _value: rInt,
    },
  ].sort((a, b) => a._value - b._value);
}

export function isValidDateDiff(dateDiffString: string) {
  const dateDiff = parseDateDiff(dateDiffString);
  return dateDiff;
}

export function attemptToParseDate(
  value: unknown,
): UTCDate | Date | null | undefined {
  // check for emptyness / falseness
  if (!value) {
    return;
  }
  // numbers need to be converted to string for more success
  if (typeof value !== 'string') {
    value = value.toString();
  }
  const parsedDate = date_parse(
    value as string,
    DEFAULT_FORMAT_STR,
    new UTCDate(),
    { in: utc },
  );

  if (date_isValid(parsedDate)) return parsedDate;

  return null;
}

export function formatDateWithDefaultFormat(v: unknown) {
  // empty values get empty strings
  if (!v || v instanceof Date === false) return '';
  if (typeof v.getMonth !== 'function') return '';
  return formatDate(v, DEFAULT_FORMAT_STR);
}

export function isDateInRange(
  diff: ParsedDateDiff[],
  value: UTCDate | Date,
  originDate: Date | UTCDate = new UTCDate(),
) {
  const offsetLeft = date_add(originDate, diff[0] as Duration, { in: utc });
  const offsetRight = date_add(originDate, diff[1] as Duration, { in: utc });

  const inRange = isWithinInterval(
    value,
    { start: offsetLeft, end: offsetRight },
    { in: utc },
  );
  return inRange;
}
