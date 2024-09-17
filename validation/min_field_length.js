const ValidatorBase = require('./base');

const KIND_MINFIELDLENGTH = "minFieldLength"


class MinFieldLengthValidator extends ValidatorBase {
    constructor(minLen, opts) {
        super(KIND_MINFIELDLENGTH, opts)
        this.minLen = minLen;
    }

    // the default message
    defaultMessage() {
        return `must be longer than ${this.minLen} digits / characters`;
    }

    validate(value) {
        // must be a string
        if (typeof value !== 'string') {
            if (typeof value === 'number') {
                value = value.toString();
            } else {
                return this.failWith("must be text or a number");
            }
        }

        return value.length < this.minLen ? this.fail() : this.success();
    }

}

// Factory function for the MinFieldLengthValidator
function makeMinFieldLengthValidator(opts) {
    let minLen = opts.value;

    // check if there is a regexp value
    if (typeof minLen !== 'number') {
        throw new Error(`MinFieldLength validator must have a 'value' with number -- ${JSON.stringify(opts)}`)
    }

    // return a new validator
    return new MinFieldLengthValidator(minLen, opts);
}

// export the factory function
module.exports = makeMinFieldLengthValidator;