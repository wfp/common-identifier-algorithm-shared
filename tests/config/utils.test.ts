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
import { dirname, join } from 'node:path';
import { attemptToReadTOMLData } from '../../src/config/utils.js';
import type { Config } from '../../src/config/Config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('utils::attemptToReadTomlData', () => {
  let filePath = join(__dirname, 'files', 'test.salt');
  expect(attemptToReadTOMLData<Config.Options>(filePath, 'utf-8')).toBeNull();
});
