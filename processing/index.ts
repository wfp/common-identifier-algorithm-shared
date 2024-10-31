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

// inject used algo here
import { REGION, makeHasher } from "../../active_algorithm.js";

import { encoderForFile } from '../encoding/index.js';
import { decoderForFile, fileTypeOf } from '../decoding/index.js';

import { makeValidationResultDocument, makeValidatorListDict, validateDocumentWithListDict } from '../validation/index.js';

import { mapRequiredColumns } from './mapRequiredColumns.js';
import { Config } from '../config/Config.js';
import { BaseHasher, makeHasherFunction } from '../hashing/base.js';
import { Validation } from '../validation/Validation.js';

import Debug from 'debug';
const log = Debug('CID:Processing')


// HASH-GENERATION
// ---------------
function generateHashesForSheet(algorithmConfig: Config.AlgorithmColumns, hasher: BaseHasher, sheet: Sheet) {
    // generate for all rows
    let rows = sheet.data.map((row) => {
        const generatedHashes = hasher.generateHashForObject(algorithmConfig, row);
        return Object.assign({}, row, generatedHashes);
    });

    return new Sheet(sheet.name, rows);
}

function generateHashesForDocument(algorithmConfig: Config.AlgorithmColumns, hasher: BaseHasher, document: CidDocument) {
    // generate for all rows
    let sheets = document.sheets.map((sheet) => {
        return generateHashesForSheet(algorithmConfig, hasher, sheet);
    });

    return new CidDocument(sheets);
}


// SAVING DOCUMENTS
// ----------------

// Helper that saves a document with the prefered config
function outputDocumentWithConfig(basePath: string, outputFileType: SUPPORTED_FILE_TYPES, destinationConfig: Config.ColumnMap, document: CidDocument) {
    let encoderFactoryFn = encoderForFile(outputFileType);
    let encoder = encoderFactoryFn(destinationConfig);

    return encoder.encodeDocument(document, basePath);
}


// UTILITIES
// ---------

// return true if the validation was successful
function isDocumentValid(validationResult: Validation.SheetResult[]) {
    return !validationResult.some(sheet => !sheet.ok);
}

// Returns the "base name" (the plain file name, the last component of the path, without any directories)
function baseFileName(filePath: string) {
    const splitName = filePath.split(/[\\/]/);
    const lastComponent = splitName[splitName.length - 1].split(/\.+/);
    return lastComponent.slice(0,-1).join('.')
}

// MAPPING-DOCUMENT-RELATED
// ------------------------


// Returns true if the sheet is containing only the hash input columns
// in which case its a mapping-only sheet, and we need to treat it differently
function isMappingOnlySheet(config: Config.Options, sheet: Sheet) {

    // returns true if two sets are equal
    function areSetsEqual(xs: Set<string>,ys: Set<string>) {
        return xs.size === ys.size && [...xs].every((x) => ys.has(x));
    }

    const mappingDocumentColumns = mapRequiredColumns(config.algorithm["columns"], config.source, config.destination_map);
    // here we've already checked to have only one sheet
    const sheetColumns = (sheet.data.length > 0) ? Object.keys(sheet.data[0]) : [];

    const isMappingDocument = areSetsEqual(new Set(mappingDocumentColumns), new Set(sheetColumns));
    // log("MAPPING: ======>>>> ", {mappingDocumentColumns, sheetColumns, isMappingDocument});

    return isMappingDocument;

}


// Returns a new validator dictionary, keeps only the columns needed by the
// algorithm (so only columns relevant for mapping files are checked)
function keepValidatorsForColumns(config: Config.Options, validatorDict: { [key: string]: any[] }) {
    const keepColumnList = mapRequiredColumns(config.algorithm["columns"], config.source, config.destination_map);
    return keepColumnList.reduce((memo, col) => Object.assign(memo, { [col]: validatorDict[col]}), {})
}

