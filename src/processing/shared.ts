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

import type { CidDocument } from '../document';
import { encoderForFile } from '../encoding/index';
import { decoderForFile } from '../decoding/index';
import { SUPPORTED_FILE_TYPES } from '../document';

import type { Config } from '../config/Config';

type WriteFileWithConfigInput = {
  fileType: SUPPORTED_FILE_TYPES,
  columnConfig: Config.ColumnMap,
  document: CidDocument,
  filePath: string,
}
export function writeFileWithConfig({ fileType, filePath, document, columnConfig }: WriteFileWithConfigInput) {
  let encoderFactoryFn = encoderForFile(fileType);
  let encoder = encoderFactoryFn(columnConfig);
  return encoder.encodeDocument(document, filePath);
}

type ReadFileInput = {
  fileType: SUPPORTED_FILE_TYPES,
  columnConfig: Config.ColumnMap,
  filePath: string,
  limit?: number,
}

export async function readFile({ fileType, columnConfig, filePath, limit }: ReadFileInput): Promise<CidDocument> {
  let decoderFactoryFn = decoderForFile(fileType);
  let decoder = decoderFactoryFn(columnConfig, limit);

  let decoded = await decoder.decodeFile(filePath);
  return decoded;
}