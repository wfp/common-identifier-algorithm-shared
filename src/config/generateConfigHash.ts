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

import stableStringify from 'safe-stable-stringify';
import { createHash } from 'node:crypto';
import type { Config } from './Config.js';

const DEFAULT_HASH_TYPE = "md5";
const HASH_DIGEST_TYPE = "hex";

// Takes a config, removes the "signature" and salt keys from it, generates
// a stable JSON representation and hashes it using the provided algorithm
export function generateConfigHash(config: Config.Options, hashType=DEFAULT_HASH_TYPE) {
    // create a nested copy of the object
    const configCopy = JSON.parse(JSON.stringify(config));;

    // remove the "signature" key
    delete configCopy.signature;

    // remove the "messages" key
    // TODO: messages should go in a separate locales file to future proof translations
    delete configCopy.messages;

    // remove the "algorithm.salt" part as it may have injected keys
    // TODO: this enables messing with the salt file path pre-injection without signature validations, but is required for compatibility w/ the injection workflow
    delete configCopy.algorithm.salt.value;
    // mock the salt source as STRING to ensure that both imported and saved
    // (with pre-injected salt) config files work
    configCopy.algorithm.salt.source = "STRING";

    // generate a stable JSON representation
    const stableJson = stableStringify(configCopy);
    if (typeof stableJson !== "string") throw new Error(`Unable to serialise config object to JSON.`)

    // generate the hash
    const hash = createHash(hashType).update(stableJson).digest(HASH_DIGEST_TYPE);

    return hash;
}