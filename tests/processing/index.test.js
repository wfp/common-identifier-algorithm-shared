const path = require('node:path')
const os = require('node:os')
const fs = require('node:fs')
const {preprocessFile, processFile} = require('../../processing/index');
const { FILE_XLSX, FILE_CSV } = require('../../document');
const BaseHasher = require('../../hashing/base');
const csv = require('csv-parse/sync');

const CONFIG = {
    source: {
        columns: [
            { name: "A", alias: "col_a" },
            { name: "B", alias: "col_b" },
        ]
    },
    algorithm: {
        hash: {
            strategy: "sha256"
        },
        salt: {
            source: "string",
            value: "TEST",
        },
        columns: {
            static: ["col_a"],
            to_translate: [],
            reference: [],
        }
    },
    validations: {
        "col_a": [ { op: "max_field_length", value: 2 } ],
    },
    destination: {
        columns: [ {name: "A", alias: "col_a"}, { name: "Test", alias: "test"}],
        postfix: "_OUTPUT",
    },
    destination_errors: {
        columns: [ { name: "Errors", alias: "errors" }, {name: "A", alias: "col_a"}],
        postfix: "_ERRORS",
    },
    destination_map: {
        columns: [],
        postfix: "_MAPPING",
    }
};


test("preprocessFile", async () => {
    const filePath = path.join(__dirname, "input_ok.csv");
    const results = await preprocessFile(CONFIG, filePath, 10);

    expect(results.isMappingDocument).toEqual(false);
    expect(results.inputData.sheets.length).toEqual(1);
    expect(results.inputData.sheets[0].data[0]).toEqual({
        col_a: "A0", col_b: "B0"
    });


    expect(results.validationResult.length).toEqual(1);
    expect(results.validationResult[0].sheet).toEqual("Sheet 1");
    expect(results.validationResult[0].ok).toEqual(true);


    for (const rowResult of results.validationResult[0].results) {
        expect(rowResult.ok).toEqual(true)
        expect(rowResult.errors).toEqual([])

    }
})



test("preprocessFile mapping", async () => {
    const filePath = path.join(__dirname, "input_mapping_ok.csv");
    const results = await preprocessFile(CONFIG, filePath, 10);

    expect(results.isMappingDocument).toEqual(true);
    expect(results.inputData.sheets.length).toEqual(1);
    expect(results.inputData.sheets[0].data[0]).toEqual({
        col_a: "A0"
    });

    expect(results.validationResult.length).toEqual(1);
    expect(results.validationResult[0].sheet).toEqual("Sheet 1");
    expect(results.validationResult[0].ok).toEqual(true);


})

test("preprocessFile invalid", async () => {
    const filePath = path.join(__dirname, "input_invalid.csv");
    const results = await preprocessFile(CONFIG, filePath, 10);


    expect(results.isMappingDocument).toEqual(false);
    expect(results.inputData.sheets.length).toEqual(1);
    expect(results.inputData.sheets[0].data[0]).toEqual({ col_a: "A0", col_b: "B0" });
    expect(results.inputData.sheets[0].data[1]).toEqual({ col_a: "A1 TOO LONG", col_b: "B1" });


    expect(results.validationResult.length).toEqual(1);
    expect(results.validationResult[0].sheet).toEqual("Sheet 1");
    expect(results.validationResult[0].ok).toEqual(false);


    const rr = results.validationResult[0].results;

    expect(rr[0].ok).toEqual(true)

    expect(rr[1].ok).toEqual(false)
    expect(rr[1].errors.length).toEqual(1)
    expect(rr[1].errors[0].column).toEqual("col_a")

    const errorFile = results.validationErrorsOutputFile;
    expect(errorFile).not.toEqual(undefined)
    expect(fs.existsSync(errorFile)).toEqual(true)

})


////////////////////////////////////////////////////////////////////////////////

class TestHasher extends BaseHasher {
    constructor(opts) {
        super(opts)
    }

    generateHashForExtractedObject(extractedObj) {
        return {
            test: `TEST ${extractedObj.static.join(' ')}`
        }
    }

}

function makeTestHasher(opts) {
    return new TestHasher(opts);
}


test("processFile", async () => {
    const filePath = path.join(__dirname, "input_ok.csv");
    const outputBasePath = path.join(os.tmpdir(), "output_test");

    const results = await processFile(CONFIG, outputBasePath, filePath, 10, FILE_CSV, makeTestHasher );

    expect(results.outputFilePaths).toEqual([`${outputBasePath}_OUTPUT.csv`]);
    expect(results.mappingFilePaths).toEqual([`${outputBasePath}_MAPPING.csv`]);
    expect(results.allOutputPaths).toEqual([
        `${outputBasePath}_OUTPUT.csv`, `${outputBasePath}_MAPPING.csv`
    ])

    expect(results.outputData.sheets.length).toEqual(1)
    const [row1, row2] = results.outputData.sheets[0].data;

    expect(row1.col_a).toEqual("A0")
    expect(row1.test).toEqual("TEST A0")
    expect(row2.col_a).toEqual("A1")
    expect(row2.test).toEqual("TEST A1")
    // expect(results.outputData.sheets[0].data[1]).toEqual({col_a: "A1", test: "TEST A1"})
    // expect(results.outputData.sheets[0].data[0]).toEqual({col_a: "A0", test: "TEST A0"})
    // expect(results.outputData.sheets[0].data[1]).toEqual({col_a: "A1", test: "TEST A1"})


    const csvData = csv.parse(fs.readFileSync(`${outputBasePath}_OUTPUT.csv`, 'utf-8'));

    expect(csvData).toEqual([
        ["A", "Test"],
        ["A0", "TEST A0"],
        ["A1", "TEST A1"],
    ])


    // expect(results.isMappingDocument).toEqual(false);
    // expect(results.inputData.sheets.length).toEqual(1);
    // expect(results.inputData.sheets[0].data[0]).toEqual({
    //     col_a: "A0", col_b: "B0"
    // });


    // expect(results.validationResult.length).toEqual(1);
    // expect(results.validationResult[0].sheet).toEqual("Sheet 1");
    // expect(results.validationResult[0].ok).toEqual(true);


    // for (const rowResult of results.validationResult[0].results) {
    //     expect(rowResult.ok).toEqual(true)
    //     expect(rowResult.errors).toEqual([])

    // }
})
