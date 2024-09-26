
const dateFns = require("date-fns");

// the default format string
const DEFAULT_FORMAT_STR = "yyyyMMdd"

function parseDateDiff(dateDiffStr) {

    // figure out the range type
    let key = null;

    if (dateDiffStr.endsWith('M')) key = 'months';
    if (dateDiffStr.endsWith('Y')) key = 'years';
    if (dateDiffStr.endsWith('d')) key = 'days';

    if (!key) {
        return null;
    }

    // if there is a range parse the integer count
    const parsedInt = parseInt(dateDiffStr.substring(0, dateDiffStr.length - 1));

    // combine into a date-fn.sub() compatible format
    return { [key]: parsedInt, isPositive: (parsedInt >= 0), _key: key, _value: parsedInt }

}

function isValidDateDiff(dateDiffString) {
    const dateDiff = parseDateDiff(dateDiffString);
    return dateDiff;
}

function attemptToParseDate(value) {
    // check for emptyness / falseness
    if (!value) {
        return;
    }
    // numbers need to be converted to string for more success
    if (typeof value !== 'string') {
        value = value.toString();
    }
    return dateFns.parse(value, DEFAULT_FORMAT_STR, new Date() );
    // TODO: implement me
    return new Date();
}

function formatDateWithDefaultFormat(v) {
    // empty values get empty strings
    if (!v) {
        return '';
    }

    // check if v is a date object
    if (typeof v.getMonth !== 'function') {
        return '';
    }

    return dateFns.formatDate(v, DEFAULT_FORMAT_STR);

}

function isDateInRange(diff, value, originDate=new Date()) {

    const targetDate = dateFns.add(originDate, diff);
    const compareResult = dateFns.compareAsc(targetDate, value);

    // if the diff is positive the value must be before now + diff
    if (diff.isPositive) {
        // returns 1 if LEFT is after RIGHT
        return compareResult >= 0;
    } else {
        // returns 1 if LEFT is after RIGHT
        return compareResult <= 0;
    }
}

module.exports = {
    parseDateDiff,
    isValidDateDiff,
    attemptToParseDate,
    formatDateWithDefaultFormat,
    isDateInRange,
}