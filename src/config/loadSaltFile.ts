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
import fs from 'node:fs';
import path from 'node:path';
import Debug from 'debug';
const log = Debug('CID:loadSaltFile');

import { getSaltFilePath, attemptToReadFileData } from './utils.js';
import { Config } from './Config.js';

// the encoding used for the salt file
const SALT_FILE_ENCODING: fs.EncodingOption = 'utf-8';

// The default salt validator regexp, used for testing
const DEFAULT_VALIDATOR_REGEXP: RegExp =
  /-----BEGIN PGP PUBLIC KEY BLOCK-----[A-Za-z0-9+/=\s]+-----END PGP PUBLIC KEY BLOCK-----/;

// Attempts to load and clean up the salt file data
export function loadSaltFile(
  saltFilePath: Config.Options['algorithm']['salt']['value'],
  validatorRegexp = DEFAULT_VALIDATOR_REGEXP,
) {
  // resolve the salt file path from the config & platform
  const fullSaltFilePath = getSaltFilePath(saltFilePath);

  log('Attempting to load salt file from ', path.resolve(fullSaltFilePath));
  // return null;
  // TODO: potentially clean up line endings and whitespace here
  const saltData = attemptToReadFileData(fullSaltFilePath, SALT_FILE_ENCODING);
  if (!saltData) return null;

  // check if the structure is correct for the file
  // /-----BEGIN PGP PUBLIC KEY BLOCK-----[A-Za-z0-9+/=\s]+-----END PGP PUBLIC KEY BLOCK-----/
  const CHECK_RX = new RegExp(validatorRegexp);

  if (!CHECK_RX.test(saltData)) {
    log('SALT FILE Regexp error');
    return null;
  }

  log('SALT FILE looks OK');
  return saltData;
}
