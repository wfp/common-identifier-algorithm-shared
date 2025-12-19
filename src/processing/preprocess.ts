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
const log = Debug('cid::engine::process::preprocess');

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
  log(`[INFO] Starting preprocessing of file '${inputFilePath}' with config file '${config.meta.signature}'`);

  let inputFileType = fileTypeOf(inputFilePath);

  const decoded = await readFile({ fileType: inputFileType, columnConfig: config.source, filePath: inputFilePath, limit });

  // this function assumes that config.destination, config.destination_map, and config.destination_errors
  // are set in the configuration file. This is not validated at launch time since these fields can be
  // omitted from config if using this a library (without the UI). Do a quick undefined check here to
  // validate:
  if (!config.destination || !config.destination_map || !config.destination_errors) {
    log('[ERROR] Config file invalid for this use, it must specify destination, destination_map, and destination_errors fields.');
    // TODO: how to propagate this error up to the UI (is that even necessary)?
    throw new Error("ERROR: Config file invalid for this use, it must specify 'destination', 'destination_map', and 'destination_errors' fields.")
  }

  const isMapping = isMappingOnlyDocument({
    configAlgo: config.algorithm.columns,
    configSource: config.source,
    configDestination: config.destination_map,
    document: decoded,
  });

  log(`[INFO] Validating document...`);
  const validationResult = validateDocument({ config, decoded, isMapping });

  let validationErrorsOutputFile: string | undefined;
  let validationResultDocument: CidDocument;

  // if any sheets contain errors, create an error file
  if (!validationResult.ok) {
    log(`[ERROR] Validation errors detected during preprocessing.`);
    // by default the validation results show the "source" section columns
    let validationResultBaseConfig = config.source;

    // but if this is a mapping document we only show the mapping columns in the validation output document
    if (isMapping) validationResultBaseConfig = keepOutputColumns(config, validationResultBaseConfig);

    validationResultDocument = makeValidationResultDocument({ sourceConfig: validationResultBaseConfig, documentResult: validationResult });

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
  else log(`[INFO] No validation errors detected during preprocessing.`);

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
  let validatorListDict = makeValidatorListDict(config.validations);

  // if this is a mapping document leave only the validators for the algorithm columns
  if (isMapping) validatorListDict = keepValidatorsForColumns(config, validatorListDict);

  return validateDocumentWithListDict({ validatorListDict, document: decoded });
}