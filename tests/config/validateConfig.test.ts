/* ************************************************************************
*  Common Identifier Application
*  Copyright (C) 2026  World Food Programme
*  
*  This program is free software: you can redistribute it and/or modify
*  it under the terms of the GNU Affero General Public License as published by
*  the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
*  
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU Affero General Public License for more details.
*  
*  You should have received a copy of the GNU Affero General Public License
*  along with this program.  If not, see <http://www.gnu.org/licenses/>.
************************************************************************ */

import { describe, test, expect } from 'vitest';

import { validateConfigCore, validateConfigFile, type Config } from '@/config';
import { SUPPORTED_VALIDATORS } from '@/validation';


const baseSource = () => ({
  columns: [
    { name: 'Name', alias: 'name' },
    { name: 'DOB', alias: 'dob' },
  ],
});

const baseAlgorithm = (sourceAliases: string[]): Config.CoreConfiguration["algorithm"] => ({
  columns: {
    process: [sourceAliases[0]],
    static: [],
    reference: [],
  },
  hash: { strategy: 'SHA256' },
  salt: { source: "STRING", value: "qwerty" }
});

const baseValidations = (): Config.CoreConfiguration["validations"] => ({
  name: [{ op: SUPPORTED_VALIDATORS.REGEX_MATCH, value: '^[A-Za-z]+$' }],
  '*':  [{ op: SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH, value: 1 }]
});

const validCoreConfig = () => ({
  meta: { id: 'CID' },
  source: baseSource(),
  validations: baseValidations(),
  algorithm: baseAlgorithm(['name', 'dob']),
});

const validFileConfig = (): Config.FileConfiguration => ({
  // a FileConfiguration must also satisfy Core sections
  meta: { id: 'CID', version: '1.0.0', signature: 'abc123' },
  source: baseSource(),
  validations: baseValidations(),
  algorithm: baseAlgorithm(['name', 'dob']),
  destination: { postfix: '-out', columns: [{ name: 'Name', alias: 'name' }] },
  destination_map: { columns: [{ name: 'DOB', alias: 'dob' }] },
  destination_errors: { columns: [{ name: 'Error', alias: 'error' }] },
  // messages only required if `ui === true`
  messages: {
    error_in_config: 'Config error',
    error_in_salt: 'Salt error',
    terms_and_conditions: 'T&C',
  },
  post_processing: { encryption: { recipient: "REC", gpgBinaryPath: "/usr/bin/gpg" } },
});

// ---------------------------------------------------------------------

