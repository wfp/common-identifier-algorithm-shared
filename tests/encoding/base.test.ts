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
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { EncoderBase } from '../../encoding/base.js';
import { CidDocument } from '../../document.js';
import { Config } from '../../config/Config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_CFG: Config.ColumnMap = {
    postfix: "_POSTFIX",
    columns: [
        { name: "A", alias: "col_a" },
        { name: "B", alias: "col_b" },
    ],
}

function makeEncoderBase(cfg=BASE_CFG) {
    return new EncoderBase(cfg)
}

test("EncoderBase abstracts", () => {
    const e = makeEncoderBase()
    expect(() => e.startDocument("") ).toThrow();
    expect(() => e.endDocument(new CidDocument("", [])) ).toThrow();
    expect(() => e.writeDocument({ name: "", data: [] }) ).toThrow();
});