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

const path = require('node:path');
const fs = require('node:fs');

const log = require('debug')('CID:ConfigStore')

const { loadConfig, CONFIG_FILE_ENCODING }= require('./loadConfig');

const { loadAppConfig, saveAppConfig, DEFAULT_APP_CONFIG } = require('./appConfig');

// The current region name comes from the active algorithm
const { REGION } = require('../../active_algorithm');

const {appDataLocation} = require('./utils');

const APP_DIR_NAME = "commonid-tool";
const CONFIG_FILE_NAME = `config.${REGION}.json`;
const APP_CONFIG_FILE_NAME = `appconfig.${REGION}.json`;

// the path of the application's data files
const APP_DIR_PATH = path.join(appDataLocation(), APP_DIR_NAME);

// the path of the store configuration file
const CONFIG_FILE_PATH = path.join(APP_DIR_PATH, CONFIG_FILE_NAME);

// the path of the application config file (containing config-independent settings)
const APP_CONFIG_FILE_PATH = path.join(APP_DIR_PATH, APP_CONFIG_FILE_NAME);

// TODO: if used without the app, this should be injected
const BACKUP_CONFIG_FILE_PATH = path.join(__dirname, "..", "..", "config.backup.toml");



// Ensure the application's config file directory exists
function ensureAppDirectoryExists(appDir) {
    if (!fs.existsSync(appDir)) {
        log("Application directory '", appDir, "' does not exits -- creating it");
        fs.mkdirSync(appDir /*, { recursive: true } */);
    }
}


// Attempts to save a configuration file to the designated location.
// This function does not do any validations on the data
// (that should have happened after loading the config)
// NOTE: the config is saved as JSON (TOML serialization can be weird)
function saveConfig(configData, outputPath) {
    // update the config hash on import to account for the
    const outputData = JSON.stringify(configData, null, "    ");
    fs.writeFileSync(outputPath, outputData, CONFIG_FILE_ENCODING );
    log("Written config data to ", outputPath);
}

// Default configuration for the store
const DEFAULT_CONFIG_STORE_CONFIG = {
    configFilePath: CONFIG_FILE_PATH,
    appConfigFilePath: APP_CONFIG_FILE_PATH,
    backupConfigFilePath: BACKUP_CONFIG_FILE_PATH,
    region: REGION,
}

class ConfigStore {
    constructor(storeConfig) {

        this.data = {};
        this.validationResult = {};
        this.hasConfigLoaded = false;
        this.isValid = false;
        this.lastUpdated = new Date();

        // signal that the config we are using is
        // coming from the backup, not a user-provided one
        this.isUsingBackupConfig = false;

        this.appConfig = DEFAULT_APP_CONFIG;
        this.storeConfig = storeConfig;

    }


    getConfig() { return this.data; }

    // Returns the region of the store
    getRegion() { return this.storeConfig.region; }

    // Returns the path of the user config file
    getConfigFilePath() { return this.storeConfig.configFilePath; }

    // Returns the path of the backup config file
    getBackupConfigFilePath() { return this.storeConfig.backupConfigFilePath; }


    // Returns the path of the application config file
    getAppConfigFilePath() { return this.storeConfig.appConfigFilePath; }

    // Returns true if the current config is a backup configuration
    isCurrentConfigBackup() { return this.data && this.data.isBackup; }

    // On boot we try to load the user config from AppData
    // or fall back to a backup config
    boot() {

        // attempt to load the application configuration
        this.appConfig = loadAppConfig(this.getAppConfigFilePath());

        // attempt to load the default app config
        const userConfigLoad = loadConfig(this.getConfigFilePath(), this.getRegion());

        // if the load succesds we have a valid config -- use it as a
        // user-provided one
        if (userConfigLoad.success) {
            log("User config validation success - using it as config")
            this.useUserConfig(userConfigLoad.config, userConfigLoad.lastUpdated);
            return;
        }

        log("User config validation not successful - attempting to load backup config")
        // if the default config load failed use the backup default
        // from the app distribution
        const backupConfigLoad = loadConfig(this.getBackupConfigFilePath(), this.getRegion());

        // if the load succesds we have a valid config -- use it as
        // a config-from-backup
        if (backupConfigLoad.success) {
            log("Backup config validation success - using it as config")
            backupConfigLoad.config.isBackup = true;
            this.useBackupConfig(backupConfigLoad.config);
            return;
        }

        // save the error
        this.loadError = backupConfigLoad.error;

        // if the backup config fails to load we are screwed
        log("Backup config load failed - the application should alert the user: ", backupConfigLoad.error)

        // if there is a salt file error store the config, but act like it's invalid
        // (this is needed to pick up error messages from the config file)
        if (backupConfigLoad.isSaltFileError) {
            this.data = backupConfigLoad.config;
            this.hasConfigLoaded = false;
            this.isValid = false;
        } else {
            this.noValidConfig();
        }

    }

