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

# Configuration Files

Configuration files in the common ID application are used to define the input schemas, validation rules, algorithm specifications, and output formats of intended assistance files. These are defined as `toml` files and must be included within any algorithm implementation at the path `src/main/<algo-dir>/config/config.backup.toml` if using the UI component.

## Schema

Look in any of the existing algorithm implementation repositories for examples of specific config usages.

### Meta

The meta section of the file contains information related to application versioning.

```toml
[meta]
region="ABC"    # application installations are region dependent, the value specified here MUST match the built-in region.
version="1.0.0" # the version information is shown in the top-right of the desktop UI for user visibility.
signature = "aaabbb"
```
The signature is the calculated `md5` hash value of the configuration file itself, computed using the `src/config/generateConfigHash.ts` utility. This feature exists to reduce the likelihood of accidental changes to the config file causing issues in the deterministic processing of input data.

When a change is made to the configuration file, a new signature value must be created to reflect its new content.

> TODO: git pre-commit hook to validate the config file on commit and throw an error if values don't match.

### Messages

> [!IMPORTANT]
> If you are intending on using the UI component of this application, the messages section in the configuration file is NOT optional. The values for `terms_and_conditions`, `error_in_config`, and `error_in_salt` MUST be defined.

Messages are an optional field used to set the default error and terms & conditions messages within the UI application. Each of these fields supports `HTML` tag syntax.

```toml
[messages]
# terms and conditions are shown to the user on first start and upon configuration file changes.
terms_and_conditions="""
    <h3>My Fantastic Application</h3>
    <p>T&C's go here...</p>
"""
# the generic error message to display when an error is encountered with the configuration file itself.
error_in_config=""
# the generic error message to display when the salt file cannot be read or is malformed.
error_in_salt=""
```

### Source

The `source` sections defines the expected input columns in the source dataset. The `name` key is the human readable name in the header of the CSV file, `alias` is the more machine-friendly name used by the application internally, and `default` is the default value to use for empty cells where necessary.

> TODO: make `alias` an optional parameter - it is not relevant for programmatic usage.

```toml
[source]
# an array of column names, their aliases, and default values where necessary.
columns = [
    { name = "Column A", alias = "col_a" },
    { name = "Column B", alias = "col_b", default = "<default_value>" },
    [...]
]
```

### Validations

This file section details which validation rules to apply to which columns in the input file.

```toml
[validations]
# per column name to apply validation rules to, define an array of validation rules
column_name = [
    { op = "max_value", value = 10 }
]
# "*" can be used as column name to refer to all columns in the input file
"*" = [
    { op = "field_type", value = "string" }
]
```

```toml
# the structure of a validation rule is as follows:
{
    # the name of the validation rule, from the supported list.
    op = "<validation_rule>",
    # [optional] the argument to provide to that validation rule
    value = "<validation_argument>",
    # [optional] for comparative / cross-column validation rules, provide a target column to validate with.
    target = "<target_column>"
    # [optional] a custom error message, overriding the rule default, to display in the output file.
    message = "<custom_error_message>",
}
```

