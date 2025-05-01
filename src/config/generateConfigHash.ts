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

import stableStringify from 'safe-stable-stringify';
import { createHash } from 'node:crypto';
import type { Config } from './Config';

const DEFAULT_HASH_TYPE = 'md5';
const HASH_DIGEST_TYPE = 'hex';

type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> };

// Takes a config, removes the "signature" and salt keys from it, generates
// a stable JSON representation and hashes it using the provided algorithm
export function generateConfigHash<T extends Config.CoreConfiguration>(config: T, hashType = DEFAULT_HASH_TYPE) {
  // create a nested copy of the object
  const configCopy = { ...(JSON.parse(JSON.stringify(config)) as RecursivePartial<T>) };

  // remove the "signature" key
  if (configCopy.meta && "signature" in configCopy.meta) {
    delete configCopy.meta.signature;
  }

  // remove the "messages" key
  // TODO: messages should go in a separate locales file to future proof translations
  if ("messages" in configCopy) {
    delete configCopy.messages;
  }

  // remove the "algorithm.salt" part as it may have injected keys
  // TODO: this enables messing with the salt file path pre-injection without signature validations, but is required for compatibility w/ the injection workflow
  delete configCopy.algorithm!.salt!.value;
  // mock the salt source as STRING to ensure that both imported and saved
  // (with pre-injected salt) config files work
  configCopy.algorithm!.salt!.source = 'STRING';

  // generate a stable JSON representation
  const stableJson = stableStringify(configCopy);
  if (typeof stableJson !== 'string') throw new Error(`Unable to serialise config object to JSON.`);

  // generate the hash
  const hash = createHash(hashType).update(stableJson).digest(HASH_DIGEST_TYPE);

  return hash;
}
