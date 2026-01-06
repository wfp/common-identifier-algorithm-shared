
import { constants, existsSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import Debug from 'debug';
import type { Config } from '../config';
import { GpgErrorCode, identifyError } from './gpgError';
import { isExecutableSync } from 'is-executable';

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

    // 2. Try PATH
    const which = isWindows() ? 'where' : 'which';
    try {
      const r = spawnSync(which, [ 'gpg' ], { encoding: 'utf-8' });
      if (r.status === 0 && r.stdout) {
        const path = r.stdout.split(/\r?\n/).find(Boolean);
        if (path && existsSync(path)) {
          log(`[INFO] Found GPG binary at PATH: ${path}`);
          return path.trim();
        }
      }
    }
    catch { /* ignore and try next method */}

    // 4. Fallback to 'gpg' and let error handling deal with it.
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

  private keyExists(key: string, keyType: "RECIPIENT" | "SIGNER"): boolean {
    const args = keyType === "RECIPIENT" ? [ '--list-keys', '--with-colons', key ] : [ '--list-secret-keys', '--with-colons', key ];
    const r = spawnSync(this.binPath, args, { encoding: "utf-8" });
    return r.status === 0 && r.stdout?.length > 0;
  }

  public async encryptFile({ inputPath, outputPath, recipient, signer, signerPassphrase }: EncryptFileInput): Promise<EncryptFileResult> {
    // TODO: move this into the constructor?

    // TODO: find an alternative for checking existence/accessibility of GPG binary.
    //       since access() on some platforms (Windows) may return false negatives due to ACLs.
    //       For now, swapping in 3rd party library (isExecutable) to get it working, but perhaps
    //       it is better to just attempt to run GPG and handle the errors?
    try {
      log(`[DEBUG] Checking GPG binary at path: '${this.binPath}'`);
      isExecutableSync(this.binPath);
      log(`[DEBUG] GPG binary is executable.`);
    }
    catch (err) {
      log(`[ERROR] GPG binary not found or not executable at path: '${this.binPath}'`);
      return { success: false, error: `GPG binary not found or not executable at path: '${this.binPath}'`, code: GpgErrorCode.GPG_NOT_FOUND }
    }

    // check read permissions on input
    try {
      log(`[DEBUG] Checking read access for input file at path: '${inputPath}'`);
      await access(inputPath, constants.R_OK);
      log(`[DEBUG] Read access confirmed for input file.`);
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
      log(`[DEBUG] Write access confirmed for output directory.`);
    }
    catch {
      log(`[ERROR] Unable to write to output directory, insufficient permissions for path: '${outputDir}'`);
      return { success: false, error: `Unable to write to output path: '${outputPath}'`, code: "OUTPUT_NOT_WRITABLE" }
    }

    // check recipient key is in keyring and valid
    if (this.options.verifyKeys) {
      log(`[DEBUG] Verifying recipient key exists in keyring: '${recipient}'`);
      const okay = this.keyExists(recipient, "RECIPIENT");
      if (!okay) {
        const msg = `Recipient key not found in local keyring: '${recipient}'`;
        log(`[ERROR] ${msg}`);
        return { success: false, error: msg, code: GpgErrorCode.RECIPIENT_KEY_NOT_FOUND }
      }
      log(`[DEBUG] Recipient key exists in keyring.`);
    }

    // check signer key is in the keyring and valid
    if (signer && signer.length > 0 && this.options.verifyKeys) {
      log(`[DEBUG] Verifying signer secret key exists in keyring: '${signer}'`);
      const okay = this.keyExists(signer, "SIGNER");
      if (!okay) {
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

    args.push('--encrypt');
    args.push('--recipient', recipient);
    args.push(inputPath);

    log(`Running cmd: ${JSON.stringify(this.binPath)} ${args.map(a => JSON.stringify(a)).join(' ')}`);

    let finalArgs = args.slice();
    let inputData: string | undefined;

    if (signer && this.options.pinentryMode === "loopback" && signerPassphrase) {
      finalArgs = [ ...args.slice(0, 1), '--passphrase-fd', '0', ...args.slice(1)];
      inputData = signerPassphrase.endsWith("\n") ? signerPassphrase : signerPassphrase + "\n";
    }

    const result = spawnSync(this.binPath, finalArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      timeout: this.options.timeoutMs ?? 60_000,
      encoding: "utf-8",
      input: inputData
    });

    if ((result as any).error?.code === "ETIMEDOUT") {
      log(`[ERROR] GPG timed out while encrypting file '${inputPath}'`);
      log(`\tstderr: \n${result.stderr}`);
      return { success: false, error: `GPG operation timed out`, code: GpgErrorCode.GENERAL_GPG_ERROR }
    }

    if (result.status == null) {
      log(`[ERROR] GPG terminated without an exit status (timeout/signal).`);
      log(`\tstderr: \n${result.stderr}`);
      return { success: false, error: `GPG terminated without an exit status`, code: GpgErrorCode.GENERAL_GPG_ERROR }
    }

    if (result.status !== 0) {
      const errorDetail = identifyError(result.stderr);

      log(`[ERROR] Unable to encrypt file '${inputPath};\n\terrorCode=${errorDetail.code};\n\tmessage=${errorDetail.message}'`);
      log(`\tstderr: \n${result.stderr}`);
      return { success: false, error: errorDetail.message, code: errorDetail.code }
    }

    log(`[INFO] Successfully encrypted file ${outputPath}`);

    return { success: true, outputPath }
  }

}


export const isWindows = () => process.platform === 'win32';