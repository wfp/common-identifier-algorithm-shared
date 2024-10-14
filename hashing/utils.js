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



// takes an row object and the "algorithm.columns" config and returns a new
// object with { static: [<COL VALUES>], to_translate: [..], reference: [...] } columns
function extractAlgoColumnsFromObject(columnConfig, obj) {
    // check if we have an actual config
    if (typeof columnConfig !== "object") {
        throw new Error("Invalid algorithm columns config");
    }

    // the config values we care about
    let groups = ["static", "to_translate", "reference"];
    let output = {};

    // go through the groups
    for (let groupName of groups) {
        let colNames = columnConfig[groupName];
        // check if this is an array
        if (!Array.isArray(colNames)) {
            throw new Error(`invalid algorithm config: cannot find column group '${groupName}'`);
        }

        let colValues = colNames.map((colName) => {
            let extractedValue = obj[colName];
            return extractedValue;
        });

        output[groupName] = colValues;
    }

    return output;
}


// Centralized helper to join different parts of a field value list
function joinFieldsForHash(fieldValueList) {
    return fieldValueList.join("");
}

// Returns a cleaned version (null and undefined values removed)
// TODO: implement this based on WFP feedback
function cleanValueList(fieldValueList) {
    return fieldValueList.map((v) => typeof v === 'string' ? v : "")
}



module.exports = {
    joinFieldsForHash,
    cleanValueList,
    extractAlgoColumnsFromObject,
}