// Returns a new output configuration with only the columns needed by the
// algorithm (so the validation result of a mapping document only has the mapping columns present)
function keepOutputColumns(config: Config.Options, outputConfig: Config.ColumnMap) {
    const keepColumnSet = new Set(mapRequiredColumns(config.algorithm["columns"], config.source, config.destination_map));

    return Object.assign({}, outputConfig, {
        columns: outputConfig.columns.filter(({alias}) => keepColumnSet.has(alias))
    })
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

export async function preprocessFile(config: Config.Options, inputFilePath: string, limit: number | undefined = undefined): Promise<PreprocessFileResult> {
    log("------------ preprocessFile -----------------")

    // the input file path
    // let inputFilePath = program.args[0];
    let inputFileType = fileTypeOf(inputFilePath);

    if (!inputFileType) {
        throw new Error("Unknown input file type");
    }

    // DECODE
    // ======

    // find a decoder
    let decoderFactoryFn = decoderForFile(inputFileType);
    let decoder = decoderFactoryFn(config.source);

    // decode the data
    let decoded = await decoder.decodeFile(inputFilePath);

    // check if there is more then one sheets in the input and throw an error
    if (decoded.sheets.length > 1) {
        throw new Error("Input files must have only one sheet")
    }

    // apply limiting if needed
    if (limit) {
        log("[LOAD] Using input row limit: ",  limit);
        decoded.sheets[0].data = decoded.sheets[0].data.slice(0, limit);
    }
    // VALIDATION
    // ==========
    // prepare the validators
    let validatorDict = makeValidatorListDict(config.validations);

    // Figure out if this is a mapping document or an assistance document
    const isMappingDocument = isMappingOnlySheet(config, decoded.sheets[0])
    // if this is a mapping document leave only the validators for the algorithm columns
    if (isMappingDocument) {
        validatorDict = keepValidatorsForColumns(config, validatorDict);
    }

    // do the actual validation
    let validationResult = validateDocumentWithListDict(validatorDict, decoded);

    let validationErrorsOutputFile: string[] | string = "";
    let validationResultDocument;

    if (!isDocumentValid(validationResult)) {

        // by default the validation results show the "source" section columns
        let validationResultBaseConfig = config.source;

        // but if this is a mapping document we only show the mapping columns in the validation output document
        if (isMappingDocument) {
            validationResultBaseConfig = keepOutputColumns(config, validationResultBaseConfig);
        }

        // check if validation is ok -- if yes write the file out
        validationResultDocument = makeValidationResultDocument(validationResultBaseConfig, validationResult);

        // The error file is output to the OS's temporary directory
        const errorOutputBasePath = path.join(os.tmpdir(), baseFileName(inputFilePath));

        validationErrorsOutputFile = outputDocumentWithConfig(errorOutputBasePath, inputFileType, config.destination_errors, validationResultDocument);
        // ensure that we only return a single value
        if (validationErrorsOutputFile.length > 0) {
            validationErrorsOutputFile = validationErrorsOutputFile[0];
        }
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

export async function processFile(
        config: Config.Options,
        ouputPath:string,
        inputFilePath: string,
        limit: number|undefined = undefined,
        format: SUPPORTED_FILE_TYPES | null,
        hasherFactory: makeHasherFunction=makeHasher
    ): Promise<ProcessFileResult> {
    log("------------ preprocessFile -----------------")

    // the input file path
    let inputFileType = fileTypeOf(inputFilePath);

    if (!inputFileType) {
        throw new Error("Unknown input file type");
    }

    // DECODE
    // ======

    // find a decoder
    let decoderFactoryFn = decoderForFile(inputFileType);
    let decoder = decoderFactoryFn(config.source);

    // decode the data
    let decoded = await decoder.decodeFile(inputFilePath);


    // apply limiting if needed
    if (limit) {
        log("[LOAD] Using input row limit: ",  limit);
        decoded.sheets[0].data = decoded.sheets[0].data.slice(0, limit);
    }



    // VALIDATION
    // ==========

    // Validation is currently not done in this step -- the input document is assumed to be valid
    /* istanbul ignore next */
    if (false) {
        let validatorDict = makeValidatorListDict(config.validations);
        let validationResult = validateDocumentWithListDict(validatorDict, decoded);
    }

    // Figure out if this is a mapping document or an assistance document
    const isMappingDocument = isMappingOnlySheet(config, decoded.sheets[0])

    // HASHING
    // =======
    let hasher = hasherFactory(config.algorithm);
    let result = generateHashesForDocument(config.algorithm.columns, hasher, decoded)


    // OUTPUT
    // ------

    // if the user specified a format use that, otherwise use the input format
    const outputFileType = format || inputFileType;

    // helper to output a document with a specific config
    function outputDocumentWithConfig(destinationConfig: Config.ColumnMap, document: CidDocument) {

        let basePath = ouputPath;

        let encoderFactoryFn = encoderForFile(outputFileType);
        let encoder = encoderFactoryFn(destinationConfig);

        return encoder.encodeDocument(document, basePath);
    }

    // output the base document
    let mainOutputFiles = isMappingDocument ? [] : outputDocumentWithConfig(config.destination, result);
    // output the mapping document
    let mappingFilePaths = outputDocumentWithConfig(config.destination_map, result);

    return {
        // inputData: decoded,
        outputData: result,
        outputFilePaths: mainOutputFiles,
        mappingFilePaths,
        // provide a complete list of output files
        allOutputPaths: mainOutputFiles.concat(mappingFilePaths),
    };


}