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

const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { loadConfig } = require('../../config/loadConfig')
const generateConfigHash = require('../../config/generateConfigHash')

const REGION = "GOS";
const FILES_PATH = path.join(__dirname, "files");

test("loadConfig ok", ()=>{
    const TEST_FILE_PATH = path.join(FILES_PATH, "test-config.json");
    const loadResult = loadConfig(TEST_FILE_PATH, REGION);

    expect(loadResult.success).toEqual(true)
    expect(loadResult.lastUpdated).toEqual(new Date(fs.statSync(TEST_FILE_PATH).mtime))
    expect(loadResult.config).toEqual(JSON.parse(fs.readFileSync(TEST_FILE_PATH, 'utf-8')))
})

test("loadConfig invalid", ()=>{
    const TEST_FILE_PATH = path.join(FILES_PATH, "test-appconfig.json");
    const loadResult = loadConfig(TEST_FILE_PATH, REGION);

    expect(loadResult.success).toEqual(false)
    expect(typeof loadResult.error).toEqual('string')
})

test("loadConfig salt", ()=>{
    const SALT_FILE_PATH = path.join(FILES_PATH, 'test.salt');
    const TEST_FILE_PATH = path.join(os.tmpdir(), "salt-config.json");
    const cfg = JSON.parse(fs.readFileSync(path.join(FILES_PATH, "test-salt-loading-config.json"), 'utf-8'));


    cfg.algorithm.salt.value.darwin = SALT_FILE_PATH;
    cfg.algorithm.salt.value.win32 = SALT_FILE_PATH;
    cfg.signature.config_signature = generateConfigHash(cfg);

    fs.writeFileSync(TEST_FILE_PATH, JSON.stringify(cfg), 'utf-8');

    const loadResult = loadConfig(TEST_FILE_PATH, REGION);

    expect(loadResult.success).toEqual(true)

    const config = loadResult.config;
    expect(config.algorithm.salt.source).toEqual("STRING");
    expect(config.algorithm.salt.value).toEqual(fs.readFileSync(SALT_FILE_PATH, 'utf-8'));
})

test("loadConfig salt error", ()=>{
    const SALT_FILE_PATH = "INVALID SALT PATH";
    const TEST_FILE_PATH = path.join(os.tmpdir(), "salt-config.json");
    const cfg = JSON.parse(fs.readFileSync(path.join(FILES_PATH, "test-salt-loading-config.json"), 'utf-8'));


    cfg.algorithm.salt.value.darwin = SALT_FILE_PATH;
    cfg.algorithm.salt.value.win32 = SALT_FILE_PATH;
    cfg.signature.config_signature = generateConfigHash(cfg);

    fs.writeFileSync(TEST_FILE_PATH, JSON.stringify(cfg), 'utf-8');

    const loadResult = loadConfig(TEST_FILE_PATH, REGION);

    expect(loadResult.success).toEqual(false)

})