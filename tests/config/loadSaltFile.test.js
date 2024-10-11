const path = require('node:path')
const fs = require('node:fs')
const loadSaltFile = require('../../config/loadSaltFile');

const VALIDATOR_REGEXP = /BEGIN TEST[a-z\s]*END TEST/
const SALT_FILE_PATH = path.join(__dirname, "files", "test.salt")

test("loadSaltFile", ()=> {
    expect(loadSaltFile(SALT_FILE_PATH, VALIDATOR_REGEXP))
        .toEqual(fs.readFileSync(SALT_FILE_PATH, 'utf-8'))

    expect(loadSaltFile("NON-EXISTANT-FILE", VALIDATOR_REGEXP))
        .toEqual(null)

    expect(loadSaltFile(path.join(__dirname, "files", "test-config.json"), VALIDATOR_REGEXP))
        .toEqual(null)
})