This is the list of currently supported validation rules, these are further described in [Validation Rules](#validator-configuration)

| Validation Rule Name (op) | Argument                | Target | Description                                     |
| ------------------------- | ----------------------- | ------ | ----------------------------------------------- |
| options                   | Array<string \| number> | ❌     | Is value in the argument array?                 |
| regex_match               | string                  | ❌     | Does value match provided regex?                |
| field_type                | "string" \| "number"    | ❌     | Is value type only the specified value?         |
| language_check            | string                  | ❌     | Is the value in the correct language?           |
| max_field_length          | number                  | ❌     | Maximum number of characters                    |
| min_field_length          | number                  | ❌     | Minimum number of characters                    |
| max_value                 | number \| string        | ❌     | Is value less than argument?                    |
| min_value                 | number                  | ❌     | Is value more than argument?                    |
| date_diff                 | string                  | ❌     | Is value within the specified date range?       |
| date_field_diff           | string                  | ✅     | Is value within the date of another column?     |
| linked_field              | string                  | ✅     | Link two columns together and ensure not blank. |
| same_value_for_all_rows   | ❌                      | ❌     | Entire column must be the same value.           |

### Algorithm

```toml
[algorithm]
# the aliased columns to use as part of the algo implementation.
[algorithm.columns]
# list of aliased column names to be translated as part of the algorithm implementation
to_translate = [ "col_a" ]
# list of aliased column names that remain static but are included in the output hash
static = [ "col_b" ]
# list of aliased column names that are used to calculate the corresponding reference identifier
reference = [ "col_c" ]
```

```toml
[algorithm.hash]
# the hashing algorithm to use, currently only SHA256 is supported
strategy = "SHA256"

[algorithm.salt]
# should the salt value be pulled from a file or a static value - options are "FILE" or "STRING"
source = "FILE"
# a compilable regex string to validate that the salt is valid
validator_regex = ".*"

# the actual value to use for the salt
#  - If "FILE" is specified as the source, this must be a map of `win32` and `darwin` to respective file paths.
#        - The keyword $APPDATA can be used to refer to the OS's app data location
#        - The keyword $HOME can be used to refer to the users home directory.
#
#  - If "STRING" is specified, this can simply be a string value:
# value = "<salt value here>"
[algorithm.salt.value]
win32  = "$APPDATA/<path_to_file>/file.asc"
darwin = "$APPDATA/<path_to_file>/file.asc"
```

### Destination

Define the columns to include in the output file, including the human-readable names to convert to where necessary.

```toml
[destination]
# array of column names and aliases to include in the output file
columns = [
    { name = "Column A", alias = "col_a" },
    { name = "Column B", alias = "col_b" },
    [...]
]
# suffix that is appended to the output filename -> <input_file_name><postfix>.csv
# for XLSX, this is also the name of the sheet containing the final data
postfix = "_OUTPUT"
```

### Destination Map

Define the columns to include in the output mapping file, including the human-readable names to convert to where necessary.

```toml
[destination_map]
# array of column names and aliases to include in the output mapping file
columns = [
    { name = "Column A", alias = "col_a" },
    { name = "Column B", alias = "col_b" },
    [...]
]
# suffix that is appended to the output mapping filename -> <input_file_name><postfix>.csv
# for XLSX, this is also the name of the sheet containing the final data
postfix = "_OUTPUT_MAPPING"
```

### Destination Errors

Define the columns to include in the error report, including the human-readable names to convert to where necessary.

> [!IMPORTANT]
> Make sure to include the `Errors | errors` column in the output configuration, otherwise they will not be included in the output file.

```toml
[destination_errors]
# array of column names and aliases to include in the errors file
columns = [
    { name = "Errors", alias = "errors" },
    { name = "Column A", alias = "col_a" },
    { name = "Column B", alias = "col_b" },
    [...]
]
# suffix that is appended to the errors filename -> <input_file_name><postfix>.csv
# for XLSX, this is also the name of the sheet containing the final data
postfix = "_ERRORS"
```

# Validator configuration

## Setting up validators

The validators are set up in the `[validations]` section of the configuration file on a per-column basis. The `*` column can be used to apply a validator to every column.

```toml
[validations]

"*" = [
    { op = "max_field_length", value = 200 },
]

# validators for the column with the alias `individual_reference`
individual_reference = [
    { op = "field_type", value = "str" },
    { op = "regex_match", value = "[a-zA-Z0-9!\"#$%&'()*+\\-./:;?@[\\]^_{|}~]+", message="must only consist of alphanumeric characters and supported special characters" }
]

```

## Validator types

```toml
{
  op = "<VALIDATOR TYPE>"
  value = ... # <MAIN VALIDATOR PARAMETER>
  message="<OPTIONAL MESSAGE>"
  ...
}
```

- The type of the validator is indicated by the `op` of the validator.

- Most Validators take their "main argument" as the `value`.

- The validation error message can be customised by setting `message`.

Each validator type is implemented as in `src/main/algo-shared/validation`.

### Date difference from today

```toml
{ op = "date_diff", value = "<DATE OFFSET>" }
```

Expects the value of the column to be a date and to be before / after `<NOW> + <DATE_OFFSET>`.

Date offset takes the format of: `<POSITIVE OR NEGATIVE INTEGER><RANGE TYPE>`. Some examples:

- `+1d:+10d` means 'at most 1 day after today' AND 'at most 10 day after today'
- `-5d:+10d` means 'at most 5 days before today' AND 'at most 10 days after today'
- `+1M:+10d` means 'at most 1 month after today' AND 'at most 10 days after today' (dates are sorted into ascending order)
- `-10M:+10d` means 'at most 10 months before today' AND 'at most 10 days after today'
- `+1Y:+10d` means 'at most 1 year after today' AND 'at most 10 days after today' (dates are sorted into ascending order)
- `-2Y:+10d` means 'at most 2 years before today' AND 'at most 10 days after today'

Example:

```toml
{ op = "date_diff", value = "-1d:12M"},
{ op = "date_diff", value = "+2M:3M"},
{ op = "date_diff", value = "-2Y:-1Y"}
```

### Date difference between columns

```toml
{ op = "date_field_diff", target = "<TARGET COLUMN>", value = "<DATE OFFSET>" }
```

Expects the value of the column specified by `<TARGET COLUMN>` to be a valid date, the value of the current column to be a valid date and to be before / after `<TARGET COLUMN VALUE> + <DATE_OFFSET>`.

The date offset format is shared with `date_diff`.

Example:

```toml
end = [
  { op = "date_field_diff", target = "start", value="-12M", message="must be within a year of Start"},
]
```

### Column type

```toml
{ op = "field_type", value = "<TYPE>" },
```

Expects the value of the column to be of the type specified by `<TYPE>`:

- `str` for string / text
- `num` for numbers

Example:

```toml
{ op = "field_type", value = "str" },
```

### Language check

```toml
{ op = "language_check", value = "<LANGUAGE>" }
```

Expects the value of the column to have only characters used by the given language.

Currently only the `Arabic` language is supported.

Example:

```toml
{ op = "language_check", value = "Arabic", message="is not Arabic"}
```

### Minimum / maximum length

```toml
{ op = "min_field_length", value = "<A NUMBER>" },
{ op = "max_field_length", value = "<A NUMBER>" },
```

Expects the length of the value (as a string) of the column to be:

- at least `value` (in case of `min_field_length`)
- at most `value` (in case of `max_field_length`)

Example:

```toml
{ op = "min_field_length", value = 2 },
{ op = "max_field_length", value = 15 },
```

### Minimum / maximum value

```toml
{ op = "min_value", value = "<A NUMBER>" },
{ op = "max_value", value = "<A NUMBER>" },
```

Expects the numerical value of the column to be:

- at least `value` (in case of `min_value`)
- at most `value` (in case of `max_value`)

Example:

```toml
{ op = "min_value", value = 1 },
{ op = "max_value", value = 1000 },
```

There is a special case for max value, whereby a date can be passed in as a maximum. This is to support date of birth entry without requiring complex date parsing:

```toml
{ op = "max_value", value = "{{currentYear}}" },
{ op = "max_value", value = "{{currentMonth}}" },
```

### Options

```toml
{ op = "options", value = [ "<AN>", "<ARRAY>", "<OF>", "<OPTIONS>" ] }
```

Expects the value of the column to be one of the values in the `value` string array.

Example:

```toml
{ op = "options", value = [ "", "NATIONAL_ID", "PERSONAL_ID", "LOCAL_COUNCIL_CARD" ] }
```

### Regex

```toml
{ op = "regex_match", value = "<REGULAR EXPRESSION>" }
```

Expects the value of the column to match the regular expression. It is highly recommended to supply a custom error message here, as the users will need more context then just a regular expression.

NOTE: this validator attempts to match the whole string, not just a substring

Example:

```toml
{ op = "regex_match", value = "[a-zA-Z0-9!\"#$%&'()*+\\-./:;?@[\\]^_{|}~]+", message="must only consist of alphanumeric characters and supported special characters" } # TBD
```

### Same value for all rows

```toml
{ op = "same_value_for_all_rows" },
```

Expects the value of the column to equal the value of the column in the first row (thereby requiring the whole document to contain only a single value for this column).

Example:

```toml
{ op = "same_value_for_all_rows" },
```