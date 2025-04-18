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

import path from 'node:path';
import os from 'node:os';

import { SUPPORTED_FILE_TYPES } from '../document';
import type { CidDocument } from '../document';

import { encoderForFile } from '../encoding/index';
import { decoderForFile, fileTypeOf } from '../decoding/index';

import {
  makeValidationResultDocument,
  makeValidatorListDict,
  validateDocumentWithListDict,
} from '../validation/index';

import { keepOutputColumns, isMappingOnlyDocument, keepValidatorsForColumns } from './mapping';
import type { Config } from '../config/Config';
import { BaseHasher } from '../hashing/base';
import type { makeHasherFunction } from '../hashing/base';
import type { Validated } from '../validation/Validation';

import Debug from 'debug';
const log = Debug('CID:Processing');

export async function readFile(
  fileType: SUPPORTED_FILE_TYPES,
  columnConfig: Config.ColumnMap,
  filePath: string,
  limit?: number | undefined,
): Promise<CidDocument> {
  let decoderFactoryFn = decoderForFile(fileType);
  let decoder = decoderFactoryFn(columnConfig, limit);

  // decode the data
  let decoded = await decoder.decodeFile(filePath);
  return decoded;
}

export function validateDocument(
  config: Config.Options,
  decoded: CidDocument,
  isMapping: boolean = false,
): Validated.Document {
  let validatorDict = makeValidatorListDict(config.validations);

  // if this is a mapping document leave only the validators for the algorithm columns
  if (isMapping) validatorDict = keepValidatorsForColumns(config, validatorDict);

  // do the actual validation
  return validateDocumentWithListDict(validatorDict, decoded);
}

export const generateHashesForDocument = (hasher: BaseHasher, document: CidDocument): CidDocument => {
  // generate for all rows
  let rows = document.data.map((row) => {
    const generatedHashes = hasher.generateHashForObject(row);
    return Object.assign({}, row, generatedHashes);
  });
  return {
    name: 'hashedDocument',
    data: rows,
  };
};

// helper to output a document with a specific config
export function writeFileWithConfig(
  fileType: SUPPORTED_FILE_TYPES,
  columnConfig: Config.ColumnMap,
  document: CidDocument,
  filePath: string,
) {
  let encoderFactoryFn = encoderForFile(fileType);
  let encoder = encoderFactoryFn(columnConfig);

  return encoder.encodeDocument(document, filePath);
}

// PRE-PROCESSING
// --------------

export interface PreprocessFileResult {
  isValid: boolean;
  isMappingDocument: boolean;
  document: CidDocument; // either legitimate or error
  inputFilePath: string;
  errorFilePath?: string;
}

interface PreProcessFileInput {
  config: Config.Options;
  inputFilePath: string;
  errorFileOutputPath?: string;
  limit?: number;
}

export async function preprocessFile({
  config,
  inputFilePath,
  errorFileOutputPath = undefined,
  limit = undefined,
}: PreProcessFileInput): Promise<PreprocessFileResult> {
  log('------------ preprocessFile -----------------');

  let inputFileType = fileTypeOf(inputFilePath);

  // DECODE
  // ======
  const decoded = await readFile(inputFileType, config.source, inputFilePath, limit);

  // VALIDATION
  // ==========
  const isMappingDocument = isMappingOnlyDocument(
    config.algorithm.columns,
    config.source,
    config.destination_map,
    decoded,
  );
  const validationResult = validateDocument(config, decoded, isMappingDocument);

  let validationErrorsOutputFile: string | undefined;
  let validationResultDocument: CidDocument;

  // if any sheets contain errors, create an error file
  if (!validationResult.ok) {
    // by default the validation results show the "source" section columns
    let validationResultBaseConfig = config.source;

    // but if this is a mapping document we only show the mapping columns in the validation output document
    if (isMappingDocument) validationResultBaseConfig = keepOutputColumns(config, validationResultBaseConfig);

    validationResultDocument = makeValidationResultDocument(validationResultBaseConfig, validationResult);

    // The error file is output to the OS's temporary directory
    if (!errorFileOutputPath) errorFileOutputPath = path.join(os.tmpdir(), path.basename(inputFilePath));

    validationErrorsOutputFile = writeFileWithConfig(
      inputFileType,
      config.destination_errors,
      validationResultDocument,
      errorFileOutputPath,
    );
    return {
      isValid: validationResult.ok,
      isMappingDocument,
      document: validationResultDocument,
      inputFilePath: inputFilePath,
      errorFilePath: validationErrorsOutputFile,
    };
  }

  return {
    isValid: validationResult.ok,
    isMappingDocument,
    document: decoded,
    inputFilePath: inputFilePath,
    errorFilePath: validationErrorsOutputFile,
  };
}

// PROCESSING
// ----------

export interface ProcessFileResult {
  isMappingDocument: boolean;
  document: CidDocument;
  outputFilePath?: string;
  mappingFilePath: string;
}

interface ProcessFileInput {
  config: Config.Options;
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

  // DECODE
  // ======
  const decoded = await readFile(inputFileType, config.source, inputFilePath, limit);

  // HASHING
  // =======
  const hasher = hasherFactory(config.algorithm);
  const result = generateHashesForDocument(hasher, decoded);

  // OUTPUT
  // ------

  // if the user specified a format use that, otherwise use the input format
  const outputFileType = format || inputFileType;

  const isMappingDocument = isMappingOnlyDocument(
    config.algorithm.columns,
    config.source,
    config.destination_map,
    decoded,
  );
  // output the base document
  const mainOutputFile = isMappingDocument
    ? undefined
    : writeFileWithConfig(outputFileType, config.destination, result, outputPath);
  // output the mapping document
  const mappingFilePath = writeFileWithConfig(outputFileType, config.destination_map, result, outputPath);

  return {
    isMappingDocument,
    document: result,
    outputFilePath: mainOutputFile,
    mappingFilePath: mappingFilePath,
  };
}
