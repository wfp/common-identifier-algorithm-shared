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

import { BaseHasher } from '../hashing/base';
import { fileTypeOf } from '../decoding/index';
import { isMappingOnlyDocument } from './mapping';
import { SUPPORTED_FILE_TYPES } from '../document';
import { readFile, writeFileWithConfig } from './shared';

import type { Config } from '../config/Config';
import type { CidDocument } from '../document';
import type { makeHasherFunction } from '../hashing/base';

import Debug from 'debug';
const log = Debug('CID:processFile');


export const generateHashesForDocument = (hasher: BaseHasher, document: CidDocument): CidDocument => {
  // generate for all rows
  let rows = document.data.map((row) => {
    const generatedHashes = hasher.generateHashForObject(row);
    return Object.assign({}, row, generatedHashes);
  });
  return { name: 'hashedDocument', data: rows };
};

export interface ProcessFileResult {
  isMappingDocument: boolean;
  document: CidDocument;
  outputFilePath?: string;
  mappingFilePath: string;
}

interface ProcessFileInput {
  config: Config.FileConfiguration;
  outputPath: string;
  inputFilePath: string;
  hasherFactory: makeHasherFunction;
  format?: SUPPORTED_FILE_TYPES;
  limit?: number;
}

export async function processFile({
  config,
  outputPath,
  inputFilePath,
  hasherFactory,
  format = undefined,
  limit = undefined,
}: ProcessFileInput): Promise<ProcessFileResult> {
  log('------------ processFile -----------------');

  const inputFileType = fileTypeOf(inputFilePath);

  const decoded = await readFile({ fileType: inputFileType, columnConfig: config.source, filePath: inputFilePath, limit});

  const hasher = hasherFactory(config.algorithm);
  const result = generateHashesForDocument(hasher, decoded);

  // this function assumes that config.destination, config.destination_map, and config.destination_errors
  // are set in the configuration file. This is not validated at launch time since these fields can be
  // omitted from config if using this a library (without the UI). Do a quick undefined check here to
  // validate:
  if (!config.destination || !config.destination_map || !config.destination_errors) {
    // TODO: how to propagate this error up to the UI (is that even necessary)?
    throw new Error("ERROR: Config file invalid for this use, it must specify 'destination', 'destination_map', and 'destination_errors' fields.")
  }

  // if the user specified a format use that, otherwise use the input format
  const outputFileType = format || inputFileType;

  const isMappingDocument = isMappingOnlyDocument(
    config.algorithm.columns,
    config.source,
    config.destination_map,
    decoded,
  );
  // output the base document
  const outputFilePath = isMappingDocument ? undefined : writeFileWithConfig({
    fileType: outputFileType,
    columnConfig: config.destination,
    document: result,
    filePath: outputPath
  });
  // output the mapping document
  const mappingFilePath = writeFileWithConfig({
    fileType: outputFileType,
    columnConfig: config.destination_map,
    document: result,
    filePath: outputPath
  });

  return {
    isMappingDocument,
    document: result,
    outputFilePath: outputFilePath,
    mappingFilePath: mappingFilePath,
  };
}