    // Attempts to update the contents of the current configuration file in
    // AppData with a user-provided config file.
    //
    // Returns nothing if successful, an error message string if failed.
    // The config data used by the application is updated after the save
    updateUserConfig(userConfigFilePath) {
        // attempt to load & validate the config data
        const userConfigLoad = loadConfig(userConfigFilePath, this.getRegion());

        // if failed return the error message
        if (!userConfigLoad.success) {
            this.loadError = userConfigLoad.error;
            return userConfigLoad.error;
        }

        const userConfig = userConfigLoad.config;

        // sucessfully validated => we can write the config out
        this.saveNewConfigData(userConfig);
        // and use the new config data as the user config
        this.useUserConfig(userConfig, new Date());
    }

    // Attempts to fall back to the default configuration shipped with the application.
    // Returns nothing if successful, an error message string if failed.
    //
    // This method does not save the backup as the user config, only deletes the user config file
    removeUserConfig() {
        // attempt to load the backup config
        log("[removeUserConfig] Attempting to remove user configuration and replace with backup.")


        // if the current config is already a backup config don't do anything
        if (this.isCurrentConfigBackup()) {
            log("[removeUserConfig] Already using a backup config -- bailing")
            // this is not an error - we're already using the backup
            return;
        }

        log("[removeUserConfig] Trying to load backup config file")
        const backupConfigLoad = loadConfig(this.getBackupConfigFilePath(), this.getRegion());

        // if failed return the error message (do not delete the user config yet)
        if (!backupConfigLoad.success) {
            log("Backup config validation failed -- returning error and keeping existing user config:", backupConfigLoad.error);
            // save the error
            this.loadError = backupConfigLoad.error;
            // and return it
            return backupConfigLoad.error;
        }

        // if successful use the loaded backup configuration
        log("[removeUserConfig] Backup config validation success - using it as config")
        backupConfigLoad.config.isBackup = true;
        this.useBackupConfig(backupConfigLoad.config);

        // delete the existing user config file to disable it
        this._deleteUserConfigFile();

        // do not return anything if successful
    }

    // use a backup config and store its 'backupness'
    useBackupConfig(configData) {
        this.isUsingBackupConfig = true;
        this.lastUpdated = new Date();
        this._useConfig(configData);
    }

    // use an actual user-provided config and store its 'user-providedness'
    useUserConfig(configData, lastUpdateDate) {
        this.isUsingBackupConfig = false;
        this.lastUpdated = lastUpdateDate;
        this._useConfig(configData);
    }

    // signal that there is no valid config loaded (and were unable to load anything)
    noValidConfig() {
        this.data = {};
        this.hasConfigLoaded = false;
        this.isValid = false;
    }

    // use an already validated config as the app config
    _useConfig(configData) {
        this.data = configData;
        this.hasConfigLoaded = true;
        this.isValid = true;
    }

    // deletes the user configuration file
    _deleteUserConfigFile() {
        const configPath = this.getConfigFilePath();
        log("Deleting config file: ", configPath);
        fs.unlinkSync(configPath);
    }

    // Overwrites the existing configuration file with the new data
    saveNewConfigData(configData) {
        // before saving ensure that we can save the configuration
        ensureAppDirectoryExists(path.dirname(this.getConfigFilePath()));
        // TODO: maybe do a rename w/ timestamp for backup
        // save the config to the output path
        saveConfig(configData, this.getConfigFilePath());
    }

    // Overwrites the application configuration with the current
    // appConfig value.
    _saveAppConfig() {
        ensureAppDirectoryExists(path.dirname(this.getAppConfigFilePath()));
        saveAppConfig(this.appConfig, this.getAppConfigFilePath());
    }


    _currentSignature() {
        if (this.data && this.data.signature && this.data.signature.config_signature) {
            return this.data.signature.config_signature;
        }
        return "INVALID CONFIG, NO SIGNATURE"
    }

    // Marks the terms and conditions as accepted for the curent config hash
    // and saves the application config so the user doesn't have to accept it
    // anymore
    acceptTermsAndConditions() {
        this.appConfig.termsAndConditions[this._currentSignature()] = true;
        this._saveAppConfig();
    }

    // Returns true if the user has accepted the terms and conditions of the current
    // config (as indicated by the signature)
    hasAcceptedTermsAndConditions() {
        return (this.appConfig.termsAndConditions[this._currentSignature()] == true);
    }

}

function makeConfigStore(storeConfig=DEFAULT_CONFIG_STORE_CONFIG) {
    return new ConfigStore(storeConfig);
}


module.exports = makeConfigStore;
