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
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { EncoderBase } from '../../encoding/base.js';
import { CidDocument } from '../../document.js';
import { Config } from '../../config/Config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_CFG: Config.ColumnMap = {
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
    test__generateHeaderRow() {
      return this.generateHeaderRow();
    }
    test__filterDataBasedOnConfig(data: any) {
      return this.filterDataBasedOnConfig(data);
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
  expect(e.test__getOutputNameFor('output')).toEqual('output_POSTFIX');

  BASE_CFG.postfix = '_PF_{{yyyy}}';
  e = makeEncoderBase(BASE_CFG);
  const d = new Date();
  expect(e.test__getOutputNameFor('output')).toEqual(
    `output_PF_${d.getFullYear()}`,
  );
});

test('EncoderBase::generateHeaderRow', () => {
  let e = makeEncoderBase(BASE_CFG);
  expect(e.test__generateHeaderRow()).toEqual({ col_a: 'A', col_b: 'B' });
});

test('EncoderBase::filterDataBasedOnConfig', () => {
  let e = makeEncoderBase(BASE_CFG);
  const test_data = [
    { col_a: 123, col_b: 456, col_c: 'zxc' },
    { col_a: 789, col_b: 'abc' },
  ];
  const expected = [
    { col_a: 123, col_b: 456 },
    { col_a: 789, col_b: 'abc' },
  ];

  expect(e.test__filterDataBasedOnConfig(test_data)).toEqual(expected);
});
