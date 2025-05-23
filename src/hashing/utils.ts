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

import type { Config } from '../config/Config';
import type { Validator } from '../validation/Validation';

// takes an row object and the "algorithm.columns" config and returns a new
// object with { static: [<COL VALUES>], to_translate: [..], reference: [...] } columns
export function extractAlgoColumnsFromObject(
  columnConfig: Config.CoreConfiguration['algorithm']['columns'],
  obj: Validator.InputData['row'],
) {
  // check if we have an actual config
  if (typeof columnConfig !== 'object') {
    throw new Error('Invalid algorithm columns config');
  }

  let output: Config.CoreConfiguration['algorithm']['columns'] = {
    static: columnConfig.static.map((colName) => obj[colName]),
    process: columnConfig.process.map((colName) => obj[colName]),
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
