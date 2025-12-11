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

import type { Config } from '../config/Config';

import Debug from 'debug';
const log = Debug('CID:postprocessFile');


export interface PostprocessFileResult {}

interface PostprocessFileInput {
  config: Config.FileConfiguration,
  filePath: string
}

export async function postprocessFile({ config, filePath }: PostprocessFileInput): Promise<PostprocessFileResult> {
  log('------------ postprocessFile -----------------');

  if (!config.post_processing) return {}

  return {}
}
