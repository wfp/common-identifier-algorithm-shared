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

import crypto from 'node:crypto';
// USCADI uses RFC4648 base32 -- NodeJs has no default implementation for that
import base32 from 'hi-base32';
import type { Config } from '../config/Config.js';
import type { Validation } from '../validation/Validation.js';

export type makeHasherFunction = (config: Config.Options["algorithm"]) => BaseHasher;

export abstract class BaseHasher {
    config: Config.Options["algorithm"];
    saltValue: Config.Options["algorithm"]["salt"]["value"];

    constructor(config: Config.Options["algorithm"]) {
        this.config = config;

        // at this point the salt data should be injected into the config
        if (config.salt.source.toLowerCase() !== 'string') {
            throw new Error("only embedded salt values supported for hashing -- import & save the config if file support is desired here");
        }

        // load the salt value based on the config
        this.saltValue = config.salt.value;
    }


    // Generates a hash based on the configuration from an already concatenated string
    // TODO: pass full algo config if SCRYPT or other more parameterized hash is used
    generateHashForValue(stringValue: string, algorithm: string ='sha256') {
        let hashDigest = crypto.createHash(algorithm).update(this.saltValue as string).update(stringValue).digest();
        return base32.encode(hashDigest);
    }

    abstract generateHashForObject(obj: Validation.Data["row"]): { [key: string]: string };
}