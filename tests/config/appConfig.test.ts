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
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { loadAppConfig, saveAppConfig, DEFAULT_APP_CONFIG } from '../../src/config/appConfig';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('appConfig load', () => {
  const PATH = join(__dirname, 'files', 'test-appconfig.json');
  expect(loadAppConfig(PATH)).toEqual(JSON.parse(readFileSync(PATH, 'utf-8')));

  expect(loadAppConfig('Some invalid path')).toEqual(DEFAULT_APP_CONFIG);

  expect(loadAppConfig(join(__dirname, 'files', 'test-config.json'))).toEqual(DEFAULT_APP_CONFIG);
});

test('appConfig save', () => {
  const cfg = Object.assign({}, DEFAULT_APP_CONFIG) as any;
  cfg.test = 'SOME TEST';

  const PATH = join(tmpdir(), 'test-appconfig.json');
  saveAppConfig(cfg, PATH);
  expect(JSON.parse(readFileSync(PATH, 'utf-8'))).toEqual(cfg);
});