describe('config::validate::core', () => {
  it('returns undefined for a minimal valid core config', () => {
    const cfg = validCoreConfig();
    const res = validateConfigCore(cfg as any, 'CID');
    expect(res).toBeUndefined();
  });

  it('fails when [meta] is missing or id mismatches', () => {
    const cfgMissing = { ...validCoreConfig(), meta: undefined };
    const resMissing = validateConfigCore(cfgMissing as any, 'CID');
    expect(resMissing).toContain('[meta] must be present'); // checkMetaCore path
    // Source confirms presence and id enforcement.

    const cfgBadId = { ...validCoreConfig(), meta: { id: 'WRONG' } };
    const resBadId = validateConfigCore(cfgBadId as any, 'CID');
    expect(resBadId).toContain("[meta].id is not 'CID'"); // id mismatch
    // Message text appears in the code and uncovered branches in the HTML.
  });

  it('fails on bad [source].columns entries', () => {
    const cfg = validCoreConfig();
    cfg.source = {
      columns: [
        { name: 123 as any, alias: 'name' }, // non-string name
      ],
    };
    const res = validateConfigCore(cfg as any, 'CID');
    expect(res).toMatch(".name must be a string"); // checkColumns -> isArrayOfCustomType
    // Internal checkColumns and array validator are invoked via validateConfigCore.
  });

  it('fails when algorithm.columns include blank or unknown source columns', () => {
    const cfgBlank = validCoreConfig();
    cfgBlank.algorithm.columns.process = ['']; // blank
    const resBlank = validateConfigCore(cfgBlank as any, 'CID');
    expect(resBlank).toContain('[algorithm].columns.process - column entries cannot be blank.');
    // Branch in checkAlgorithm for blank strings.

    const cfgUnknown = validCoreConfig();
    cfgUnknown.algorithm.columns.process = ['unknown'];
    const resUnknown = validateConfigCore(cfgUnknown as any, 'CID');
    expect(resUnknown).toContain('[algorithm].columns.process.unknown does not have a corresponding [source] column.');
    // Branch verifying inclusion in sourceColumns.
  });

  it('fails on unsupported hash strategy via isOneOf', () => {
    const cfg = validCoreConfig();
    (cfg.algorithm as any).hash = { strategy: 'MD5' }; // unsupported
    const res = validateConfigCore(cfg as any, 'CID');
    expect(res).toContain('[algorithm].hash.strategy must be SHA256');
    // The code currently allows only 'SHA256'.
  });

  it('handles salt: optional, STRING, and FILE sources with validation', () => {
    // Optional salt -> undefined
    const cfgOptional = validCoreConfig();
    delete (cfgOptional.algorithm as any).salt;
    const resOptional = validateConfigCore(cfgOptional as any, 'CID');
    expect(resOptional).toBeUndefined();
    // Optional branch exercised.

    // STRING with empty value (violates isNotEmptyString)
    const cfgStringEmpty = validCoreConfig();
    (cfgStringEmpty.algorithm as any).salt = { source: 'STRING', value: '' };
    const resStringEmpty = validateConfigCore(cfgStringEmpty as any, 'CID');
    expect(resStringEmpty).toContain('[algorithm].salt.value cannot be an empty string');
    // Both isString and isNotEmptyString are evaluated; first failing message is returned.

    // FILE with invalid regex -> isRegexp failure
    const cfgFileBadRegex = validCoreConfig();
    (cfgFileBadRegex.algorithm as any).salt = {
      source: 'FILE',
      value: 'path/to/salt',
      validator_regex: '(' // invalid regex
    };
    const resFileBadRegex = validateConfigCore(cfgFileBadRegex as any, 'CID');
    expect(resFileBadRegex).toContain('[algorithm].salt.validator_regex is not a valid JavaScript Regular Expression');
    // checkAlgorithm -> isOptional(..., isRegexp) triggers try/catch path.
  });

  it('fails when validations refer to unknown column and not "*"', () => {
    const cfg = validCoreConfig();
    cfg.validations = {
      unknownCol: [{ op: SUPPORTED_VALIDATORS.MIN_VALUE, value: 1 }],
    } as any;
    const res = validateConfigCore(cfg as any, 'CID');
    expect(res).toContain('[validations].unknownCol does not have a corresponding [source] column.');
    // checkValidations column presence check.
  });

  it('accepts "*" validations (wildcard applies to all columns)', () => {
    const cfg = validCoreConfig();
    cfg.validations = {
      '*': [{ op: SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH, value: 1 }],
    } as any;
    const res = validateConfigCore(cfg as any, 'CID');
    expect(res).toBeUndefined();
    // Special-case '*' branch.
  });

  it('returns default-branch error for unsupported validation op', () => {
    const cfg = validCoreConfig();
    cfg.validations = {
      name: [{ op: 'not_supported' as any, value: 'x' }],
    } as any;
    const res = validateConfigCore(cfg as any, 'CID');
    expect(res).toContain("[validations].name.[not_supported] is not a supported validation function");
    // The switch default in checkValidations.
  });

  it('propagates guard errors from a supported rule (e.g., REGEX_MATCH with empty string)', () => {
    const cfg = validCoreConfig();
    // This hits isRegexMatchValidator inside checkValidations
    cfg.validations = { name: [{ op: SUPPORTED_VALIDATORS.REGEX_MATCH, value: '' }] } as any;
    const res = validateConfigCore(cfg as any, 'CID');
    expect(res).toContain('[validations].name.[regex_match].value must be a non-empty string');
    // Exercises imported guard.
  });

  it('algorithm: missing [hash] object', () => {
    const cfg = validCoreConfig();
    delete (cfg.algorithm as any).hash;
    const res = validateConfigCore(cfg as any, 'CID');
    expect(res).toContain('[algorithm].hash');
  });

  it('algorithm.columns: non-string entry triggers "must contain only strings"', () => {
    const cfg = validCoreConfig();
    (cfg.algorithm.columns as any).static = ['name', 99];
    const res = validateConfigCore(cfg as any, 'CID');
    expect(res).toContain('[algorithm].columns.static must contain only strings');
  });

});

