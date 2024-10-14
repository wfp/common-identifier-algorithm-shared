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

const { Sheet, Document } = require('../document');
const log = require('debug')('CID:Decoder')

class DecoderBase {
    constructor(sourceConfig) {
        this.sourceConfig = sourceConfig;
    }

    // Decodes an incoming data file and returns a Promise with a list of
    // sheets, each of which has a list of rows, which contain the columns as a
    // list of strings
    async decodeFile(path) {
        throw new Error("Not implemented");
    }


    // Takes an input [ [col1_name, col2_name], [val1, val2], [val1_2, val2_2]] arrays
    // and converts it to a list of { col1_name => val1, col2_name => val2 } like objects
    convertSheetRowsToObjects(sheetData) {
        // is there at least one row?
        if (sheetData.length < 1) {
            // if the sheet is empty the output is empty
            return [];
        }

        // take the first row
        let firstRow = this.mapColumnNamesToIds(sheetData[0]);
        let objectRows = sheetData.slice(1).map((row)=> {
            // the output object
            let outputObject = {};
            // go through all columns
            row.forEach((col, i) => {
                // columns with empty names should be ignored
                // .trim() is needed because the first column can have BOM and other markers
                // around it, and that would mess with the column naming
                let colName = firstRow[i].trim();
                if (typeof colName !== 'string' || colName === '') {
                    return;
                }
                // assign the value to the column
                outputObject[colName] = col;
            });


            const transformed = this.prepareSingleObject(outputObject);
            return transformed;
        });

        log("AFTER:", objectRows[0])
        return objectRows;
    }


    // Takes a single object pre-converted and re-maps names to aliases + adds defaults
    prepareSingleObject(row) {
        return this.sourceConfig.columns.reduce((memo, column) => {
            const {name, alias} = column;
            // fetch the value
            let value = row[name] || row[alias];

            // if undefined use default or don't add to the object
            if (typeof value === 'undefined') {
                const defaultValue = column.default;

                // check if there is a default value for the config
                if (typeof defaultValue === 'undefined') {
                    return memo;
                }

                // use the default value
                value = defaultValue;
            }
            return Object.assign(memo, {[alias]: value});
        }, {})
    }

    // converts a list of column names to a list of column ids based on the
    // config's 'source.columns' mapping
    mapColumnNamesToIds(columnNames) {
        // convert the column map to a lookup object
        let columnMap = this.sourceConfig.columns.reduce((memo, {name, alias}) => {
            return Object.assign(memo, { [name]: alias });
        }, {});

        return columnNames.map((col) => {
            // check if we have this name
            let newName = columnMap[col];
            return newName ? newName : col;
        });
    }

    // takes a list of rows with a list of strings and returns a new Sheet object.
    sheetFromRawData(name, rawData) {
        return new Sheet(name, this.convertSheetRowsToObjects(rawData));
    }

    documentFromSheets(sheets) {
        return new Document(sheets);
    }
}


module.exports = DecoderBase;