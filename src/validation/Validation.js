"use strict";
// Common Identifier Application
// Copyright (C) 2024 World Food Programme
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDateFieldDiffValidator = exports.isLinkedFieldValidator = exports.isSameValueForAllRowsValidator = exports.isDateDiffValidator = exports.isMinValueValidator = exports.isMaxValueValidator = exports.isMinFieldLengthValidator = exports.isMaxFieldLengthValidator = exports.isLanguageCheckValidator = exports.isFieldTypeValidator = exports.isRegexMatchValidator = exports.isOptionsValidator = exports.SUPPORTED_VALIDATORS = void 0;
var max_value_1 = require("./validators/max_value");
var SUPPORTED_VALIDATORS;
(function (SUPPORTED_VALIDATORS) {
    SUPPORTED_VALIDATORS["FIELD_NAME"] = "field_name";
    SUPPORTED_VALIDATORS["FIELD_TYPE"] = "field_type";
    SUPPORTED_VALIDATORS["LANGUAGE_CHECK"] = "language_check";
    SUPPORTED_VALIDATORS["MIN_VALUE"] = "min_value";
    SUPPORTED_VALIDATORS["MAX_VALUE"] = "max_value";
    SUPPORTED_VALIDATORS["MIN_FIELD_LENGTH"] = "min_field_length";
    SUPPORTED_VALIDATORS["MAX_FIELD_LENGTH"] = "max_field_length";
    SUPPORTED_VALIDATORS["OPTIONS"] = "options";
    SUPPORTED_VALIDATORS["ROW_MATCHES_VALUE"] = "row_matches_value";
    SUPPORTED_VALIDATORS["REGEX_MATCH"] = "regex_match";
    SUPPORTED_VALIDATORS["DATE_DIFF"] = "date_diff";
    SUPPORTED_VALIDATORS["DATE_FIELD_DIFF"] = "date_field_diff";
    SUPPORTED_VALIDATORS["SAME_VALUE_FOR_ALL_ROWS"] = "same_value_for_all_rows";
    SUPPORTED_VALIDATORS["LINKED_FIELD"] = "linked_field";
})(SUPPORTED_VALIDATORS || (exports.SUPPORTED_VALIDATORS = SUPPORTED_VALIDATORS = {}));
var isOptionsValidator = function (prefix, rule) {
    if (rule.op !== SUPPORTED_VALIDATORS.OPTIONS)
        return "".concat(prefix, " is not a supported validation function, got ").concat(rule.op);
    if (!Array.isArray(rule.value))
        return "".concat(prefix, ".value must be an Array of numbers or strings, got ").concat(typeof rule.value);
    else if (rule.value.length === 0)
        return "".concat(prefix, ".value must be an Array of numbers of strings, got empty Array");
    for (var _i = 0, _a = rule.value; _i < _a.length; _i++) {
        var item = _a[_i];
        if (typeof item !== 'string' && typeof item !== "number")
            return "".concat(prefix, ".value must be an Array of number or strings, got ").concat(typeof item);
    }
    ;
};
exports.isOptionsValidator = isOptionsValidator;
var isRegexMatchValidator = function (prefix, rule) {
    if (rule.op !== SUPPORTED_VALIDATORS.REGEX_MATCH)
        return "".concat(prefix, " is not a supported validation function, got ").concat(rule.op);
    if (typeof rule.value !== "string" || rule.value.length === 0)
        return "".concat(prefix, ".value must be a non-empty string");
};
exports.isRegexMatchValidator = isRegexMatchValidator;
var isFieldTypeValidator = function (prefix, rule) {
    if (rule.op !== SUPPORTED_VALIDATORS.FIELD_TYPE)
        return "".concat(prefix, " is not a supported validation function, got ").concat(rule.op);
    if (typeof rule.value !== "string" || (rule.value !== "string" && rule.value !== "number"))
        return "".concat(prefix, ".value must be either \"number\" or \"string\"");
};
exports.isFieldTypeValidator = isFieldTypeValidator;
var isLanguageCheckValidator = function (prefix, rule) {
    if (rule.op !== SUPPORTED_VALIDATORS.LANGUAGE_CHECK)
        return "".concat(prefix, " is not a supported validation function, got ").concat(rule.op);
    if (typeof rule.value !== "string" || rule.value.length === 0)
        return "".concat(prefix, ".value must be a non-empty string");
};
exports.isLanguageCheckValidator = isLanguageCheckValidator;
var isMaxFieldLengthValidator = function (prefix, rule) {
    if (rule.op !== SUPPORTED_VALIDATORS.MAX_FIELD_LENGTH)
        return "".concat(prefix, " is not a supported validation function, got ").concat(rule.op);
    if (typeof rule.value !== "number")
        return "".concat(prefix, ".value must be a number");
};
exports.isMaxFieldLengthValidator = isMaxFieldLengthValidator;
var isMinFieldLengthValidator = function (prefix, rule) {
    if (rule.op !== SUPPORTED_VALIDATORS.MIN_FIELD_LENGTH)
        return "".concat(prefix, " is not a supported validation function, got ").concat(rule.op);
    if (typeof rule.value !== "number")
        return "".concat(prefix, ".value must be a number");
};
exports.isMinFieldLengthValidator = isMinFieldLengthValidator;
// TODO: connect this typeguard to the DATE_OPTS enum for {{currentYear}} etc. validation
var isMaxValueValidator = function (prefix, rule) {
    if (rule.op !== SUPPORTED_VALIDATORS.MAX_VALUE)
        return "".concat(prefix, " is not a supported validation function, got ").concat(rule.op);
    if (typeof rule.value !== "number" && typeof rule.value !== "string")
        return "".concat(prefix, ".value must be a number or supported datestring");
    if (typeof rule.value === "string" && !Object.values(max_value_1.DATE_OPTS).includes(rule.value))
        return "".concat(prefix, ".value must be a number or supported datestring");
};
exports.isMaxValueValidator = isMaxValueValidator;
var isMinValueValidator = function (prefix, rule) {
    if (rule.op !== SUPPORTED_VALIDATORS.MIN_VALUE)
        return "".concat(prefix, " is not a supported validation function, got ").concat(rule.op);
    if (typeof rule.value !== "number")
        return "".concat(prefix, ".value must be a number");
};
exports.isMinValueValidator = isMinValueValidator;
var isDateDiffValidator = function (prefix, rule) {
    if (rule.op !== SUPPORTED_VALIDATORS.DATE_DIFF)
        return "".concat(prefix, " is not a supported validation function, got ").concat(rule.op);
    if (typeof rule.value !== "string" || rule.value.length === 0)
        return "".concat(prefix, ".value must be a non-empty string");
};
exports.isDateDiffValidator = isDateDiffValidator;
var isSameValueForAllRowsValidator = function (prefix, rule) {
    if (rule.op !== SUPPORTED_VALIDATORS.SAME_VALUE_FOR_ALL_ROWS)
        return "".concat(prefix, " is not a supported validation function, got ").concat(rule.op);
};
exports.isSameValueForAllRowsValidator = isSameValueForAllRowsValidator;
var isLinkedFieldValidator = function (prefix, rule, sourceColumns) {
    if (rule.op !== SUPPORTED_VALIDATORS.LINKED_FIELD)
        return "".concat(prefix, " is not a supported validation function, got ").concat(rule.op);
    if (typeof rule.target !== "string" || rule.target.length === 0)
        return "".concat(prefix, ".target must be a non-empty string");
    if (sourceColumns && !sourceColumns.includes(rule.target))
        return "".concat(prefix, " does not have a corresponding [source] column");
};
exports.isLinkedFieldValidator = isLinkedFieldValidator;
var isDateFieldDiffValidator = function (prefix, rule, sourceColumns) {
    if (rule.op !== SUPPORTED_VALIDATORS.DATE_FIELD_DIFF)
        return "".concat(prefix, " is not a supported validation function, got ").concat(rule.op);
    if (typeof rule.value !== "string" || rule.value.length === 0)
        return "".concat(prefix, ".value must be a non-empty string");
    if (typeof rule.target !== "string" || rule.target.length === 0)
        return "".concat(prefix, ".target must be a non-empty string");
    if (sourceColumns && !sourceColumns.includes(rule.target))
        return "".concat(prefix, " does not have a corresponding [source] column");
};
exports.isDateFieldDiffValidator = isDateFieldDiffValidator;
