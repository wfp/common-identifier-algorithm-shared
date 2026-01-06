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
import { test, expect } from 'vitest';
import { EncoderBase } from '@/encoding/base';
import type { Config } from '@/config/Config';

const BASE_CFG: Config.ColumnMap = {
  prefix: "PREFIX_",
  postfix: '_POSTFIX',
  columns: [
    { name: 'A', alias: 'col_a' },
    { name: 'B', alias: 'col_b' },
  ],
};

function makeEncoderBase(cfg = BASE_CFG) {
  class TestEncoder extends EncoderBase {
    constructor() {
      super(cfg);
    }
    test__getOutputNameFor(baseFileName: string) {
      return this.getOutputNameFor(baseFileName);
    }
    startDocument() {
      return;
    }
    endDocument() {
      return;
    }
    writeDocument() {
      return;
    }
  }
  return new TestEncoder();
}

test('EncoderBase::getOutputNameFor', () => {
  let e = makeEncoderBase(BASE_CFG);
  expect(e.test__getOutputNameFor('output')).toEqual('PREFIX_output_POSTFIX');

  BASE_CFG.postfix = '_PF_{{yyyy}}';
  e = makeEncoderBase(BASE_CFG);
  const d = new Date();
  expect(e.test__getOutputNameFor('output')).toEqual(`PREFIX_output_PF_${d.getFullYear()}`);
});


