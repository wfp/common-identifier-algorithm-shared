// REPLACE ALL REFERENCES TO "_generic_hasher" WITH THE DESIRED ALGORITHM IN THE ALGORITHMS DIRECTORY.

import { loadConfig, preprocessFile, processFile } from 'common-identifier-algorithm-shared';
import { makeHasher, REGION } from './example_algorithm/_generic_hasher';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONFIG_PATH = join(__dirname, 'example_algorithm', 'config.toml');
const INPUT_PATH = join(__dirname, 'example_algorithm', 'input_10.csv');
const OUTPUT_PATH = join(__dirname, 'output', 'output_10.csv');
const VALIDATION_ERRORS_PATH = join(__dirname, 'output', 'validation_errors.csv');

// load configuration from file
const configLoadResult = loadConfig(CONFIG_PATH, REGION);
if (!configLoadResult.success) throw new Error(`ERROR: Unable to load configuration file >> ${configLoadResult.error}`);

// validate the input file against all configured validation rules.
const preprocessResult = await preprocessFile({
  config: configLoadResult.config,
  inputFilePath: INPUT_PATH,
  errorFileOutputPath: VALIDATION_ERRORS_PATH,
});

if (!preprocessResult.isValid)
  throw new Error('Validation errors found in input file, review error file output.');

// validate the input file against all configured validation rules.
const processFileResult = await processFile({
  config: configLoadResult.config,
  inputFilePath: INPUT_PATH,
  outputPath: OUTPUT_PATH,
  hasherFactory: makeHasher,
});
// print the result, save the result, etc.
console.dir(processFileResult, { depth: 3 });