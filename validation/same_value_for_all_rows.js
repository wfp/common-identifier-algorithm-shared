const ValidatorBase = require('./base');

const KIND_SAME_VALUE_FOR_ALL_ROWS = "same_value_for_all_rows"


class SameValueForAllRowsValidator extends ValidatorBase {
    constructor(opts) {
        super(KIND_SAME_VALUE_FOR_ALL_ROWS, opts);
    }

    // the default message
    defaultMessage() {
        return `must be identical for all items in the file`;
    }

    validate(value, {row, sheet, column}) {
        // console.log("SameValueForAllRowsValidator ===> ", value,  {row, sheet, column})

        // if this validation function is called there is at least one row of data
        // in the sheet, so we dont need to check for that

        // get the value in the first row
        const targetValue = sheet.data[0][column];

        // check if it matches the current value
        // return value == targetValue ? this.success() : this.failWith(`must be '${targetValue}'`)
        return value == targetValue ? this.success() : this.fail();
    }

}

// Factory function for the SameValueForAllRowsValidator
function makeSameValueForAllRowsValidator(opts) {

    // return a new validator
    return new SameValueForAllRowsValidator(opts);
}

// export the factory function
module.exports = makeSameValueForAllRowsValidator;