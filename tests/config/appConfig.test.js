const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')
const {
    loadAppConfig,
    saveAppConfig,
    DEFAULT_APP_CONFIG,
} = require('../../config/appConfig')

test("appConfig load", ()=> {
    const PATH = path.join(__dirname, "files", "test-appconfig.json");
    expect(loadAppConfig(PATH))
        .toEqual(JSON.parse(fs.readFileSync(PATH, 'utf-8')))

    expect(loadAppConfig("Some invalid path")).toEqual(DEFAULT_APP_CONFIG)

    expect(loadAppConfig(path.join(__dirname, "files", "test-config.json")))
        .toEqual(DEFAULT_APP_CONFIG)
})

test("appConfig save", ()=> {
    const cfg = Object.assign({}, DEFAULT_APP_CONFIG);
    cfg.test = "SOME TEST";

    const PATH = path.join(os.tmpdir(), "test-appconfig.json");
    saveAppConfig(cfg, PATH);
    expect(JSON.parse(fs.readFileSync(PATH, 'utf-8')))
        .toEqual(cfg)

})

