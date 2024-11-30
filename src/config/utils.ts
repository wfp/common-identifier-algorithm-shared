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
import os from 'node:os';
import path from 'node:path';
import toml from 'toml';
import type { Config } from './Config.js';

// Tries to read the file data, returns null if unsuccessful
export function attemptToReadFileData(filePath: string, encoding: fs.EncodingOption = 'utf-8') {
  try {
    return fs.readFileSync(filePath, encoding) as string;
  } catch (e) {
    return null;
  }
}

// Tries to read the file data decoded from TOML, returns null if unsuccessful
export function attemptToReadTOMLData<T>(filePath: string, encoding: fs.EncodingOption): T | null {
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

// takes into consideration the platform and the type of value provided by the config
// to return an actual, absolute salt file path
export function getSaltFilePath(saltValueConfig: Config.Options['algorithm']['salt']['value']) {
  // if the value is a string always use it
  if (typeof saltValueConfig === 'string') return saltValueConfig;

  // no salt path means the config does not have our platform
  /* istanbul ignore next */
  if (process.platform in saltValueConfig === false) {
    throw new Error(`Unsupported platform for salt file location: ${process.platform}`);
  }
  const platform = process.platform as keyof typeof saltValueConfig;
  const platformSaltPath = saltValueConfig[platform];

  if (!platformSaltPath) throw new Error(`Salt path not provided for platform: ${process.platform}`);

  // token replacement
  return path.resolve(
    platformSaltPath.replaceAll('$HOME', os.homedir()).replaceAll('$APPDATA', appDataLocation()),
  );
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
