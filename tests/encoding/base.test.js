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

const EncoderBase = require('../../encoding/base')
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const BASE_CFG = {
    postfix: "_POSTFIX",
    columns: [
        { name: "A", alias: "col_a" },
        { name: "B", alias: "col_b" },
    ],
}

function makeEncoderBase(cfg=BASE_CFG) {
    return new EncoderBase(cfg)
}

test("EncoderBase creation", () => {

})

test("EncoderBase abstracts", () => {
    const e = makeEncoderBase()
    expect(() => { e.startDocument() }).toThrow();
    expect(() => { e.endDocument() }).toThrow();
    expect(() => { e.writeSheet({}, {}, { current: 0, length: 10}) }).toThrow();
})

test("EncoderBase::_getOutputNameFor", () => {
    const e = makeEncoderBase()
    expect(e._getOutputNameFor("TEST")).toEqual("TEST_POSTFIX")
    expect(e._getOutputNameFor("{{yyyy}}")).toEqual((new Date().getFullYear()) + "_POSTFIX")
})

test("EncoderBase::_generateHeaderRow", () => {
    const e = makeEncoderBase()
    expect(e._generateHeaderRow()).toEqual({ col_a: "A", col_b: "B"})
})

test("EncoderBase::_filterDataBasedOnConfig", () => {
    const e = makeEncoderBase()
    expect(e._filterDataBasedOnConfig([
        { col_a: "A1", col_b: "B1", col_c: "C1"},
        { col_a: "A2", col_b: "B2", col_d: "D2"},
    ])).toEqual([
        { col_a: "A1", col_b: "B1"},
        { col_a: "A2", col_b: "B2"},
    ])
})

test("EncoderBase::_withTemporaryFile", () => {
    const e = makeEncoderBase()
    const test_output_path = path.join(__dirname, "encoderbase_output_test")

    if (fs.existsSync(test_output_path)) {
        fs.unlinkSync(test_output_path);
    }

    const TEST_STR = "TEST123"

    e._withTemporaryFile(test_output_path, (tempPath) => {
        expect(tempPath).not.toEqual(test_output_path);
        expect(fs.existsSync(test_output_path)).toEqual(false);

        fs.writeFileSync(tempPath, TEST_STR, 'utf-8')
    })

    expect(fs.existsSync(test_output_path)).toEqual(true)
    expect(fs.readFileSync(test_output_path, "utf-8")).toEqual(TEST_STR)

    fs.unlinkSync(test_output_path);


    expect(() => { e._withTemporaryFile(path.join("__dirname", "THIS_PATH_SHOULD_NOT_EXIST", "output_test"), (fn) => {
    }) }).toThrow()
})


class TestEncoder extends EncoderBase {
    constructor(cfg) {
        super(cfg)
        this.reset()
    }

    reset() {
        this.startArgs = [];
        this.endArgs = [];
        this.writeCalls = [];
    }

    // Starts the wiriting of a new document (could be a single output file or multiple)
    startDocument(document, outputPath, options={}) {
        this.startArgs = [document, outputPath, options];
    }

    // Ends wiriting the document
    endDocument(document) {
        this.endArgs = [document];
    }


    // Writes a Sheet to the pre-determined output
    writeSheet(sheet, config, { current, length}) {
        this.writeCalls.push([sheet, config, {current, length}])
    }
}

test("EncoderBase::encodeDocument", () => {

    const e = new TestEncoder(BASE_CFG);

    const DOC = { sheets: [ "sheet_1_object", "sheet_2_object" ]}

    function testEncoding(options, sheetConfig) {
        e.reset();
        e.encodeDocument(DOC, "output_path", options, sheetConfig)

        expect(e.startArgs).toEqual([DOC, "output_path", options || {}])
        expect(e.endArgs).toEqual([DOC])
        expect(e.writeCalls).toEqual([
            ["sheet_1_object", sheetConfig || {},  { current: 0, length: 2 }],
            ["sheet_2_object", sheetConfig || {},  { current: 1, length: 2 }],
        ])
    }

    testEncoding()
    testEncoding("options")
    testEncoding("options", "sheetconfig")

})


