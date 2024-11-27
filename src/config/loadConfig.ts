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

import fs from 'node:fs';

import { validateConfig } from './validateConfig.js';
import { loadSaltFile } from './loadSaltFile.js';
import { generateConfigHash } from './generateConfigHash.js';

import { getSaltFilePath, attemptToReadTOMLData } from './utils.js';
import { Config } from './Config.js';
import Debug from 'debug';
const log = Debug('CID:loadConfig')


// The encoding used by the config file
export const CONFIG_FILE_ENCODING: fs.EncodingOption = "utf-8";

type LoadConfigResult = 
    | { success: false, error: string, isSaltFileError?: true, config?: Config.Options }
    | { success: true, lastUpdated: Date, config: Config.Options}

// Main entry point for loading a config file.
// returns:
// - { success: true } if the config can be loaded
// - { success: false, error: "string" } if there are errors
// - { success: false, isSaltFileError: true, error: "string"}
//     if there is something wrong with the salt file
export function loadConfig(configPath: string, region: string): LoadConfigResult {
    log("Loading config from", configPath);

    // attempt to read the file
    const configData = attemptToReadTOMLData<Config.Options>(configPath, CONFIG_FILE_ENCODING);

    // if cannot be read, we have an error
    if (!configData) {
        return {
            success: false,
            error: `Unable to read config file '${configPath}'`
        };
    }

    // if the file can be read, attempt to fetch the last modified date
    const lastUpdateDate = new Date(fs.statSync(configPath).mtime);

    // validate the config
    const validationResult = validateConfig(configData, region);

    // if the config is not valid return false
    if (validationResult) {
        return {
            success: false,
            error: validationResult,
        };
    }

    // TODO: check sinature validity before salt injection
    const configHash = generateConfigHash(configData);
    log("CONFIG HASH:", configHash);

    // fail if the signature is not OK
    if (configHash !== configData.signature.config_signature) {
        return {
            success: false,
            error: `Configuration file signature mismatch -- required signature is '${configData.signature.config_signature}' but user configuration has '${configHash}' `,
        }
    }

    // alphabetically sort the to_translate, static, and reference fields to standardise and prevent
    // different ordering in config producing different results in output.
    configData.algorithm.columns.to_translate = configData.algorithm.columns.to_translate.sort()
    configData.algorithm.columns.reference = configData.algorithm.columns.reference.sort()
    configData.algorithm.columns.static = configData.algorithm.columns.static.sort()

    // check if we need to inject the salt data into the config
    // if not, the config loading is finished
    if (configData.algorithm.salt.source.toUpperCase() !== "FILE") {
        return {
            success: true,
            lastUpdated: lastUpdateDate,
            config: configData,
        }
    }

    // figure out the file path and the validation regexp
    const saltFilePath = configData.algorithm.salt.value;
    const saltFileValidatorRegexp = RegExp(configData.algorithm.salt.validator_regex);

    // attempt to load the salt file
    // saltFilePath must be { win32: string, darwin: string } at this stage since salt.source is guaranteed to be "FILE".
    const saltData = loadSaltFile(saltFilePath, saltFileValidatorRegexp);

    // if the salt file load failed, we have failed
    if (!saltData) {
        log("[SALT] Error while loading the salt file!")
        return {
            success: false,
            isSaltFileError: true,
            error: `Invalid salt file: '${getSaltFilePath(saltFilePath)}'`,
            // send the existing config alongside so if this config is the backup one, error messages
            // can still be loaded
            config: configData,
        };
    }

    // replace the "FILE" with "STRING" amd embed the salt data
    configData.algorithm.salt.source = "STRING";
    configData.algorithm.salt.value = saltData;

    configData

    // return the freshly injected config
    return {
        success: true,
        lastUpdated: lastUpdateDate,
        config: configData,
    };
}