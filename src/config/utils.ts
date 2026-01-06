/* ************************************************************************
*  Common Identifier Application
*  Copyright (C) 2026  World Food Programme
*  
*  This program is free software: you can redistribute it and/or modify
*  it under the terms of the GNU Affero General Public License as published by
*  the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
*  
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU Affero General Public License for more details.
*  
*  You should have received a copy of the GNU Affero General Public License
*  along with this program.  If not, see <http://www.gnu.org/licenses/>.
************************************************************************ */

import fs from 'node:fs';
import toml from 'toml';
import { createHash } from 'node:crypto';
import stableStringify from 'safe-stable-stringify';

import type { Config } from './Config';


// Tries to read the file data, returns null if unsuccessful
export function attemptToReadFileData(filePath: string, encoding: fs.EncodingOption = 'utf-8') {
  try {
    return fs.readFileSync(filePath, encoding) as string;
  } catch (e) {
    return null;
  }
}

// Tries to read the file data decoded from TOML, returns null if unsuccessful
export function attemptToReadTOMLData<T>(filePath: string, encoding: fs.EncodingOption="utf-8"): T | null {
  try {
    const fileData = fs.readFileSync(filePath, encoding) as string;

    // handle TOML
    if (filePath.toLowerCase().endsWith('.toml')) {
      // TODO: better error handling for toml parsing (i.e. unsupported mixed array types)
      return toml.parse(fileData);
    }

    // handle JSON
    if (filePath.toLowerCase().endsWith('.json')) {
      return JSON.parse(fileData);
    }

    // unknown enxtension
    return null;
  } catch (e) {
    return null;
  }
}

// Returns the prefered Application Data storage location based on the operating system
export function appDataLocation() {
  switch (process.platform) {
    case 'win32':
      return process.env.APPDATA as string;
    case 'darwin':
      return process.env.HOME + '/Library/Preferences';
    case 'linux':
      return process.env.HOME + '/.local/share';
    default:
      throw new Error(`Unsupported platform for salt file location: ${process.platform}`);
  }
}

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

  // generate a stable JSON representation
  const stableJson = stableStringify(configCopy);
  if (typeof stableJson !== 'string') throw new Error(`Unable to serialise config object to JSON.`);

  // generate the hash
  const hash = createHash(hashType).update(stableJson).digest(HASH_DIGEST_TYPE);

  return hash;
}