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

import os from 'node:os';
import path from 'node:path';
import { fileTypeOf } from '../decoding/index';
import { readFile, writeFileWithConfig } from './shared';
import { keepOutputColumns, isMappingOnlyDocument, keepValidatorsForColumns } from './mapping';
import { makeValidationResultDocument, makeValidatorListDict, validateDocumentWithListDict } from '../validation/index';

import type { CidDocument } from '../document';
import type { Config } from '../config/Config';
import type { Validated } from '../validation/Validation';

import Debug from 'debug';
const log = Debug('CID:preprocessFile');

// PRE-PROCESSING
// --------------

export interface PreprocessFileResult {
  isValid: boolean;
  isMappingDocument: boolean;
  document: CidDocument; // either legitimate or error
  inputFilePath: string;
  errorFilePath?: string;
}

interface PreprocessFileInput {
  config: Config.FileConfiguration;
  inputFilePath: string;
  errorFileOutputPath?: string;
  limit?: number;
}

export async function preprocessFile({
  config,
  inputFilePath,
  errorFileOutputPath = undefined,
  limit = undefined,
}: PreprocessFileInput): Promise<PreprocessFileResult> {
  log('------------ preprocessFile -----------------');

  let inputFileType = fileTypeOf(inputFilePath);

  const decoded = await readFile({ fileType: inputFileType, columnConfig: config.source, filePath: inputFilePath, limit });

  // this function assumes that config.destination, config.destination_map, and config.destination_errors
  // are set in the configuration file. This is not validated at launch time since these fields can be
  // omitted from config if using this a library (without the UI). Do a quick undefined check here to
  // validate:
  if (!config.destination || !config.destination_map || !config.destination_errors) {
    // TODO: how to propagate this error up to the UI (is that even necessary)?
    throw new Error("ERROR: Config file invalid for this use, it must specify 'destination', 'destination_map', and 'destination_errors' fields.")
  }

  const isMapping = isMappingOnlyDocument(
    config.algorithm.columns,
    config.source,
    config.destination_map,
    decoded,
  );
  const validationResult = validateDocument({ config, decoded, isMapping });

  let validationErrorsOutputFile: string | undefined;
  let validationResultDocument: CidDocument;

  // if any sheets contain errors, create an error file
  if (!validationResult.ok) {
    // by default the validation results show the "source" section columns
    let validationResultBaseConfig = config.source;

    // but if this is a mapping document we only show the mapping columns in the validation output document
    if (isMapping) validationResultBaseConfig = keepOutputColumns(config, validationResultBaseConfig);

    validationResultDocument = makeValidationResultDocument(validationResultBaseConfig, validationResult);

    // The error file is output to the OS's temporary directory
    if (!errorFileOutputPath) errorFileOutputPath = path.join(os.tmpdir(), path.basename(inputFilePath));

    validationErrorsOutputFile = writeFileWithConfig({
      fileType: inputFileType,
      columnConfig: config.destination_errors,
      document: validationResultDocument,
      filePath: errorFileOutputPath,
    });
    return {
      isValid: validationResult.ok,
      isMappingDocument: isMapping,
      document: validationResultDocument,
      inputFilePath: inputFilePath,
      errorFilePath: validationErrorsOutputFile,
    };
  }

  return {
    isValid: validationResult.ok,
    isMappingDocument: isMapping,
    document: decoded,
    inputFilePath: inputFilePath,
    errorFilePath: validationErrorsOutputFile,
  };
}

type ValidateDocumentInput = |
  { config: Config.CoreConfiguration, decoded: CidDocument, isMapping: false } |
  { config: Config.FileConfiguration, decoded: CidDocument, isMapping: boolean }

export function validateDocument({ config, decoded, isMapping }: ValidateDocumentInput): Validated.Document {
  let validatorDict = makeValidatorListDict(config.validations);

  // if this is a mapping document leave only the validators for the algorithm columns
  if (isMapping) validatorDict = keepValidatorsForColumns(config, validatorDict);

  return validateDocumentWithListDict(validatorDict, decoded);
}