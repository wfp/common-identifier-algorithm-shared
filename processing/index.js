const path = require('node:path');
const os = require('node:os');

const { Sheet, Document } = require('../document');

// inject used algo here
let {makeHasher} = require('../../active_algorithm');

const {encoderForFile} = require('../encoding');
const {decoderForFile, fileTypeOf} = require('../decoding');
const validation = require("../validation");

const {extractAlgoColumnsFromObject} = require('../hashing/utils');

const mappingRequiredColumns = require('./mappingRequiredColumns');


// HASH-GENERATION
// ---------------

// Generate the hash columns from the row object
function generateHashForRow(algorithmConfig, hasher, rowObject) {
    let extractedObj = extractAlgoColumnsFromObject(algorithmConfig.columns, rowObject);
    let res = hasher.generateHashForExtractedObject(extractedObj);
    return res;
}

function generateHashesForSheet(algorithmConfig, hasher, sheet) {
    // generate for all rows
    let rows = sheet.data.map((row) => {
        let generatedHashes = generateHashForRow(algorithmConfig, hasher, row);

        return Object.assign({}, row, generatedHashes);
    });

    return new Sheet(sheet.name, rows);
}


function generateHashesForDocument(algorithmConfig, hasher, document) {
    // generate for all rows
    let sheets = document.sheets.map((sheet) => {
        return generateHashesForSheet(algorithmConfig, hasher, sheet);
    });

    return new Document(sheets);
}


// SAVING DOCUMENTS
// ----------------

// Helper that saves a document with the prefered config
function outputDocumentWithConfig(basePath, outputFileType, destinationConfig, document) {

    let encoderFactoryFn = encoderForFile(outputFileType);
    let encoder = encoderFactoryFn(destinationConfig, {});

    return encoder.encodeDocument(document, basePath);
}


// UTILITIES
// ---------

// return true if the validation was successful
function isDocumentValid(validationResult) {
    return !validationResult.some(sheet => !sheet.ok);
}

// Returns the "base name" (the plain file name, the last component of the path, without any directories)
function baseFileName(filePath) {
    const splitName = filePath.split(/[\\/]/);
    const lastComponent = splitName[splitName.length - 1].split(/\.+/);
    return lastComponent.slice(0,-1).join('.')
}

// MAPPING-DOCUMENT-RELATED
// ------------------------


// Returns true if the sheet is containing only the hash input columns
// in which case its a mapping-only sheet, and we need to treat it differently
function isMappingOnlySheet(config, sheet) {

    // returns true if two sets are equal
    function areSetsEqual(xs,ys) {
        return xs.size === ys.size && [...xs].every((x) => ys.has(x));
    }

    // const mappingDocumentColumns = algorithmRequiredColumns(algorithmConfig);
    const mappingDocumentColumns = mappingRequiredColumns(config);
    // here we've already checked to have only one sheet
    const sheetColumns = (sheet.data.length > 0) ? Object.keys(sheet.data[0]) : [];

    const isMappingDocument = areSetsEqual(new Set(mappingDocumentColumns), new Set(sheetColumns));
    // console.log("MAPPING: ======>>>> ", {mappingDocumentColumns, sheetColumns, isMappingDocument});

    return isMappingDocument;

}


// Returns a new validator dictionary, keeps only the columns needed by the
// algorithm (so only columns relevant for mapping files are checked)
function keepValidatorsForColumns(config, validatorDict) {
    const keepColumnList = mappingRequiredColumns(config);
    return keepColumnList.reduce((memo, col) => Object.assign(memo, { [col]: validatorDict[col]}), {})
}

// Returns a new output configuration with only the columns needed by the
// algorithm (so the validation result of a mapping document only has the mapping columns present)
function keepOutputColumns(config, outputConfig) {
    const keepColumnSet = new Set(mappingRequiredColumns(config));

    return Object.assign({}, outputConfig, {
        columns: outputConfig.columns.filter(({alias}) => keepColumnSet.has(alias))
    })
}


// PRE-PROCESSING
// --------------

async function preprocessFile(config, inputFilePath, limit) {
    console.log("[PROCESSING] ------------ preprocessFile -----------------")

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
        console.log("[PROCESSING] [LOAD] Using input row limit: ",  limit);
        decoded.sheets[0].data = decoded.sheets[0].data.slice(0, limit);
    }

    // console.log("MAPPING: ======>>>> ", {mappingDocumentColumns, sheetColumns, isMappingDocument});

    // VALIDATION
    // ==========
    // prepare the validators
    let validatorDict = validation.makeValidatorListDict(config.validations);

    // Figure out if this is a mapping document or an assistance document
    const isMappingDocument = isMappingOnlySheet(config, decoded.sheets[0])
    // if this is a mapping document leave only the validators for the algorithm columns
    if (isMappingDocument) {
        validatorDict = keepValidatorsForColumns(config, validatorDict);
    }

    // do the actual validation
    let validationResult = validation.validateDocumentWithListDict(validatorDict, decoded);

    let validationErrorsOutputFile;
    let validationResultDocument;

    if (!isDocumentValid(validationResult)) {

        // by default the validation results show the "source" section columns
        let validationResultBaseConfig = config.source;

        // but if this is a mapping document we only show the mapping columns in the validation output document
        if (isMappingDocument) {
            validationResultBaseConfig = keepOutputColumns(config, validationResultBaseConfig);
        }

        // check if validation is ok -- if yes write the file out
        validationResultDocument = validation.makeValidationResultDocument(validationResultBaseConfig, validationResult);

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
        validationErrorsOutputFile: validationErrorsOutputFile,
        isMappingDocument,
    };

}


// PROCESSING
// ----------

async function processFile(config, ouputPath, inputFilePath, limit, format) {
    console.log("[PROCESSING] ------------ preprocessFile -----------------")



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
        console.log("[PROCESSING] [LOAD] Using input row limit: ",  limit);
        decoded.sheets[0].data = decoded.sheets[0].data.slice(0, limit);
    }



    // VALIDATION
    // ==========

    // Validation is currently not done in this step -- the input document is assumed to be valid
    if (false) {
        let validatorDict = validation.makeValidatorListDict(config.validations);
        let validationResult = validation.validateDocumentWithListDict(validatorDict, decoded);
    }

    // Figure out if this is a mapping document or an assistance document
    const isMappingDocument = isMappingOnlySheet(config, decoded.sheets[0])

    // HASHING
    // =======
    let hasher = makeHasher(config.algorithm);
    let result = generateHashesForDocument(config.algorithm, hasher, decoded)


    // OUTPUT
    // ------

    // if the user specified a format use that, otherwise use the input format
    const outputFileType = format || inputFileType;

    // helper to output a document with a specific config
    function outputDocumentWithConfig(destinationConfig, document) {

        let basePath = ouputPath;

        let encoderFactoryFn = encoderForFile(outputFileType);
        let encoder = encoderFactoryFn(destinationConfig, {});

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

module.exports = {
    preprocessFile,
    processFile,
}
