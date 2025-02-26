# Introduction

This is the core repository for the Common Identifier application, containing all configuration, file handling, and data processing components.

This repository is designed to be used with file-based data programmatically; for use via an UI application, please refer to the [`Common Identifier Application`](https://github.com/wfp/common-identifier-application/) repository.

## Repo Structure

```
📦common-identifier-algorithm-shared
 ┣ 📂src
 ┃ ┣ 📂config     # functions related to the handling of configuration files
 ┃ ┣ 📂decoding   # reading and decoding files - CSV or XLSX
 ┃ ┣ 📂encoding   # encoding and writing files - CSV or XLSX
 ┃ ┣ 📂hashing    # base hashing logic and supporting utilities
 ┃ ┣ 📂processing # main API into the backend logic
 ┃ ┣ 📂validation # validation logic and wrappers
 ┣ 📂tests        # tests for all components
```

## Usage

```ts
const REGION = 'NWS';
const CONFIG_PATH = join(__dirname, './config.toml');

const INPUT_PATH = join(__dirname, 'files', 'input_data.csv');
const OUTPUT_PATH = join(__dirname, 'output', 'output.csv');
const VALIDATION_ERRORS_PATH = join(__dirname, 'output', 'validation_errors.csv');

// load configuration file
const configLoadResult = loadConfig(CONFIG_PATH, REGION);
if (!configLoadResult.success) throw new Error('unable to load configuration file.');

const config = configLoadResult.config;

// validate the input file against all configured validation rules.
const preprocessResult = await preprocessFile({
  config: config,
  inputFilePath: INPUT_PATH,
  errorFileOutputPath: VALIDATION_ERRORS_PATH,
  limit: 2,
});

if (!preprocessResult.isValid)
  throw new Error('Validation errors found in input file, review error file output.');

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

## 🧪 Data Processing Pipeline (file-based data)

### Configuration

- The `src/config/ConfigStore` ConfigStore attempts to load the configuration from the application directory or the backup location (app bundle) if the primary configuration fails to load. It also handles updating the user configuration file on config changes.
- The terms & conditions and window placement / size  are also handled by the ConfigStore using the `src/config/appConfig` application config save/write process
- See [`docs/configuration-files.md`](./docs/configuration-files.md) for more information.

### Pre-processing (validation)

- The `src/decoding` Decoders (CSV and XLSX) read the source file and convert it (using the `config.source` setup) to a Document containing the input data with column aliases renamed
- The `src/processing` pre-processing function identifies if the target is a mapping document based on the current configuration and the data in the file and sets up validation accordingly
- The `src/validation` Validators are setup based on the active configuration, and ran against the Document.
- If there are errors, the `src/encoding` Encoders (CSV and XLSX) write the validation error output based on `[destination_errors]` section of the active configuration
- The frontend shows the results and either allows processing or shows the errors
- See [`docs/validators.md`](docs/validators.md) for more information.

### Processing

- The `src/decoding` Decoders (CSV and XLSX) read the source file and convert it (using the `config.source` setup) to a Document containing the input data with column aliases renamed
- The `src/processing` processing function identifies if the target is a mapping document based on the current configuration and the data in the file. Using the active configuration it collects data into `static` `to_translate` and `reference` buckets per-row and passes it to the active algorithm for processing
- The active algorithm takes the `{ static:[...], to_translate:[...], reference: [...] }` per-row data and returns a map with the columns it wants to add -- ex: `{ USCADI: "....", DOCUMENT_HASH: "..." }`
- The data returned by the algorithm is merged into the source rows so the encoders can package multiple different outputs
- The `src/encoding` Encoders (CSV and XLSX) write the output based on the relevant `[destination]` / `[destination_map]` section of the active configuration.