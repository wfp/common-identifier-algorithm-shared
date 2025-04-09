// REPLACE ALL REFERENCES TO "_generic_hasher" WITH THE DESIRED ALGORITHM IN THE ALGORITHMS DIRECTORY.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateHashesForDocument, validateDocument, type CidDocument, type Config } from '../src/index';
import { SUPPORTED_VALIDATORS } from '../src/validation/Validation';
import { makeHasher } from './example_algorithm/_generic_hasher';

const __dirname = dirname(fileURLToPath(import.meta.url));

/*
  Construct a config object instructing the algorithm HOW to process the data being passed
  in. This contains rules related to source schema, target schemas, validation rules, and
  algorithm specifications. Normally, this will be read from file using loadConfig()

  see ../docs/configuration-files.md for more detail on the relevant config fields.
*/
const config: Config.Options = {
  meta: {
    region: "UNKONWN", // this must match the shortCode of the algorithm being used
    version: "",
    signature: ""
  },
  // the schema information for the source data
  source: {
    columns: [
      { name: "ID", alias: "id" },
      { name: "Column 2", alias: "col2" },
      { name: "Column 3", alias: "col3" },
    ]
  },
  // [OPTIONAL] validation rules per column: see ../docs/validators.md
  validations: {
    id: [
      { op: SUPPORTED_VALIDATORS.FIELD_TYPE, value: 'string' },
      { op: SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH, value: 11 }
      // { op: SUPPORTED_VALIDATORS.LINKED_FIELD, target: "col2" }
    ]
  },
  algorithm: {
    hash: { strategy: "SHA256" },
    salt: { source: "STRING", value: "testSalt" },
    columns: {
      process: [],
      reference: [],
      static: [ "id" ]
    },
  },
  // schema for main output file, skipping for brevity
  destination: { columns: [] },
  // schema for mapping output file, skipping for brevity
  destination_map: { columns: [] },
  // schema for error files, skipping for brevity
  destination_errors: { columns: [] }
}

/*
  Construct a `document` containing the data to process.
*/
const doc: CidDocument = {
  name: "Input Data",
  data: [
    { "id": "43294300000", "col2": "bar0", "col3": "baz0" },
    { "id": "38591500000", "col2": "bar1", "col3": "baz1" },
    { "id": "17386300000", "col2": "bar2", "col3": "baz2" },
  ]
}

function main() {
  // validate the input data against all configured validation rules.
  const validationResult = validateDocument(config, doc, false);
  if (!validationResult.ok) {
    console.dir(validationResult.results, { depth: 5 });
    throw new Error("Data contains validation errors, check input");
  }

  // initialise the selected algorithm
  const hasher = makeHasher(config.algorithm);
  // run the algorithm against the input data
  const result = generateHashesForDocument(hasher, doc);

  // print the results, save the results, up to you.
  console.dir(result, { depth: 5 });
}

main();