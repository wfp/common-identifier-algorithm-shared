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

const crypto = require('node:crypto');
// USCADI uses RFC4648 base32 -- NodeJs has no default implementation for that
const base32 = require('hi-base32');




class BaseHasher {
    constructor(config) {
        this.config = config;

        // at this point the salt data should be injected into the config
        if (config.salt.source.toLowerCase() !== 'string') {
            throw new Error("only embedded salt values supported for hashing -- import & save the config if file support is desired here");
        }

        // load the salt value based on the config
        this.saltValue = config.salt.value;
        // this.saltValue = (config.salt.source.toLowerCase() === 'file') ?
        //     // importSaltFile(config.salt.value) :
        //     loadSaltFile(config.salt.value) :
        //     config.salt.value;
    }


    // Generates a hash based on the configuration from an already concatenated string
    // TODO: pass full algo config if SCRYPT or other more parameterized hash is used
    generateHash(stringValue, algorithm='sha256') {
        let hashDigest = crypto.createHash(algorithm).update(this.saltValue).update(stringValue).digest();
        return base32.encode(hashDigest);
    }

    generateHashForExtractedObject(extractedObj) {
        throw new Error("Hasher::generateHashForExtractedObject(obj) not implemented!")
    }
}

module.exports = BaseHasher