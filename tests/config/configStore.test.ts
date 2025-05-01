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

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import toml from 'toml';
import { makeConfigStore } from '../../src/config/configStore';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONFIG_FILE_NAME = 'test-config.json';
const BACKUP_CONFIG_FILE_NAME = 'test-config.backup.toml';
const APP_CONFIG_FILE_NAME = 'test-appconfig.json';

function makeTestConfig(basePath: string) {
  return {
    filePaths: {
      config: join(basePath, CONFIG_FILE_NAME),
      backupConfig: join(basePath, BACKUP_CONFIG_FILE_NAME),
      appConfig: join(basePath, APP_CONFIG_FILE_NAME),
    },
    region: 'ANY',
    usingUI: false
  };
}

function placeTestConfigFiles(basePathPrefix: string) {
  const fromPath = join(__dirname, 'files');
  const basePath = fs.mkdtempSync(join(os.tmpdir(), basePathPrefix));

  const cp = (n: string) => fs.copyFileSync(join(fromPath, n), join(basePath, n));
  [CONFIG_FILE_NAME, BACKUP_CONFIG_FILE_NAME, APP_CONFIG_FILE_NAME].forEach(cp);

  return basePath;
}

test('ConfigStore loading', () => {
  const basePath = placeTestConfigFiles('ConfigStore-normal');

  const c = makeConfigStore(makeTestConfig(basePath));

  c.boot();

  expect(c.isUsingBackupConfig).toEqual(false);
  expect(c.isValid).toEqual(true);

  const config = Object.assign({}, c.getConfig());

  expect(config.meta.region).toEqual('ANY');
  expect(config.meta.version).toEqual('0.1.0');

  expect(config.algorithm.salt.source).toEqual('STRING');

  config.algorithm.salt.source = "STRING"
  config.algorithm.salt.value = "QWERTY"

  const originalConfig = JSON.parse(fs.readFileSync(join(__dirname, 'files', CONFIG_FILE_NAME), 'utf-8'));
  // check that the columns are actually sorted alphabetically.
  originalConfig.algorithm.columns.process = ['col_a', 'col_b', 'col_c', 'col_d', 'col_e'];
  originalConfig.algorithm.columns.reference = ['col_1', 'col_2', 'col_3'];

  originalConfig.algorithm.salt.source = "STRING"
  originalConfig.algorithm.salt.value = "QWERTY"

  expect(config).toEqual(originalConfig);
});

test('ConfigStore backup loading', () => {
  const basePath = placeTestConfigFiles('ConfigStore-backup');
  fs.unlinkSync(join(basePath, CONFIG_FILE_NAME));

  const c = makeConfigStore(makeTestConfig(basePath));

  c.boot();

  expect(c.isUsingBackupConfig).toEqual(true);
  expect(c.isValid).toEqual(true);

  const config = Object.assign({}, c.getConfig());

  expect(config.isBackup).toEqual(true);
  expect(config.algorithm.salt.source).toEqual('STRING');

  delete config.isBackup;
  config.algorithm.salt.source = "STRING"
  config.algorithm.salt.value = "QWERTY"

  const originalConfig = toml.parse(
    fs.readFileSync(join(__dirname, 'files', BACKUP_CONFIG_FILE_NAME), 'utf-8'),
  );
  // check that the columns are actually sorted alphabetically.
  originalConfig.algorithm.columns.process = ['col_a', 'col_b', 'col_c', 'col_d', 'col_e'];
  originalConfig.algorithm.columns.reference = ['col_1', 'col_2', 'col_3'];

  originalConfig.algorithm.salt.source = "STRING"
  originalConfig.algorithm.salt.value = "QWERTY"

  expect(config).toEqual(originalConfig);
});

test('ConfigStore error loading', () => {
  const basePath = placeTestConfigFiles('ConfigStore-error');
  fs.unlinkSync(join(basePath, CONFIG_FILE_NAME));
  fs.unlinkSync(join(basePath, BACKUP_CONFIG_FILE_NAME));

  const c = makeConfigStore(makeTestConfig(basePath));

  c.boot();

  expect(c.isUsingBackupConfig).toEqual(false);
  expect(c.isValid).toEqual(false);

  const config = Object.assign({}, c.getConfig());
  expect(config).toEqual({});
});

////////////////////////////////////////////////////////////////////////////////

test('ConfigStore saving and loading user config', () => {
  const basePath = placeTestConfigFiles('ConfigStore-saving-user-config');
  fs.unlinkSync(join(basePath, CONFIG_FILE_NAME));
  // fs.unlinkSync(join(basePath, BACKUP_CONFIG_FILE_NAME));

  const c = makeConfigStore(makeTestConfig(basePath));

  c.boot();
  expect(c.isUsingBackupConfig).toEqual(true);

  // updating user config
  {
    // OK
    expect(fs.existsSync(join(basePath, CONFIG_FILE_NAME))).toEqual(false);
    expect(c.updateUserConfig(join(basePath, BACKUP_CONFIG_FILE_NAME))).toEqual(undefined);
    expect(fs.existsSync(join(basePath, CONFIG_FILE_NAME))).toEqual(true);

    expect(c.isUsingBackupConfig).toEqual(false);
    expect(c.isValid).toEqual(true);

    const config = Object.assign({}, c.getConfig());
    expect(config.meta.region).toEqual('ANY');

    // ERROR
    const errResult = c.updateUserConfig(join(basePath, 'config.xxx.toml'));
    expect(typeof errResult).toEqual('string');

    expect(c.isUsingBackupConfig).toEqual(false);
    expect(c.isValid).toEqual(true);
  }
  // removing user config
  {
    expect(fs.existsSync(join(basePath, CONFIG_FILE_NAME))).toEqual(true);
    expect(c.removeUserConfig()).toEqual(undefined);
    expect(fs.existsSync(join(basePath, CONFIG_FILE_NAME))).toEqual(false);

    expect(c.isUsingBackupConfig).toEqual(true);
    expect(c.isValid).toEqual(true);

    // already using a backup, not able to remove, but not fail
    expect(c.removeUserConfig()).toEqual(undefined);

    expect(c.isUsingBackupConfig).toEqual(true);
    expect(c.isValid).toEqual(true);

    // load the config back
    expect(c.updateUserConfig(join(basePath, BACKUP_CONFIG_FILE_NAME))).toEqual(undefined);

    // remove the backup
    fs.unlinkSync(join(basePath, BACKUP_CONFIG_FILE_NAME));

    // check if we have an error on removal
    expect(typeof c.removeUserConfig()).toEqual('string');

    // yet keep the existing config
    expect(c.isValid).toEqual(true);
  }
});

test('ConfigStore app config TnS', () => {
  const basePath = placeTestConfigFiles('ConfigStore-appconfig');

  {
    const c = makeConfigStore(makeTestConfig(basePath));
    c.boot();

    expect(c.hasAcceptedTermsAndConditions()).toEqual(false);
    c.acceptTermsAndConditions();
    expect(c.hasAcceptedTermsAndConditions()).toEqual(true);
  }
  // should keep between instantiations
  {
    const c = makeConfigStore(makeTestConfig(basePath));
    c.boot();

    expect(c.hasAcceptedTermsAndConditions()).toEqual(true);
  }
});
