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