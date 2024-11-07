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

import path from 'node:path';
import os from 'node:os';

import { Sheet, CidDocument, SUPPORTED_FILE_TYPES } from '../document.js';

import { encoderForFile } from '../encoding/index.js';
import { decoderForFile, fileTypeOf } from '../decoding/index.js';

import { makeValidationResultDocument, makeValidatorListDict, validateDocumentWithListDict } from '../validation/index.js';

import { keepOutputColumns, isMappingOnlySheet, keepValidatorsForColumns } from './mapping.js';
import { Config } from '../config/Config.js';
import { BaseHasher, makeHasherFunction } from '../hashing/base.js';
import { Validation } from '../validation/Validation.js';

import Debug from 'debug';
const log = Debug('CID:Processing')


export async function readFile(fileType: SUPPORTED_FILE_TYPES, columnConfig: Config.ColumnMap, filePath: string, limit?: number|undefined): Promise<CidDocument> {
    let decoderFactoryFn = decoderForFile(fileType);
    let decoder = decoderFactoryFn(columnConfig, limit);

    // decode the data
    let decoded = await decoder.decodeFile(filePath);

    if (decoded.sheets.length > 1) throw new Error("Input files must have only one sheet");
    return decoded
}

export function validateDocument(config: Config.Options, decoded: CidDocument, isMapping: boolean = false): Validation.SheetResult[] {
    let validatorDict = makeValidatorListDict(config.validations);

    // if this is a mapping document leave only the validators for the algorithm columns
    if (isMapping) validatorDict = keepValidatorsForColumns(config, validatorDict);

    // do the actual validation
    return validateDocumentWithListDict(validatorDict, decoded);
}

export function generateHashesForDocument(hasher: BaseHasher, document: CidDocument) {
    // generate for all rows
    let sheets = document.sheets.map((sheet) => {
        // generate for all rows
        let rows = sheet.data.map((row) => {
            const generatedHashes = hasher.generateHashForObject(row);
            return Object.assign({}, row, generatedHashes);
        });

        return new Sheet(sheet.name, rows);
    });

    return new CidDocument(sheets);
}

// helper to output a document with a specific config
export function writeFileWithConfig(fileType: SUPPORTED_FILE_TYPES, columnConfig: Config.ColumnMap, document: CidDocument, filePath: string) {
    let encoderFactoryFn = encoderForFile(fileType);
    let encoder = encoderFactoryFn(columnConfig);

    return encoder.encodeDocument(document, filePath);
}

// PRE-PROCESSING
// --------------

export interface PreprocessFileResult {
    inputData: CidDocument;
    validationResultDocument: CidDocument | undefined;
    validationResult: Validation.SheetResult[];
    validationErrorsOutputFile: string[] | string;
    isMappingDocument: boolean;
}

interface PreProcessFileInput {
    config: Config.Options;
    inputFilePath: string;
    errorFileOutputPath?: string;
    limit?: number;
}

export async function preprocessFile({ config, inputFilePath, errorFileOutputPath=undefined, limit=undefined }: PreProcessFileInput): Promise<PreprocessFileResult> {
    log("------------ preprocessFile -----------------")

    let inputFileType = fileTypeOf(inputFilePath);

    // DECODE
    // ======
    const decoded = await readFile(inputFileType, config.source, inputFilePath, limit);
    
    // VALIDATION
    // ==========
    const isMappingDocument = isMappingOnlySheet(
        config.algorithm.columns,
        config.source,
        config.destination_map,
        decoded.sheets[0])
    const validationResult = validateDocument(config, decoded, isMappingDocument);
    
    let validationErrorsOutputFile: string[] | string = "";
    let validationResultDocument;

    // if any sheets contain errors, create an error file
    if (!validationResult.some(sheet => sheet.ok)){

        // by default the validation results show the "source" section columns
        let validationResultBaseConfig = config.source;

        // but if this is a mapping document we only show the mapping columns in the validation output document
        if (isMappingDocument) validationResultBaseConfig = keepOutputColumns(config, validationResultBaseConfig);

        validationResultDocument = makeValidationResultDocument(validationResultBaseConfig, validationResult);

        // The error file is output to the OS's temporary directory
        if (!errorFileOutputPath) errorFileOutputPath = path.join(os.tmpdir(), path.basename(inputFilePath));

        validationErrorsOutputFile = writeFileWithConfig(inputFileType, config.destination_errors, validationResultDocument, errorFileOutputPath);
        // ensure that we only return a single value
        if (validationErrorsOutputFile.length > 0) validationErrorsOutputFile = validationErrorsOutputFile[0];
    }

    return {
        inputData: decoded,
        validationResultDocument,
        validationResult,
        validationErrorsOutputFile,
        isMappingDocument,
    };

}


// PROCESSING
// ----------

export interface ProcessFileResult {
    outputData: CidDocument;
    outputFilePaths: string[];
    mappingFilePaths: string[];
    allOutputPaths: string[];
}

interface ProcessFileInput { 
    config: Config.Options,
    outputPath:string,
    inputFilePath: string,
    hasherFactory: makeHasherFunction,
    format?: SUPPORTED_FILE_TYPES,
    limit?: number,
}

export async function processFile({config, outputPath, inputFilePath, hasherFactory, format=undefined, limit=undefined, }: ProcessFileInput): Promise<ProcessFileResult> {
    log("------------ processFile -----------------")

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
    
    const isMappingDocument = isMappingOnlySheet(
        config.algorithm.columns,
        config.source,
        config.destination_map,
        decoded.sheets[0])
    // output the base document
    const mainOutputFiles = isMappingDocument ? [] : writeFileWithConfig(outputFileType, config.destination, result, outputPath);
    // output the mapping document
    const mappingFilePaths = writeFileWithConfig(outputFileType, config.destination_map, result, outputPath);

    return {
        // inputData: decoded,
        outputData: result,
        outputFilePaths: mainOutputFiles,
        mappingFilePaths,
        allOutputPaths: mainOutputFiles.concat(mappingFilePaths),
    };
}