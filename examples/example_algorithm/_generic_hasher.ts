// Common Identifier Application
// Copyright (C) 2024 World Food Programme

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

import { joinFieldsForHash, cleanValueList, extractAlgoColumnsFromObject, BaseHasher } from 'common-identifier-algorithm-shared';
import type { Config, Validator, makeHasherFunction } from 'common-identifier-algorithm-shared';

class GenericHasher extends BaseHasher {
    constructor(config: Config.CoreConfiguration["algorithm"]) {
        super(config);
    }

    private composeHashSource = (extractedObj: Config.AlgorithmColumns) => {
        let staticValues = extractedObj.static;
        let concatenated = joinFieldsForHash(cleanValueList(staticValues));
        return concatenated;
    }

    generateHashForObject(obj: Validator.InputData["row"]) {
        const extractedObj = extractAlgoColumnsFromObject(this.config.columns, obj);
        const toBeHashed = this.composeHashSource(extractedObj);
        return {
            hashed_id: toBeHashed.length > 0 ? this.generateHashForValue(toBeHashed) : "",
        }
    }
}

export const ALGORITHM_ID = "ANY";
export const makeHasher: makeHasherFunction = (config: Config.CoreConfiguration["algorithm"]) => {
    switch (config.hash.strategy.toLowerCase()) {
        case 'sha256':
            return new GenericHasher(config);
        default:
            throw new Error(`Unknown hash strategy in config: '${config.hash.strategy}'`);
    }
}