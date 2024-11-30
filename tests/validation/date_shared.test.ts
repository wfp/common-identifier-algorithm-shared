// Common Identifier Application
// Copyright (C) 2024 World Food Programme

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import {
  parseDateDiff,
  isValidDateDiff,
  attemptToParseDate,
  formatDateWithDefaultFormat,
} from '../../src/validation/validators/date_shared.js';
import type { ParsedDateDiff } from '../../src/validation/validators/date_shared.js';
import { UTCDate } from '@date-fns/utc';

test('parseDateRangeDiff', () => {
  let input = '-1M:1M';
  let expected: ParsedDateDiff[] | null = [
    { months: -1, isPositive: false, _key: 'months', _value: -1 },
    { months: 1, isPositive: true, _key: 'months', _value: 1 },
  ];
  expect(parseDateDiff(input)).toEqual(expected);
  expect(isValidDateDiff(input) ? true : false).toEqual(expected !== null);

  input = '-1M:+1M';
  expected = [
    { months: -1, isPositive: false, _key: 'months', _value: -1 },
    { months: 1, isPositive: true, _key: 'months', _value: 1 },
  ];
  expect(parseDateDiff(input)).toEqual(expected);
  expect(isValidDateDiff(input) ? true : false).toEqual(expected !== null);

  input = ':1M';
  expected = [
    { days: 0, isPositive: true, _key: 'days', _value: 0 },
    { months: 1, isPositive: true, _key: 'months', _value: 1 },
  ];
  expect(parseDateDiff(input)).toEqual(expected);
  expect(isValidDateDiff(input) ? true : false).toEqual(expected !== null);

  input = '-1M:';
  expected = [
    { months: -1, isPositive: false, _key: 'months', _value: -1 },
    { days: 0, isPositive: true, _key: 'days', _value: 0 },
  ];
  expect(parseDateDiff(input)).toEqual(expected);
  expect(isValidDateDiff(input) ? true : false).toEqual(expected !== null);

  input = '-1M+1M';
  expected = null;
  expect(parseDateDiff(input)).toEqual(expected);
  expect(isValidDateDiff(input) ? true : false).toEqual(expected !== null);

  input = '0M:0M';
  expected = null;
  expect(parseDateDiff(input)).toEqual(expected);
  expect(isValidDateDiff(input) ? true : false).toEqual(expected !== null);

  input = '-1M:-2M';
  expected = [
    { months: -2, isPositive: false, _key: 'months', _value: -2 },
    { months: -1, isPositive: false, _key: 'months', _value: -1 },
  ];
  expect(parseDateDiff(input)).toEqual(expected);
  expect(isValidDateDiff(input) ? true : false).toEqual(expected !== null);

  input = '0M:-10d';
  expected = [
    { days: -10, isPositive: false, _key: 'days', _value: -10 },
    { months: 0, isPositive: true, _key: 'months', _value: 0 },
  ];
  expect(parseDateDiff(input)).toEqual(expected);
  expect(isValidDateDiff(input) ? true : false).toEqual(expected !== null);

  input = '-1M:-10M';
  expected = [
    { months: -10, isPositive: false, _key: 'months', _value: -10 },
    { months: -1, isPositive: false, _key: 'months', _value: -1 },
  ];
  expect(parseDateDiff(input)).toEqual(expected);
  expect(isValidDateDiff(input) ? true : false).toEqual(expected !== null);

  input = '-1M:-10Z';
  expected = [
    { months: -1, isPositive: false, _key: 'months', _value: -1 },
    { days: 0, isPositive: true, _key: 'days', _value: 0 },
  ];
  expect(parseDateDiff(input)).toEqual(expected);
  expect(isValidDateDiff(input) ? true : false).toEqual(expected !== null);
});

test('attemptToParseDate', () => {
  const BAD_DATE = null;
  expect(attemptToParseDate(undefined)).toEqual(undefined);
  expect(attemptToParseDate(123)).toEqual(BAD_DATE);
  expect(attemptToParseDate('1992')).toEqual(BAD_DATE);
  expect(attemptToParseDate('1992/12/23')).toEqual(BAD_DATE);
  expect(attemptToParseDate('12/23/1991')).toEqual(BAD_DATE);
  expect(attemptToParseDate('19911223')).toEqual(new UTCDate(1991, 11, 23));
});

test('formatDateWithDefaultFormat', () => {
  const BAD_DATE = null;
  [
    [undefined, ''],
    [123, ''],
    [new Date(1991, 11, 11), '19911211'],
  ].forEach(([input, expected]) => {
    expect(formatDateWithDefaultFormat(input)).toEqual(expected);
  });
});

// test("isDateInRange", () => {
//     // if the target date is on the other side of the edge accept it
//     expect(isDateInRange(
//         { months: 3, isPositive: true, _key: 'months', _value: 3 },
//         new Date("1990-12-31T23:00:00.000Z"),
//         new Date("1992-04-05T22:00:00.000Z"),
//     )).toEqual(false)

//     expect(isDateInRange(
//         { months: 3, isPositive: true, _key: 'months', _value: 3 },
//         new Date("1991-01-01T23:00:00.000Z"),
//         new Date("1990-12-31T23:00:00.000Z"),
//     )).toEqual(true)

//     expect(isDateInRange(
//         { months: 2, isPositive: true, _key: 'months', _value: 2 },
//         new Date("2024-11-01T23:00:00.000Z"),
//         new Date("2024-10-15T23:00:00.000Z"),
//     )).toEqual(true)

//     const baseDate = new Date(1991, 1, 1);
//     const testData: Array<{spec: ParsedDateDiff, cases: Array<{ testCase: Date, expected: Boolean }>}> = [
//         {
//             spec: { months: 1, isPositive: true, _key: "months", _value: 1 },
//             cases: [
//                 { testCase: new Date(1991, 1, 11), expected: true },
//                 { testCase: new Date(1991, 2, 11), expected: false }
//             ]
//         },
//         {
//             spec: { months: 3, isPositive: true, _key: "months", _value: 3 },
//             cases: [
//                 { testCase: new Date(1991, 1, 11), expected: true },
//                 { testCase: new Date(1991, 4, 12), expected: false }
//             ]
//         },
//         {
//             spec: { months: -2, isPositive: false, _key: "months", _value: -2 },
//             cases: [
//                 { testCase: new Date(1991, 0, 11), expected: true },
//                 { testCase: new Date(1990, 10, 11), expected: false }
//             ]
//         }
//     ]
//     testData.forEach(({ spec, cases }) => {
//         cases.forEach(({ testCase, expected }) => {
//             expect(isDateInRange(spec, testCase, baseDate)).toEqual(expected)
//         })
//     });

//     expect(isDateInRange({ months: -2, isPositive: false, _key: "months", _value: -2 }, new Date(), new Date())).toEqual(true);
// })
