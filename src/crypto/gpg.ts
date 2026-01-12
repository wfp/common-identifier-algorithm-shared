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

import { constants, existsSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import Debug from 'debug';
import type { Config } from '../config';
import { GpgErrorCode, identifyError } from './gpgError';

const log = Debug('cid::engine::crypto::gpg');

export type GpgOptions = {
  armor?: boolean;
  trustAlways?: boolean;
  binaryPathOverride?: string;
  pinentryMode?: Config.CryptoPinentryMode;
  timeoutMs?: number;
  verifyKeys?: boolean;
}


export type EncryptFileInput = {
  inputPath: string;
  outputPath: string;
  recipient: string;
  signer?: string;
  signerPassphrase?: string;
}

export type EncryptFileResult = 
  | { success: true; outputPath: string }
  | { success: false; error: string; code?: string | GpgErrorCode };


export class GpgWrapper {
  private binPath: string;
  
  constructor(private options: GpgOptions={}) {
    this.binPath = this.resolveGpgPath(options.binaryPathOverride);
  }

  private resolveGpgPath(override?: string): string {
    // 1. if explicit path provided, use it.
    if (override && existsSync(override)) {
      log(`[INFO] Using overridden GPG binary path: ${override}`);
      return override;
    }
    // TODO: maybe try gpgconf to discover homedir

    // 2. Try common install locations
    // NOTE: We try this before PATH to give preference to known locations since most users of this library
    //       will likely be on Windows and using Kleopatra/Gpg4win, which installs by default into AppData.
    //       For headless usage or usage on Linux/MacOS, users should ensure GPG is set on PATH or provide
    //       path explicitly.
    if (isWindows()) {
      const candidates = this.resolveWindowsGpgBinCandidates();
      for (const c of candidates) if (existsSync(c)) {
        log(`[INFO] Found GPG binary at common location: ${c}`);
        return c;
      }
    }

    // 3. Fallback to 'gpg' - we'll try PATH later
    log(`[WARN] Falling back to GPG binary 'gpg' without validation.`);
    return 'gpg';
  }

  private resolveWindowsGpgBinCandidates(): string[] {
    const localAppData = process.env.LOCALAPPDATA;
    const programFiles = process.env['ProgramFiles'];
    const programFilesX86 = process.env['ProgramFiles(x86)'];

    // Order matters
    const opts: string[] = [];
    if (localAppData) opts.push(join(localAppData, 'Programs', 'GnuPG', 'bin', 'gpg.exe'));
    if (programFiles) opts.push(join(programFiles, 'GnuPG', 'bin', 'gpg.exe'));
    if (programFilesX86) opts.push(join(programFilesX86, 'GnuPG', 'bin', 'gpg.exe'));
    if (programFiles) opts.push(join(programFiles, 'Gpg4win', 'bin', 'gpg.exe'));
    if (programFilesX86) opts.push(join(programFilesX86, 'Gpg4win', 'bin', 'gpg.exe'));
    return opts;
  }

  private async keyExists(key: string, keyType: "RECIPIENT" | "SIGNER"): Promise<boolean> {
    const args = keyType === "RECIPIENT" ? [ '--list-keys', '--with-colons', key ] : [ '--list-secret-keys', '--with-colons', key ];
    const { status, stdout } = await this.runProcess(this.binPath, args, { timeoutMs: this.options.timeoutMs ?? 10_000 });
    return status === 0 && stdout.length > 0;
  }

  private async checkBinary(): Promise<boolean> {
    try {
      await this.runProcess(this.binPath, ['--version'], { timeoutMs: 5000 });
      log(`[DEBUG] GPG binary check succeeded.`);
      return true;
    }
    catch (err) {
      log(`[ERROR] GPG binary check failed at path: '${this.binPath}': ${String(err)}`);
      return false
    }
  }

  private runProcess(cmd: string, args: string[], opts?: { timeoutMs?: number; cwd?: string; env?: NodeJS.ProcessEnv; input?: string})
    : Promise<{ status: number; stdout: string, stderr: string; signal?: NodeJS.Signals }> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], cwd: opts?.cwd, env: { ...process.env, ...(opts?.env ?? {}) } });

      let stdout = '';
      let stderr = '';
      child.stdout.setEncoding('utf-8');
      child.stderr.setEncoding('utf-8');
      child.stdout.on('data', (data) => { stdout += data; });
      child.stderr.on('data', (data) => { stderr += data; });

      let timedOut = false;
      let timer: NodeJS.Timeout | undefined;
      if (opts?.timeoutMs) {
        timer = setTimeout(() => {
          timedOut = true;
          try { child.kill('SIGTERM'); }
          catch {}
        }, opts.timeoutMs);
      }

      if (opts?.input) { child.stdin.write(opts.input); }
      child.stdin.end();

      child.on('error', (err) => {
        if (timer) clearTimeout(timer);
        reject(err);
      });

      child.on('close', (code, signal) => {
        if (timer) clearTimeout(timer);
        if (timedOut) {
          const e: any = new Error("Process timed out");
          e.code = "ETIMEDOUT";
          reject(e);
        } else {
          resolve({ status: code ?? -1, stdout, stderr, signal: signal ?? undefined });
        }
      });
    });
  }

  public async encryptFile({ inputPath, outputPath, recipient, signer, signerPassphrase }: EncryptFileInput): Promise<EncryptFileResult> {
    // check gpg binary exists and is executable
    const okay = await this.checkBinary();
    if (!okay) return { success: false, error: `GPG binary not found or not executable at path: '${this.binPath}'`, code: GpgErrorCode.GPG_NOT_FOUND }

    // check read permissions on input
    try {
      log(`[DEBUG] Checking read access for input file at path: '${inputPath}'`);
      await access(inputPath, constants.R_OK);
    }
    catch {
      log(`[ERROR] Unable to read input file, insufficient permissions for path: '${inputPath}'`);
      return { success: false, error: `Unable to read input file: '${inputPath}'`, code: "INPUT_NOT_READABLE" }
    }

    // check write permissions on output
    const outputDir = dirname(outputPath);
    try {
      log(`[DEBUG] Checking write access for output directory at path: '${outputDir}'`);
      await access(outputDir, constants.W_OK);
    }
    catch {
      log(`[ERROR] Unable to write to output directory, insufficient permissions for path: '${outputDir}'`);
      return { success: false, error: `Unable to write to output path: '${outputPath}'`, code: "OUTPUT_NOT_WRITABLE" }
    }

    // check recipient key is in keyring and valid
    if (this.options.verifyKeys) {
      log(`[DEBUG] Verifying recipient key exists in keyring: '${recipient}'`);
      const recipientOkay = await this.keyExists(recipient, "RECIPIENT");
  
      if (!recipientOkay) {
        const msg = `Recipient key not found in local keyring: '${recipient}'`;
        log(`[ERROR] ${msg}`);
        return { success: false, error: msg, code: GpgErrorCode.RECIPIENT_KEY_NOT_FOUND }
      }

      log(`[DEBUG] Recipient key exists in keyring.`);
    }

    // check signer key is in the keyring and valid
    if (signer && signer.length > 0 && this.options.verifyKeys) {
      log(`[DEBUG] Verifying signer secret key exists in keyring: '${signer}'`);
      const signerOkay = await this.keyExists(signer, "SIGNER");
      if (!signerOkay) {
        const msg = `Signer secret key not found in local keyring: '${signer}'`
        log(`[ERROR] ${msg}`);
        return { success: false, error: msg, code: GpgErrorCode.SIGNER_KEY_NOT_FOUND }
      }
      log(`[DEBUG] Signer secret key exists in keyring.`);
    }

    // https://www.gnupg.org/documentation/manuals/gnupg/GPG-Configuration-Options.html
    const args = ['--batch', '--yes', '--status-fd', '2', '--no-tty', '--with-colons'];

    if (this.options.armor) args.push('--armor');
    if (this.options.trustAlways) args.push('--trust-model', 'always');
    if (this.options.pinentryMode === 'loopback') args.push('--pinentry-mode', 'loopback');

    args.push('--output', outputPath);

    if (signer && signer.length > 0) {
      args.push('--sign', '--local-user', signer);
      if (this.options.pinentryMode === "loopback" && !signerPassphrase) {
        log(`[WARN] pinentry-mode=loopback is set but no passphrase has been provided; signing may fail if the key is protected.`);
      }
    }

    args.push('--encrypt', '--recipient', recipient, inputPath);

    log(`Running cmd: ${JSON.stringify(this.binPath)} ${args.map(a => JSON.stringify(a)).join(' ')}`);

    let inputData: string | undefined;

    if (signer && this.options.pinentryMode === "loopback" && signerPassphrase) {
      args.unshift('--passphrase-fd', '0');
      inputData = signerPassphrase.endsWith("\n") ? signerPassphrase : signerPassphrase + "\n";
    }

    try {
      const { status, stderr } = await this.runProcess(this.binPath, args, { timeoutMs: this.options.timeoutMs, input: inputData });

      if (status !== 0) {
        const errorDetail = identifyError(stderr);

        log(`[ERROR] Unable to encrypt file '${inputPath};\n\terrorCode=${errorDetail.code};\n\tmessage=${errorDetail.message}'`);
        log(`\tstderr: \n${stderr}`);
        return { success: false, error: errorDetail.message, code: errorDetail.code }
      }
      log(`[INFO] Successfully encrypted file ${outputPath}`);
      return { success: true, outputPath };
    }
    catch (err: any) {
      if (err?.code === "ETIMEDOUT") {
        log(`[ERROR] GPG timed out while encrypting file '${inputPath}'`);
        return { success: false, error: `GPG operation timed out`, code: GpgErrorCode.GENERAL_GPG_ERROR }
      }
      return { success: false, error: `GPG operation failed: ${String(err)}`, code: GpgErrorCode.GENERAL_GPG_ERROR }
    }
  }

}


export const isWindows = () => process.platform === 'win32';