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
import * as dateFns from 'date-fns';
import { DateDiffValidator } from '../../src/validation/validators/date_diff.js';

function toDateStr(offset: dateFns.Duration) {
  const d = dateFns.add(new Date(), offset);
  const leadingZero = (v: number) => `${v < 10 ? '0' : ''}${v}`;
  return `${d.getFullYear()}${leadingZero(d.getMonth() + 1)}${leadingZero(d.getDate())}`;
}

test('DateDiffValidator::future case', () => {
  let v = new DateDiffValidator({ op: 'date_diff', value: ':3M' });

  expect(v.validate(toDateStr({ months: -10 }))).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be between today and 3 months',
  }); // 10 months in the past
  expect(v.validate(toDateStr({ months: -1 }))).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be between today and 3 months',
  }); // 1 month in the past
  expect(v.validate(toDateStr({ months: 2 }))).toEqual({
    ok: true,
    kind: 'date_diff',
  }); // 2 months in the future
  expect(v.validate(toDateStr({ months: 3 }))).toEqual({
    ok: true,
    kind: 'date_diff',
  }); // 3 months in the future
  expect(v.validate(toDateStr({ months: 4 }))).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be between today and 3 months',
  }); // 4 months in the future
});

test('DateDiffValidator::past case', () => {
  let v = new DateDiffValidator({ op: 'date_diff', value: '-3M:' });

  expect(v.validate(toDateStr({ months: -10 }))).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be between -3 months and today',
  }); // 10 months in the past
  expect(v.validate(toDateStr({ months: -4 }))).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be between -3 months and today',
  }); // 4 months in the past
  expect(v.validate(toDateStr({ months: -3 }))).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be between -3 months and today',
  }); // 3 months in the past
  expect(v.validate(toDateStr({ months: -2, days: 31 }))).toEqual({
    ok: true,
    kind: 'date_diff',
  }); // 3 months in the past
  expect(v.validate(toDateStr({ months: -2 }))).toEqual({
    ok: true,
    kind: 'date_diff',
  }); // 2 months in the past
  expect(v.validate(toDateStr({ months: 0 }))).toEqual({
    ok: true,
    kind: 'date_diff',
  }); // 1 month in the future
  expect(v.validate(toDateStr({ months: 1 }))).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be between -3 months and today',
  }); // 1 month in the future
  expect(v.validate(toDateStr({ months: 10 }))).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be between -3 months and today',
  }); // 10 months in the future
});

test('DateDiffValidator::invalid', () => {
  let v = new DateDiffValidator({ op: 'date_diff', value: '-3M:' });
  expect(v.validate('20241131')).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be a date',
  });
  expect(v.validate('00000000')).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be a date',
  });
  expect(v.validate(null)).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be a date',
  });
  expect(v.validate(undefined)).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be a date',
  });
  expect(v.validate(new Date())).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be a date',
  });
});

test('DateDiffValidator::inRange', () => {
  let a = new DateDiffValidator({ op: 'date_diff', value: '-12M:+2M' });

  let left = toDateStr({ months: 2 });
  expect(a.validate(left)).toEqual({ ok: true, kind: 'date_diff' });

  left = toDateStr({ months: -1 });
  expect(a.validate(left)).toEqual({ ok: true, kind: 'date_diff' });

  left = toDateStr({ months: 3 });
  expect(a.validate(left)).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be within -12 months and 2 months of today',
  });

  left = toDateStr({ months: -12 });
  expect(a.validate(left)).toEqual({
    ok: false,
    kind: 'date_diff',
    message: 'must be within -12 months and 2 months of today',
  });

  left = toDateStr({ months: 1 });
  expect(a.validate(left)).toEqual({ ok: true, kind: 'date_diff' });

  left = toDateStr({ months: 0 });
  expect(a.validate(left)).toEqual({ ok: true, kind: 'date_diff' });
});

test('DateDiffValidator fails for invalid options', () => {
  expect(
    // @ts-ignore
    () => new DateDiffValidator({ op: 'date_diff', value: 123 }),
  ).toThrow();
  expect(
    // @ts-ignore
    () => new DateDiffValidator({ op: 'date_diff', value: '[[[' }),
  ).toThrow();
});
