"use strict";
// Common Identifier Application
// Copyright (C) 2024 World Food Programme
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaxValueValidator = exports.DATE_OPTS = void 0;
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
var Validation_1 = require("../Validation");
var DATE_OPTS;
(function (DATE_OPTS) {
    DATE_OPTS["CURRENT_YEAR"] = "{{currentYear}}";
    DATE_OPTS["CURRENT_MONTH"] = "{{currentMonth}}";
})(DATE_OPTS || (exports.DATE_OPTS = DATE_OPTS = {}));
var MaxValueValidator = /** @class */ (function () {
    function MaxValueValidator(opts) {
        var _this = this;
        this.kind = Validation_1.SUPPORTED_VALIDATORS.MAX_VALUE;
        this.message = function (msg) {
            return _this.opts.message ? _this.opts.message : msg ? msg : "must be at most ".concat(_this.maxValue);
        };
        this.validate = function (value) {
            if (typeof value !== 'string' && typeof value !== 'number') {
                return {
                    ok: false,
                    kind: _this.kind,
                    message: 'must be text or a number',
                };
            }
            var numericValue = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(numericValue))
                return {
                    ok: false,
                    kind: _this.kind,
                    message: 'must be text or a number',
                };
            if (numericValue <= _this.maxValue)
                return { ok: true, kind: _this.kind };
            return { ok: false, kind: _this.kind, message: _this.message() };
        };
        // validate if string, {{currentYear}}
        var maxValue = opts.value;
        if (Object.values(DATE_OPTS).includes(maxValue)) {
            switch (maxValue) {
                case DATE_OPTS.CURRENT_YEAR:
                    maxValue = new Date().getUTCFullYear();
                    break;
                case DATE_OPTS.CURRENT_MONTH:
                    maxValue = new Date().getUTCMonth() + 1;
                    break; // +1 since getUTCMonth is zero-indexed
            }
        }
        if (typeof maxValue !== 'number') {
            throw new Error("MaxValue validator must have a 'value' with a number or a valid date string -- ".concat(JSON.stringify(opts)));
        }
        this.opts = opts;
        this.maxValue = maxValue;
    }
    return MaxValueValidator;
}());
exports.MaxValueValidator = MaxValueValidator;
