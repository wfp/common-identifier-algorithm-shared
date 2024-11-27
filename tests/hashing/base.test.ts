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

import { BaseHasher } from '../../src/hashing/base.js';
import type { Config } from '../../src/config/Config.js';
import type { Validation } from '../../src/validation/Validation.js';

const BASE_CFG: Config.Options['algorithm'] = {
  columns: { static: [], to_translate: [], reference: [] },
  hash: { strategy: 'SHA256' },
  salt: { source: 'STRING', value: 'NOPE', validator_regex: '' },
};

function makeBaseHasher(cfg = BASE_CFG) {
  class TestHasher extends BaseHasher {
    constructor() {
      super(cfg);
    }
    generateHashForObject(obj: Validation.Data['row']): {
      [key: string]: string;
    } {
      return {};
    }
  }
  return new TestHasher();
}

test('BaseHasher::generateHash', () => {
  const h = makeBaseHasher();

  expect(h.generateHashForValue('TEST123')).toEqual(
    '3RYYVQ6SB2UT5NKYHRBKLRBZUR6WHXXEUCV5LPATTYAQEFCZWLSA====',
  );
});

test('BaseHasher::invalid', () => {
  BASE_CFG.salt.source = 'FILE';

  expect(() => makeBaseHasher(BASE_CFG)).toThrow();
});
