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
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { attemptToReadTOMLData, getSaltFilePath } from '../../config/utils.js';
import type { Config } from '../../config/Config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('utils::attemptToReadTomlData', () => {
  let filePath = join(__dirname, 'files', 'test.salt');
  expect(attemptToReadTOMLData<Config.Options>(filePath, 'utf-8')).toBeNull();
});
