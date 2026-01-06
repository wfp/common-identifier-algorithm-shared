// REPLACE ALL REFERENCES TO "_generic_hasher" WITH THE DESIRED ALGORITHM IN THE ALGORITHMS DIRECTORY.

import { existsSync, rmSync } from 'node:fs';
import { loadConfig, postprocessFile, preprocessFile, processFile } from '../src/index';
import { makeHasher, ALGORITHM_ID } from './example_algorithm/_generic_hasher';
import { dirname, join, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONFIG_PATH = join(__dirname, 'example_algorithm', 'config.toml');
const INPUT_PATH = join(__dirname, 'example_algorithm', 'input_10.csv');
const OUTPUT_PATH = join(__dirname, 'output', 'output_10.csv');
const VALIDATION_ERRORS_PATH = join(__dirname, 'output', 'validation_errors.csv');

if (existsSync(resolve(__dirname, "output"))) rmSync(join(__dirname, "output"), { recursive: true, force: true});

// 1. load configuration from file
const configLoadResult = loadConfig({
  configPath: CONFIG_PATH,
  algorithmId: ALGORITHM_ID,
  validateConfig: true,
  embeddedSalt: { source: "STRING", value: "SOME_SALT_VALUE" }
});
if (!configLoadResult.success)
  throw new Error(`ERROR: Unable to load configuration file >> ${configLoadResult.error}`);

// 2. validate the input file against all configured validation rules.
const preprocessResult = await preprocessFile({
  config: configLoadResult.config,
  inputFilePath: INPUT_PATH,
  errorFileOutputPath: VALIDATION_ERRORS_PATH,
});

if (!preprocessResult.isValid)
  throw new Error('ERROR: Validation errors found in input file, review error file output.');

// 3. process the input file according to the configuration.
const processFileResult = await processFile({
  config: configLoadResult.config,
  inputFilePath: INPUT_PATH,
  outputPath: OUTPUT_PATH,
  hasherFactory: makeHasher,
});
if (!processFileResult.outputFilePath)
  throw new Error(`ERROR: Unable to process input file`);

// 4. print the result, save the result, etc.
console.dir(processFileResult, { depth: 3 });


// 5. postprocess the output file according to the configuration.
const postprocessResult = await postprocessFile({
  config: configLoadResult.config,
  inputPath: processFileResult.outputFilePath,
  outputPath: join(parse(processFileResult.outputFilePath).dir, "ENCRYPTED.gpg"),
  options: {
    signer: "" // OPTIONAL: Signing key 
  }
});
if (!postprocessResult.success) {
  const errors = postprocessResult.steps.filter(step => !step.success);
  throw new Error(`ERROR: Postprocessing failed, one or more steps failed >> ${JSON.stringify(errors)}`);
}