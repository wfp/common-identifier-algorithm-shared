const mappingRequiredColumns = require('../../processing/mappingRequiredColumns')


test("mappingRequiredColumns", () => {
    expect(() => mappingRequiredColumns({algorithm: {}})).toThrow()

    expect(mappingRequiredColumns({
        algorithm: { columns: {} },
        source: { columns: [] },
        destination_map: { columns: [] },
    })).toEqual([])

    expect(mappingRequiredColumns({
        algorithm: {
            columns: {
                to_translate: [
                    "first_name",
                    "last_name",
                    "father_first_name",
                    "father_last_name",
                    "mother_first_name",
                ],
                static: [ "dob_year" ],
                reference: [ "document_type", "document_id" ],
            }
        },
        source: {
            columns: [
                { name: "A", alias: "col_a" },
                { name: "B", alias: "col_b" },
                { name: "MAPPING", alias: "col_mapping" },
            ]
        },
        destination_map: {
            columns: [
                { name: "C", alias: "col_c" },
                { name: "D", alias: "col_d" },
                { name: "MAPPING", alias: "col_mapping" },
            ]
        }
    })).toEqual([
        "first_name",
        "last_name",
        "father_first_name",
        "father_last_name",
        "mother_first_name",
        "dob_year",
        "document_type", "document_id",
        "col_mapping"
    ])
})