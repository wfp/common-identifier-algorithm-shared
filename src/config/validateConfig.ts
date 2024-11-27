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

import { Config } from "./Config.js";

// enums with the validation result
export function validateConfig(config: Config.Options, region: string) {

    function isObject(label: string, v: unknown) {
        if (typeof v !== "object") return `Missing ${label}`;
    }

    function isNumber(label: string, v: unknown) {
        if (typeof v !== "number") return `${label} must be a number`;
    }

    function isString(label: string, v: unknown) {
        if (typeof v !== "string") return `${label} must be a string`;
    }

    function isStringList(label: string, v: unknown) {
        if (!Array.isArray(v)) return `${label} must be a string array`;

        if (v.some(e => typeof e !== 'string')) {
            return `${label} must contain strings`;
        }
    }

    function isOneOf(label: string, values: unknown[], v: unknown) {
        if (values.indexOf(v) < 0) return `${label} must be one of ${values}`
    }

    function isArrayOf(label: string, pred: any, v: unknown) {
        if (!Array.isArray(v)) return `${label} must be an array`;

        const result = v.find(pred);
        if (result) {
            return `${label}${pred(result)}`;
        }
    }

    function isValidRegexp(label: string, v: unknown) {
        try {
            let _ = new RegExp(v as string);
        } catch (e) {
            return `${label} is not a valid JavaScript Regular Expression`
        }
    }

    function isTrue(label: string, v: unknown) {
        if (!v) {
            return label;
        }
    }

    // Generic column mapping
    // ----------------------
    function checkColumnMapping(label: string, columnMappingObject: Config.ColumnMap) {
        return isObject(label, columnMappingObject) ||
            isArrayOf(label + ".columns", (c: Config.Column) => (
                isObject("", c) ||
                isString(".name", c.name) ||
                isString(".alias", c.alias)
            ), columnMappingObject.columns);
    }


    // Meta
    // ----

    function checkMeta(meta: Config.Options["meta"]) {
        if (typeof meta !== 'object') {
            return `[meta] must be present`
        }
        // check if this is the correct region
        if (meta.region != region) {
            return `meta.region is not '${region}'`
        }

        return isObject("meta", meta) ||
            isString("meta.version", meta.version) ||
            isString("meta.region", meta.region);
    }

    // Source & destinations
    // ---------------------

    function checkSource(source: Config.Options["source"]) {
        return checkColumnMapping("source", source);
    }

    function checkDestination(label: string, destination: Config.Options["destination"]) {
        return checkColumnMapping(label, destination) ||
            isString(`${label}.postfix`, destination.postfix);
    }

    // Validations
    // -----------

    function checkValidations(validations: Config.Options["validations"]) {
        if (typeof validations !== 'object') return `validations must be an object`;

        // check each key
        return Object.keys(validations).reduce((memo: undefined | string, k) => {
            if (memo) return memo;

            return isArrayOf(`validations.${k}`, (v: Config.ColumnValidation) => (
                isObject("", v) ||
                isString(".op", v.op) ||
                // value is either a number or a string
                // or v.op is 'same_value_for_all_rows'
                (
                    isString(".value", v.value) &&
                    isNumber(".value", v.value) &&
                    isStringList(".value", v.value) &&
                    isTrue('same_value_for_all_rows', v.op === 'same_value_for_all_rows') &&
                    isTrue('linked_field', v.op === "linked_field")
                )
            ),validations[k])
        }, "")

    }

    // Algorithm
    // ---------

    function checkAlgorithm(algorithm: Config.Options["algorithm"]) {
        // check if there is a salt
        if (typeof algorithm !== "object")
            return "Missing algorithm";

        function checkAlgorithmHash(algorithmHash: Config.Options["algorithm"]["hash"]) {
            return isObject("algorithm.hash", algorithmHash) ||
                isOneOf("algorithm.hash.strategy", ["SHA256", "SCRYPT", "ARGON2"], algorithmHash.strategy)
                // TODO: algorithm parameters that are dependent on the algorithm choice
        }

        function checkAlgorithmColumns(algorithmColumns: Config.Options["algorithm"]["columns"]) {
            return isObject("algorithm.columns", algorithmColumns) ||
                isStringList("algorithm.columns.to_translate", algorithmColumns.to_translate) ||
                isStringList("algorithm.columns.reference", algorithmColumns.static) ||
                isStringList("algorithm.columns.reference", algorithmColumns.reference);
        }

        function checkAlgorithmSalt(algorithmSalt: Config.Options["algorithm"]["salt"]) {
            // // check if there is a salt
            // if (typeof algorithmSalt !== "object")
            //     return "Missing algorithm.salt";

            const saltValidationError = isObject("algorithm.salt", algorithmSalt) ||
                isString("algorithm.salt.validator_regex", algorithmSalt.validator_regex) ||
                isValidRegexp("algorithm.salt.validator_regex", algorithmSalt.validator_regex)

            if (saltValidationError) {
                return saltValidationError;
            }

            switch (algorithmSalt.source) {
                case "FILE":
                    // the salt value is either a string or has basic platform suppport
                    return isString("algorithm.salt.value", algorithm.salt.value) &&
                    (
                        isObject("algorithm.salt.value", algorithm.salt.value) || // @ts-ignore
                        isString("algorithm.salt.value.win32", algorithm.salt.value.win32) || // @ts-ignore
                        isString("algorithm.salt.value.darwin", algorithm.salt.value.darwin) || // @ts-ignore
                        isString("algorithm.salt.value.linux", algorithm.salt.value.linux)
                    );
                case "STRING":
                    return isString("algorithm.salt.value", algorithm.salt.value);
                default:
                    return "Unknown algorithm.salt.source";

            }
        }

        // check the salt
        return checkAlgorithmColumns(algorithm.columns) ||
            checkAlgorithmHash(algorithm.hash) ||
            checkAlgorithmSalt(algorithm.salt);


    }


    function checkSignature(signature: Config.Options["signature"]) {
        return isObject("signature", signature) ||
            isString("signature.config_signature", signature.config_signature);
    }

    function checkMessages(messages: Config.Options["messages"]) {
        return isObject("messages", messages) ||
            isString("messages.error_in_config", messages?.error_in_config) ||
            isString("messages.error_in_salt", messages?.error_in_salt) ||
            isString("messages.terms_and_conditions", messages?.terms_and_conditions);

    }

    return checkMeta(config.meta) ||
        checkSource(config.source) ||
        checkValidations(config.validations) ||
        checkAlgorithm(config.algorithm) ||
        checkDestination("destination", config.destination) ||
        checkDestination("destination_map", config.destination_map) ||
        checkDestination("destination_errors", config.destination_errors) ||
        checkSignature(config.signature) ||
        checkMessages(config.messages)
        ;
}