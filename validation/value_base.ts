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


import { Config } from '../config/Config.js';
import { ValidatorBase } from './base.js';
import { SUPPORTED_VALIDATORS } from './Validation.js';

// A base validator class that takes a predicate (that returns true / false for
// a value) and wraps it up in a validator
class ValueValidatorBase extends ValidatorBase {
    predicate: CallableFunction;
    _defaultMessage: string;
    constructor(name: SUPPORTED_VALIDATORS, defaultMessage: string, predicate: CallableFunction, opts: Config.ColumnValidation) {
        super(name, opts);
        this.predicate = predicate;
        this._defaultMessage = defaultMessage;
    }

    // the default message
    defaultMessage() {
        return this._defaultMessage;
    }

    validate(value: any) {
        return this.predicate(value) ? this.success() : this.fail();
    }

}

// Factory function that takes a predicate and creates a validator out of it
export function makeValueValidator(name: SUPPORTED_VALIDATORS, defaultMessage: string, predicate: CallableFunction, opts: Config.ColumnValidation) {
    return new ValueValidatorBase(name, defaultMessage, predicate, opts);
}