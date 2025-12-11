// Common Identifier Application
// Copyright (C) 2024 World Food Programme

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import fs from 'node:fs';

import { validateConfigFile } from './validateConfig';
import { loadSaltFile } from './loadSaltFile';
import { generateConfigHash } from './utils';

import { attemptToReadTOMLData } from './utils';
import type { Config } from './Config';
import Debug from 'debug';
const log = Debug('CID:loadConfig');

// The encoding used by the config file
export const CONFIG_FILE_ENCODING: fs.EncodingOption = 'utf-8';

type LoadConfigResult =
  | { success: true; lastUpdated: Date; config: Config.FileConfiguration; }
  | { success: false; error: string; isSaltFileError: false; }
  | { success: false; error: string; isSaltFileError: true; config: Config.FileConfiguration; };


type LoadConfigInput = {
  configPath: string;
  algorithmId: string;
  usingUI?: boolean;
  embeddedSalt?: Config.FileBasedSalt | Config.StringBasedSalt;
  validateConfig?: boolean;
}

export function loadConfig({ configPath, algorithmId, embeddedSalt, usingUI=false, validateConfig=true }: LoadConfigInput): LoadConfigResult {
  log('[INFO] Loading config from', configPath);
  const configData = attemptToReadTOMLData<Config.FileConfiguration>(configPath, CONFIG_FILE_ENCODING);

  if (!configData) {
    log('[ERROR] Unable to read config file', configPath);
    return {
      success: false,
      error: `Unable to read config file '${configPath}'`,
      isSaltFileError: false
    };
  }

  // if the file can be read, attempt to fetch the last modified date
  const lastUpdateDate = new Date(fs.statSync(configPath).mtime);

  if (!!validateConfig) {
    // validate the config
    const validationResult = validateConfigFile(configData, algorithmId, usingUI);
  
    // if the config is not valid return false
    if (validationResult) {
      return {
        success: false,
        error: validationResult,
        isSaltFileError: false,
      };
    }
    // TODO: check sinature validity before salt injection
    const configHash = generateConfigHash(configData);
    log('[INFO] Generated config hash:', configHash);

    // fail if the signature is not OK
    if (configHash !== configData.meta.signature) {
      return {
        success: false,
        error: `Configuration file signature mismatch -- required signature is '${configData.meta.signature}' but user configuration has '${configHash}' `,
        isSaltFileError: false
      };
    }
  }

  // alphabetically sort the process, static, and reference fields to standardise and prevent
  // different ordering in config producing different results in output.
  configData.algorithm.columns.process = configData.algorithm.columns.process.sort();
  configData.algorithm.columns.reference = configData.algorithm.columns.reference.sort();
  configData.algorithm.columns.static = configData.algorithm.columns.static.sort();

  // salt is either provided in the config file (STRING | FILE) or is explicitly provided to
  // to this function (e.g. by the UI). Precedence should be given to the config file, although
  // the config fields are optional. The programme should fail if no salt is provided.

  if (configData.algorithm.salt && configData.algorithm.salt.source == "STRING") {
    return { success: true, lastUpdated: lastUpdateDate, config: configData };
  }
  
  if (configData.algorithm.salt && configData.algorithm.salt.source == "FILE") {
    // load the file, convert to a string value, update the config to be of type: "STRING"
    const saltFilePath = configData.algorithm.salt.value;
    const validatorRegexp = configData.algorithm.salt.validator_regex ? new RegExp(configData.algorithm.salt.validator_regex) : undefined;
    return tryLoadSaltFile({ saltFilePath, validatorRegexp, configData, lastUpdateDate, label: "salt" });
  }
  
  if (embeddedSalt && embeddedSalt.source == "STRING") {
    configData.algorithm.salt = { source: "STRING", value: embeddedSalt.value }
    return { success: true, lastUpdated: lastUpdateDate, config: configData };
  }

  if (embeddedSalt && embeddedSalt.source == "FILE") {
    const saltFilePath = embeddedSalt.value;
    const validatorRegexp = embeddedSalt.validator_regex ? new RegExp(embeddedSalt.validator_regex) : undefined;
    return tryLoadSaltFile({ saltFilePath, validatorRegexp, configData, lastUpdateDate, label: "embedded salt" });
  }

  return { success: false, error: `No salt configuration provided: either specify salt in config file, or pass in path on config load.`, isSaltFileError: true, config: configData };
}

interface TryLoadSaltFileInput {
  saltFilePath: string;
  validatorRegexp?: RegExp;
  configData: Config.FileConfiguration;
  lastUpdateDate: Date;
  label: string;
}

function tryLoadSaltFile({ saltFilePath, validatorRegexp, configData, lastUpdateDate, label="salt"}: TryLoadSaltFileInput): LoadConfigResult {
  log('[INFO] Loading salt from', saltFilePath);

  const loadSaltResponse = loadSaltFile({ saltFilePath, validatorRegexp });
  if (!loadSaltResponse.success) {
    log(loadSaltResponse.message);
    // send the existing config alongside so if this config is the backup one, error messages can still be loaded
    return { success: false, isSaltFileError: true, error: `Invalid salt file: '${saltFilePath}'`, config: configData };
  }

  if (loadSaltResponse.message) log(loadSaltResponse.message);

  // update the config to be of salt type: "STRING" with loaded file data
  configData.algorithm.salt = { source: "STRING", value: loadSaltResponse.data }
  return { success: true, lastUpdated: lastUpdateDate, config: configData };
}