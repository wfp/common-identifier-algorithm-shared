# Introduction

This is the core repository for the Common Identifier application, containing all configuration, file handling, and data processing components.

## Repo Structure

```toml
📦algo-shared
 ┣ 📂config         # functions related to the handling of configuration files
 ┣ 📂decoding       # reading and decoding files - CSV or XLSX
 ┣ 📂encoding       # encoding and writing files - CSV or XLSX
 ┣ 📂hashing        # base hashing logic and supporting utilities
 ┣ 📂processing     # main API into the backend logic
 ┣ 📂tests          # tests for all components
 ┗ 📂validation     # validation logic and wrappers
   ┗ 📂validators   # actual validation classes
```

## Usage

```ts
const REGION = 'NWS';
const CONFIG_PATH = join(__dirname, './config.toml');

const INPUT_PATH = join(__dirname, 'files', 'input_data.csv');
const OUTPUT_PATH = join(__dirname, 'output', 'output.csv');
const VALIDATION_ERRORS_PATH = join(
  __dirname,
  'output',
  'validation_errors.csv',
);

// load configuration file
const configLoadResult = loadConfig(CONFIG_PATH, REGION);
if (!configLoadResult.success)
  throw new Error('unable to load configuration file.');

const config = configLoadResult.config;

// validate the input file against all configured validation rules.
const preprocessResult = await preprocessFile({
  config: config,
  inputFilePath: INPUT_PATH,
  errorFileOutputPath: VALIDATION_ERRORS_PATH,
  limit: 2,
});

if (!preprocessResult.isValid)
  throw new Error(
    'Validation errors found in input file, review error file output.',
  );

// validate the input file against all configured validation rules.
const processFileResult = await processFile({
  config: config,
  inputFilePath: INPUT_PATH,
  outputPath: OUTPUT_PATH,
  hasherFactory: makeHasher,
  limit: 2,
});
// print the result, save the result, etc.
console.dir(processFileResult, { depth: 3 });
```
