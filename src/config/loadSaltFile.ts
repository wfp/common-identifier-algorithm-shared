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
import { attemptToReadFileData } from './utils';

// the encoding used for the salt file
const SALT_FILE_ENCODING: fs.EncodingOption = 'utf-8';

// The default salt validator regexp, used for testing
const DEFAULT_VALIDATOR_REGEXP: RegExp =
  /-----BEGIN PGP PUBLIC KEY BLOCK-----[A-Za-z0-9+/=\s]+-----END PGP PUBLIC KEY BLOCK-----/;

interface LoadSaltFileInput {
  saltFilePath: string;
  validatorRegexp?: RegExp;
}

type LoadSaltFileOutput = { success: true; data: string; message?: string } | { success: false; data?: never, message: string; }

// Attempts to load and clean up the salt file data
export function loadSaltFile({ saltFilePath, validatorRegexp = DEFAULT_VALIDATOR_REGEXP }: LoadSaltFileInput): LoadSaltFileOutput {

  // TODO: potentially clean up line endings and whitespace here
  const buf = attemptToReadFileData(saltFilePath, SALT_FILE_ENCODING);
  if (!buf) return { success: false, message: `[ERROR] Unable to read salt file at path: ${saltFilePath}` };
  
  const saltData = buf.toString().replace(/\r\n/g, "\n");
  
  // check if the structure is correct for the file
  const CHECK_RX = new RegExp(validatorRegexp);
  if (!CHECK_RX.test(saltData)) {
    return { success: false, message: `[ERROR] Salt file failed validator regexp check at path: ${saltFilePath}, with regexp: ${validatorRegexp}` };
  }

  return { success: true, data: saltData, message: `[INFO] Successfully loaded salt file from ${saltFilePath}` };
}
