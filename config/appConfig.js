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

const fs = require('node:fs');
const { attemptToReadTOMLData } = require('./utils');
const log = require('debug')('CID:appConfig')

const APP_CONFIG_ENCODING = 'utf-8';

const DEFAULT_APP_CONFIG = {
    // a map of <signature>:true values
    // that stores which config's termsAndConditions were accepted
    termsAndConditions: {},
    window: {
        // default window sizing
        width: 1024,
        height: 800,
    }
}

function loadAppConfig(configPath) {
    log("Loading Application config from", configPath);


    // attempt to read the file
    const configData = attemptToReadTOMLData(configPath, APP_CONFIG_ENCODING);

    // if cannot be read we assume default application configuration
    if (!configData) {
        log("Cannot find Application config file -- using the default");
        return DEFAULT_APP_CONFIG;
    }

    // validate the application config
    if (!configData.termsAndConditions ||
        !configData.window ||
        typeof configData.window.width !== 'number' ||
        typeof configData.window.height !== 'number'
    ) {
        log("Application config file is not valid -- using the default");
        return DEFAULT_APP_CONFIG
    }

    return configData;
}


function saveAppConfig(configData, outputPath) {

    // update the config hash on import to account for the
    const outputData = JSON.stringify(configData, null, "    ");
    fs.writeFileSync(outputPath, outputData, APP_CONFIG_ENCODING );
    log("Written Application config data to ", outputPath);
}


module.exports = {
    loadAppConfig,
    saveAppConfig,
    DEFAULT_APP_CONFIG,
}