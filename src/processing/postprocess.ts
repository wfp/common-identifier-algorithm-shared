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

import * as openpgp from 'openpgp';
import { createReadStream, createWriteStream, readFileSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

import type { Config } from '../config/Config';

import Debug from 'debug';
const log = Debug('CID:postprocessFile');


export interface PostprocessFileResult {
  encryptedFilePath?: string
}

interface PostprocessFileInput {
  config: Config.FileConfiguration,
  filePath: string
}

export async function postprocessFile({ config, filePath }: PostprocessFileInput): Promise<PostprocessFileResult> {
  log('------------ postprocessFile -----------------');
  let encryptedFilePath: string | undefined;

  if (!config.post_processing) return {}

  if (config.post_processing.encryption) {
    encryptedFilePath = await encryptFile({
      filePath: filePath,
      keyPath: config.post_processing.encryption.key_path
    });
  }

  return {
    encryptedFilePath
  }
}


type EncryptFileInput = {
  filePath: string;
  keyPath: string;
}
export async function encryptFile({ filePath, keyPath }: EncryptFileInput) {
  const publicKeyArmoured = readFileSync(keyPath, "utf-8");
  const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmoured });

  const webStream  = Readable.toWeb(createReadStream(filePath));

  const encryptionStream = await openpgp.encrypt({
    message: await openpgp.createMessage({ binary: webStream }),
    encryptionKeys: publicKey,
    format: "binary"
  });

  const outputPath = `${filePath}.gpg`;

  const nodeWritable = createWriteStream(outputPath);
  const nodeReadable = Readable.fromWeb(encryptionStream);

  await pipeline(nodeReadable, nodeWritable);

  return outputPath;
}