describe('config::validate::file', () => {
  it('returns undefined for a valid file config (ui=false)', () => {
    const cfg = validFileConfig();
    const res = validateConfigFile(cfg as any, 'CID', false);
    expect(res).toBeUndefined();
    // Happy path through all destination sections and post_processing.
  });

  it('includes core errors within file validation', () => {
    const cfg = validFileConfig();
    cfg.meta.id = 'WRONG';
    const res = validateConfigFile(cfg as any, 'CID', false);
    expect(res).toContain("[meta].id is not 'CID'");
    // validateConfigFile calls validateConfigCore first.
  });

  it('destination: postfix wrong type triggers optional validator', () => {
    const cfg = validFileConfig();
    (cfg.destination as any).postfix = 123;
    const res = validateConfigFile(cfg as any, 'CID', false);
    expect(res).toContain('[destination].postfix? must be a string');
  });


  it('columns: optional default provided but not a string', () => {
    const cfg = validFileConfig();
    cfg.destination.columns = [{ name: 'Name', alias: 'name', default: 42 as any }];
    const res = validateConfigFile(cfg as any, 'CID', false);
    expect(res).toContain(".default? must be a string");
  });


  it('fails destination objects when missing', () => {
    const cfg = validFileConfig();
    (cfg as any).destination = undefined;
    const res = validateConfigFile(cfg as any, 'CID', false);
    expect(res).toContain('[destination]'); // Missing [destination]
    // Destination presence and object check.
  });

  it('fails destination_map and destination_errors similarly', () => {
    const cfg = validFileConfig();
    (cfg as any).destination_map = undefined;
    (cfg as any).destination_errors = undefined;
    const res = validateConfigFile(cfg as any, 'CID', false);
    expect(res).toContain('[destination_map]'); // object presence check
    expect(res).toContain('[destination_errors]'); // object presence check
    // Both branches covered.
  });

  it('validates messages only when ui=true', () => {
    const cfgNoUI = validFileConfig();
    (cfgNoUI as any).messages = undefined;
    const resNoUI = validateConfigFile(cfgNoUI as any, 'CID', false);
    expect(resNoUI).toBeUndefined(); // skipped
    // ui=false branch.

    const cfgUI = validFileConfig();
    (cfgUI as any).messages = undefined; // now it should error
    const resUI = validateConfigFile(cfgUI as any, 'CID', true);
    expect(resUI).toContain('Missing [messages]');
    // ui=true forces messages check.
  });

  it('messages: error_in_config wrong type (ui=true)', () => {
    const cfg = validFileConfig();
    (cfg as any).messages = { error_in_config: 1, error_in_salt: 'x', terms_and_conditions: 'y' };
    const res = validateConfigFile(cfg as any, 'CID', true);
    expect(res).toContain('[messages].error_in_config must be a string');
  });

  it('messages: error_in_salt wrong type (ui=true)', () => {
    const cfg = validFileConfig();
    (cfg as any).messages = { error_in_config: 'x', error_in_salt: 2, terms_and_conditions: 'y' };
    const res = validateConfigFile(cfg as any, 'CID', true);
    expect(res).toContain('[messages].error_in_salt must be a string');
  });

  it('messages: terms_and_conditions wrong type (ui=true)', () => {
    const cfg = validFileConfig();
    (cfg as any).messages = { error_in_config: 'x', error_in_salt: 'y', terms_and_conditions: 3 };
    const res = validateConfigFile(cfg as any, 'CID', true);
    expect(res).toContain('[messages].terms_and_conditions must be a string');
  });

  it('messages: all correct with ui=true should be fine', () => {
    const cfg = validFileConfig();
    const res = validateConfigFile(cfg as any, 'CID', true);
    expect(res).toBeUndefined();
  });


  it('post_processing encryption config type guards', () => {
    const cfg = validFileConfig();

    (cfg.post_processing as any) = { encryption: { enabled: true, recipient: "" } };
    let res = validateConfigFile(cfg as any, 'CID', false);
    expect(res).toContain('[post_processing].encryption.recipient cannot be an empty string');

    (cfg.post_processing as any) = { encryption: { enabled: false, recipient: "REC" } };
    res = validateConfigFile(cfg as any, 'CID', false);
    expect(res).toBeUndefined();

  });

  it('destination columns trigger column-level errors', () => {
    const cfg = validFileConfig();
    cfg.destination.columns = [{ name: 'OK', alias: 42 as any }]; // invalid alias type
    const res = validateConfigFile(cfg as any, 'CID', false);
    expect(res).toContain(".alias must be a string");
    // checkColumns used for destination as well.
  });
});
