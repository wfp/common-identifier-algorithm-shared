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

// Column validators use the same error type (as they need to be displayed in the
// table for each row)
const ValidationError = require('../validation/ValidationError');
const ValidatorBase = require('../validation/base');
// Column-based


// The Sheet validator is like a validatorbase, but uses a different validation method
class SheetValidatorBase extends ValidatorBase {

    constructor(kind, opts) {
        super(kind, opts)
    }

    // Validates the sheet data. Gets passed the entired
    validateSheet(sheetData) {
        throw new Error(`Not implemented`)
    }


    validate(value, row) {
        throw new Error("validate() is not used for SheetValidators")
    }

}

// Validator that checks that every value in a column is the same value
class FieldValuesEqualColumnValidator extends SheetValidatorBase {

    constructor(columnName, opts) {
        super("filed_values_equal", opts);
        this.columnName = columnName;
    }

    // the default message
    defaultMessage() {
        return `the column '${this.columnName}' must have a single value in the whole input`;
    }


    validateSheet(sheetData) {

        // zero rows always OK
        if (sheetData.length === 0) {
            return this.success();
        }

        // the target value is the first row's value
        const targetValue = sheetData[0][this.columnName]

        for(let row of sheetData) {
            // if the
            if (row[this.columnName] != targetValue) {
                return this.failWith(`expected '${targetValue}', but found '${row[this.columnName]}'`)
            }
        }

        // if no rows failed we succeeded
        return this.success();
    }
}

