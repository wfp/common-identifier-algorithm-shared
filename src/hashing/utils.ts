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

import type { Config } from '../config/Config.js';
import type { Validation } from '../validation/Validation.js';

// takes an row object and the "algorithm.columns" config and returns a new
// object with { static: [<COL VALUES>], to_translate: [..], reference: [...] } columns
export function extractAlgoColumnsFromObject(
  columnConfig: Config.Options['algorithm']['columns'],
  obj: Validation.Data['row'],
) {
  // check if we have an actual config
  if (typeof columnConfig !== 'object') {
    throw new Error('Invalid algorithm columns config');
  }

  let output: Config.Options['algorithm']['columns'] = {
    static: columnConfig.static.map((colName) => obj[colName]),
    to_translate: columnConfig.to_translate.map((colName) => obj[colName]),
    reference: columnConfig.reference.map((colName) => obj[colName]),
  };

  return output;
}

// Centralized helper to join different parts of a field value list
export function joinFieldsForHash(fieldValueList: string[]) {
  return fieldValueList.join('');
}

// Returns a cleaned version (null and undefined values removed)
// TODO: implement this based on WFP feedback
export function cleanValueList(fieldValueList: any[]) {
  return fieldValueList.map((v) => (typeof v === 'string' ? v : ''));
}
