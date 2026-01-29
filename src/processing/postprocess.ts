/* ************************************************************************
*  Common Identifier Application
*  Copyright (C) 2026  World Food Programme
*  
*  This program is free software: you can redistribute it and/or modify
*  it under the terms of the GNU Affero General Public License as published by
*  the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
*  
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU Affero General Public License for more details.
*  
*  You should have received a copy of the GNU Affero General Public License
*  along with this program.  If not, see <http://www.gnu.org/licenses/>.
************************************************************************ */

import { GpgWrapper } from '../crypto/gpg';
import type { Config } from '../config/Config';

import Debug from 'debug';
const log = Debug('cid::engine::process::postprocess');

const enum POSTPROCESSING_STEP {
  ENCRYPTION = 'ENCRYPTION',
}

type StepPassed = {
  success: true;
  step: POSTPROCESSING_STEP;
  outputPath?: string;
};

type StepFailed = {
  success: false;
  step: POSTPROCESSING_STEP;
  error: string;
};


export interface PostprocessFileResult {
  success: boolean;
  steps: (StepPassed | StepFailed)[];
  outputPath?: string;
}

interface PostprocessFileInput {
  config: Config.FileConfiguration;
  inputPath: string;
  outputPath: string;
  options?: {
    // options for postprocessing params that are not included in the config file
    signer?: string;
  }
}

export async function postprocessFile({ config, inputPath, outputPath, options }: PostprocessFileInput): Promise<PostprocessFileResult> {
  log(`[INFO] Starting postprocessing of file '${inputPath}' with config file '${config.meta.signature}'`);

  const result: PostprocessFileResult = { success: true, steps: [] };

  if (!config.post_processing) {
    log("[INFO] No postprocessing steps configured, skipping.");
    return result;
  }

  if (config.post_processing.encryption) {
    log(`[INFO] Encryption postprocessing step configured, starting encryption of file '${inputPath}'`);
    log(`Encryption config: ${JSON.stringify(config.post_processing.encryption)}`);
    const gpg = new GpgWrapper({
      trustAlways: true,
      binaryPathOverride: config.post_processing.encryption.gpgBinaryPath,
      timeoutMs: 60_000,
      verifyKeys: true
    });

    const encryptResult = await gpg.encryptFile({
      inputPath: inputPath,
      outputPath: outputPath,
      recipients: [config.post_processing.encryption.recipient, options?.signer].filter((r): r is string => !!r),
      signer: options?.signer,
    });

    if (!encryptResult.success) {
      log(`[ERROR] Encryption failed: ${encryptResult.error} (code: ${encryptResult.code})`);
      result.steps.push({ success: false, step: POSTPROCESSING_STEP.ENCRYPTION, error: encryptResult.error });
    }
    else result.steps.push({ success: true, step: POSTPROCESSING_STEP.ENCRYPTION, outputPath: encryptResult.outputPath });
  }

  // TODO: add more postprocessing steps here

  log("[INFO] Postprocessing complete.");
  if (result.steps.some(s => !s.success)) result.success = false;
  else {
    const lastStepWithOutput = [...result.steps].reverse().find(s => s.success && 'outputPath' in s && s.outputPath);
    if (lastStepWithOutput && 'outputPath' in lastStepWithOutput) {
      result.outputPath = lastStepWithOutput.outputPath;
    }
  }
  return result;
}
