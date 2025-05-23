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

import crypto from 'node:crypto';
// USCADI uses RFC4648 base32 -- NodeJs has no default implementation for that
import base32 from 'hi-base32';
import type { Config } from '../config/Config';
import type { Validator } from '../validation/Validation';

export type makeHasherFunction = (config: Config.CoreConfiguration['algorithm']) => BaseHasher;

export abstract class BaseHasher {
  config: Config.CoreConfiguration['algorithm'];
  saltValue: Config.CoreConfiguration['algorithm']['salt']['value'];

  constructor(config: Config.CoreConfiguration['algorithm']) {
    this.config = config;

    // at this point the salt data should be injected into the config
    if (config.salt.source.toLowerCase() !== 'string') {
      throw new Error(
        'only embedded salt values supported for hashing -- import & save the config if file support is desired here',
      );
    }

    // load the salt value based on the config
    this.saltValue = config.salt.value;
  }

  // Generates a hash based on the configuration from an already concatenated string
  // TODO: pass full algo config if SCRYPT or other more parameterized hash is used
  generateHashForValue(stringValue: string, algorithm: string = 'sha256') {
    let hashDigest = crypto
      .createHash(algorithm)
      .update(this.saltValue as string)
      .update(stringValue)
      .digest();
    return base32.encode(hashDigest);
  }

  abstract generateHashForObject(obj: Validator.InputData['row']): {
    [key: string]: string;
  };
}
