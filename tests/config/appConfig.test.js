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

