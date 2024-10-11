const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')
const toml = require('toml')
const makeConfigStore = require('../../config/ConfigStore')


test("ConfigStore default options", () => {
    const c = makeConfigStore();

    expect(c.getConfigFilePath()).toMatch(/config\.[A-Z]{3}\.json$/)
    expect(c.getBackupConfigFilePath()).toMatch(/config\.backup\.(toml|json)/)
    expect(c.getAppConfigFilePath()).toMatch(/appconfig\.[A-Z]{3}\.json$/)

    expect(c.getConfig()).toEqual({})
})

const CONFIG_FILE_NAME = 'test-config.json';
const BACKUP_CONFIG_FILE_NAME = 'test-config.backup.toml';
const APP_CONFIG_FILE_NAME = 'test-appconfig.json';

function makeTestConfig(basePath) {
    return {
        configFilePath: path.join(basePath, CONFIG_FILE_NAME),
        backupConfigFilePath: path.join(basePath, BACKUP_CONFIG_FILE_NAME),
        appConfigFilePath: path.join(basePath, APP_CONFIG_FILE_NAME),
        region: "GOS",
    }
}

function placeTestConfigFiles(basePathPrefix) {
    const fromPath = path.join(__dirname, "files");
    const basePath = fs.mkdtempSync(path.join(os.tmpdir(), basePathPrefix));

    const cp = n => fs.copyFileSync(path.join(fromPath, n), path.join(basePath, n));
    [CONFIG_FILE_NAME, BACKUP_CONFIG_FILE_NAME, APP_CONFIG_FILE_NAME].forEach(cp)

    return basePath;
}



test("ConfigStore loading", () => {
    const basePath = placeTestConfigFiles("ConfigStore-normal");

    const c = makeConfigStore(makeTestConfig(basePath));

    c.boot();

    expect(c.isUsingBackupConfig).toEqual(false)
    expect(c.isValid).toEqual(true)

    const config = Object.assign({}, c.getConfig());

    expect(config.meta.region).toEqual("GOS");
    expect(config.meta.version).toEqual("0.1.0");

    expect(config.algorithm.salt.source).toEqual("STRING");

    delete config.algorithm.salt.source;
    delete config.algorithm.salt.value;

    const originalConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "files", CONFIG_FILE_NAME), 'utf-8'));
    delete originalConfig.algorithm.salt.source;
    delete originalConfig.algorithm.salt.value;

    expect(config).toEqual(originalConfig);
})




test("ConfigStore backup loading", () => {
    const basePath = placeTestConfigFiles("ConfigStore-backup");
    fs.unlinkSync(path.join(basePath, CONFIG_FILE_NAME));

    const c = makeConfigStore(makeTestConfig(basePath));

    c.boot();

    expect(c.isUsingBackupConfig).toEqual(true)
    expect(c.isValid).toEqual(true)

    const config = Object.assign({}, c.getConfig());

    expect(config.isBackup).toEqual(true);
    expect(config.algorithm.salt.source).toEqual("STRING");

    delete config.isBackup;
    delete config.algorithm.salt.source;
    delete config.algorithm.salt.value;

    const originalConfig = toml.parse(fs.readFileSync(path.join(__dirname, "files", BACKUP_CONFIG_FILE_NAME), 'utf-8'));
    delete originalConfig.algorithm.salt.source;
    delete originalConfig.algorithm.salt.value;

    expect(config).toEqual(originalConfig);
})



test("ConfigStore error loading", () => {
    const basePath = placeTestConfigFiles("ConfigStore-error");
    fs.unlinkSync(path.join(basePath, CONFIG_FILE_NAME));
    fs.unlinkSync(path.join(basePath, BACKUP_CONFIG_FILE_NAME));

    const c = makeConfigStore(makeTestConfig(basePath));

    c.boot();

    expect(c.isUsingBackupConfig).toEqual(false)
    expect(c.isValid).toEqual(false)


    const config = Object.assign({}, c.getConfig());
    expect(config).toEqual({})
})


////////////////////////////////////////////////////////////////////////////////


test("ConfigStore saving and loading user config", () => {
    const basePath = placeTestConfigFiles("ConfigStore-saving-user-config");
    fs.unlinkSync(path.join(basePath, CONFIG_FILE_NAME));
    // fs.unlinkSync(path.join(basePath, BACKUP_CONFIG_FILE_NAME));

    const c = makeConfigStore(makeTestConfig(basePath));

    c.boot();
    expect(c.isUsingBackupConfig).toEqual(true)

    // updating user config
    {
        // OK
        expect(fs.existsSync(path.join(basePath, CONFIG_FILE_NAME))).toEqual(false)
        expect(c.updateUserConfig(path.join(basePath, BACKUP_CONFIG_FILE_NAME))).toEqual(undefined)
        expect(fs.existsSync(path.join(basePath, CONFIG_FILE_NAME))).toEqual(true)


        expect(c.isUsingBackupConfig).toEqual(false)
        expect(c.isValid).toEqual(true)



        const config = Object.assign({}, c.getConfig());
        expect(config.meta.region).toEqual("GOS")



        // ERROR
        const errResult = c.updateUserConfig(path.join(basePath, "config.xxx.toml"))
        expect(typeof errResult).toEqual('string')


        expect(c.isUsingBackupConfig).toEqual(false)
        expect(c.isValid).toEqual(true)

    }
    // removing user config
    {
        expect(fs.existsSync(path.join(basePath, CONFIG_FILE_NAME))).toEqual(true)
        expect(c.removeUserConfig()).toEqual(undefined)
        expect(fs.existsSync(path.join(basePath, CONFIG_FILE_NAME))).toEqual(false)

        expect(c.isUsingBackupConfig).toEqual(true)
        expect(c.isValid).toEqual(true)

        // already using a backup, not able to remove, but not fail
        expect(c.removeUserConfig()).toEqual(undefined)

        expect(c.isUsingBackupConfig).toEqual(true)
        expect(c.isValid).toEqual(true)

        // load the config back
        expect(c.updateUserConfig(path.join(basePath, BACKUP_CONFIG_FILE_NAME))).toEqual(undefined)

        // remove the backup
        fs.unlinkSync(path.join(basePath, BACKUP_CONFIG_FILE_NAME));

        // check if we have an error on removal
        expect(typeof c.removeUserConfig()).toEqual('string')

        // yet keep the existing config
        expect(c.isValid).toEqual(true)
    }

})




test("ConfigStore app config TnS", () => {
    const basePath = placeTestConfigFiles("ConfigStore-appconfig");

    {
        const c = makeConfigStore(makeTestConfig(basePath));
        c.boot();

        expect(c.hasAcceptedTermsAndConditions()).toEqual(false);
        c.acceptTermsAndConditions()
        expect(c.hasAcceptedTermsAndConditions()).toEqual(true);
    }
    // should keep between instantiations
    {
        const c = makeConfigStore(makeTestConfig(basePath));
        c.boot();

        expect(c.hasAcceptedTermsAndConditions()).toEqual(true);
    }


})