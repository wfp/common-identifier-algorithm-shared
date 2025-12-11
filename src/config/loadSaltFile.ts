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
import fs from 'node:fs';
import path from 'node:path';
import Debug from 'debug';
const log = Debug('CID:loadSaltFile');

import { attemptToReadFileData } from './utils';
import type { Config } from './Config';

// the encoding used for the salt file
const SALT_FILE_ENCODING: fs.EncodingOption = 'utf-8';

// The default salt validator regexp, used for testing
const DEFAULT_VALIDATOR_REGEXP: RegExp =
  /-----BEGIN PGP PUBLIC KEY BLOCK-----[A-Za-z0-9+/=\s]+-----END PGP PUBLIC KEY BLOCK-----/;

interface LoadSaltFileInput {
  saltFilePath: string;
  validatorRegexp?: RegExp;
}

// Attempts to load and clean up the salt file data
export function loadSaltFile({ saltFilePath, validatorRegexp = DEFAULT_VALIDATOR_REGEXP }: LoadSaltFileInput) {
  log('Attempting to load salt file from ', path.resolve(saltFilePath));

  // TODO: potentially clean up line endings and whitespace here
  const saltData = attemptToReadFileData(saltFilePath, SALT_FILE_ENCODING);
  if (!saltData) return null;

  // check if the structure is correct for the file
  const CHECK_RX = new RegExp(validatorRegexp);

  if (!CHECK_RX.test(saltData)) {
    log('SALT FILE Regexp error');
    return null;
  }

  log('SALT FILE looks OK');
  return saltData;
}
