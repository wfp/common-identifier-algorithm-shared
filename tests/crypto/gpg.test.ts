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
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import * as child from 'node:child_process';
import * as fsPromises from 'node:fs/promises';
import * as fs from 'node:fs';
import { GpgWrapper } from '@/crypto/gpg';
import EventEmitter from 'node:events';
import { Readable, Writable } from 'node:stream';

vi.mock('node:child_process');
vi.mock('node:fs/promises');
vi.mock('node:fs');

const okAccess = () => Promise.resolve(undefined);
const failAccess = () => Promise.reject(new Error('EACCES'));

type SpawnScenario = {
  stdout?: string;
  stderr?: string;
  status?: number;
  delayMs?: number;
  neverCloseUntilKilled?: boolean;
  signal?: NodeJS.Signals | null;
};

class MockChildProcess extends EventEmitter {
  stdin = new Writable({ write(_chunk, _enc, cb) { cb(); } });
  stdout = new Readable({ read() {} });
  stderr = new Readable({ read() {} });
  killed = false;

  constructor(private scenario: SpawnScenario) {
    super();
    if (scenario.stdout) this.stdout.push(scenario.stdout);
    this.stdout.push(null);

    if (scenario.stderr) this.stderr.push(scenario.stderr);
    this.stderr.push(null);

    if (!scenario.neverCloseUntilKilled) {
      const delay = scenario.delayMs ?? 0;
      setTimeout(() => this.emit('close', scenario.status ?? 0, scenario.signal ?? null), delay);
    }
  }

  kill(signal?: NodeJS.Signals) {
    this.killed = true;
    if (this.scenario.neverCloseUntilKilled) {
      setTimeout(() => this.emit('close', this.scenario.status ?? null, signal ?? null), 10);
    }
    return true;
  }
}

const queue: SpawnScenario[] = [];
const enqueueScenario = (s: SpawnScenario) => queue.push(s);
const dequeueScenario = (): SpawnScenario => queue.length ? queue.shift()! : { status: 0, stdout: '' };

describe('crypto::gpg', () => {
  beforeEach(() => {  
    vi.restoreAllMocks();
    vi.resetAllMocks();

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fsPromises.access).mockImplementation(okAccess);

    vi.mocked(child.spawn).mockImplementation((cmd: any, args: any) => {
      const isVersion = Array.isArray(args) && args[0] === '--version';
      const isEncrypt = Array.isArray(args) && args.includes('--encrypt');

      let scenario: SpawnScenario;

      // Always succeed for binary check
      if (isVersion) scenario = { status: 0, stdout: 'gpg (GnuPG) 2.4.0\n', stderr: '' };
      // Consume the queued scenario for the encrypt call
      else if (isEncrypt) scenario = dequeueScenario();
      // Any other gpg call (e.g., --list-keys if verifyKeys: true)
      else scenario = { status: 0, stdout: '' };

      return new MockChildProcess(scenario) as unknown as child.ChildProcess;
    });

  });

  it('fails when input file is not readable', async () => {
    vi.mocked(fsPromises.access)
      .mockImplementationOnce(failAccess) // read fails
      .mockImplementationOnce(okAccess);  // write okay

    const gpg = new GpgWrapper();
    const res = await gpg.encryptFile({
      inputPath: '/path/in.csv',
      outputPath: '/path/out.gpg',
      recipients: ['RECIP'],
    });

    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toContain("Unable to read input file: '/path/in.csv'");
  });

  it('fails when output directory is not writable', async () => {
    (fsPromises.access as unknown as Mock)
      .mockImplementationOnce(okAccess)   // read okay
      .mockImplementationOnce(failAccess); // write fails

    const gpg = new GpgWrapper();
    const res = await gpg.encryptFile({
      inputPath: '/path/in.csv',
      outputPath: '/protected/out.gpg',
      recipients: ['RECIP'],
    });

    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toContain("Unable to write to output path: '/protected/out.gpg'");
  });

  it('succeeds on happy path (no signing, armor off, trust off)', async () => {
    (fsPromises.access as unknown as Mock)
      .mockImplementationOnce(okAccess) // read okay
      .mockImplementationOnce(okAccess); // write okay

    // spawnSync returns status 0 (success).
    enqueueScenario({ status: 0, stdout: '' });

    const gpg = new GpgWrapper();
    const res = await gpg.encryptFile({
      inputPath: 'in.csv',
      outputPath: 'out.gpg',
      recipients: ['RECIP'],
    });

    expect(res).toEqual({ success: true, outputPath: 'out.gpg' });
  });

  it('passes signer + loopback + passphrase via stdin (spawn args include --passphrase-fd 0)', async () => {
    (fsPromises.access as unknown as Mock)
      .mockImplementationOnce(okAccess)
      .mockImplementationOnce(okAccess);

    enqueueScenario({ status: 0 });

    const gpg = new GpgWrapper({ pinentryMode: 'loopback' as any });
    const res = await gpg.encryptFile({
      inputPath: 'in.csv',
      outputPath: 'out.gpg',
      recipients: ['RECIP'],
      signer: 'SIGNER',
      signerPassphrase: 'secret',
    });

    expect(res.success).toBe(true);

    const calls = (child.spawn as unknown as Mock).mock.calls;
    const encryptCall = calls.find(([, args]) => Array.isArray(args) && args.includes('--encrypt'))!;
    const args = encryptCall?.[1] as string[];

    expect(args).toContain('--passphrase-fd');
    expect(args).toContain('0');
  });

  it('warns when loopback is set but no signer passphrase (still proceeds)', async () => {
    (fsPromises.access as unknown as Mock)
      .mockImplementationOnce(okAccess)
      .mockImplementationOnce(okAccess);

    enqueueScenario({ status: 0 });

    const gpg = new GpgWrapper({ pinentryMode: 'loopback' as any });
    const res = await gpg.encryptFile({
      inputPath: 'in.csv',
      outputPath: 'out.gpg',
      recipients: ['RECIP'],
      signer: 'SIGNER',
    });

    expect(res.success).toBe(true);
  });

  it('classifies generic GPG failure via stderr and returns success=false ', async () => {
    (fsPromises.access as unknown as Mock)
      .mockImplementationOnce(okAccess)
      .mockImplementationOnce(okAccess);

    // Simulate NEED_TTY error in stderr and non-zero status.
    enqueueScenario({
      status: 2,
      stderr: `[GNUPG:] NEED_TTY
gpg: pinentry launched
Inappropriate ioctl for device`,
    });

    const gpg = new GpgWrapper({
      pinentryMode: 'loopback',
      binaryPathOverride: '/usr/bin/gpg'
     });
    const res = await gpg.encryptFile({
      inputPath: 'in.csv',
      outputPath: 'out.gpg',
      recipients: ['RECIP'],
      signer: 'SIGNER',
    });

    expect(res.success).toBe(false);
  });

  it('sets armor/trustAlways/pinentry mode flags when options require them', async () => {
    (fsPromises.access as unknown as Mock)
      .mockImplementationOnce(okAccess)
      .mockImplementationOnce(okAccess);

    enqueueScenario({ status: 0 });

    const gpg = new GpgWrapper({
      armor: true,
      trustAlways: true,
      pinentryMode: 'loopback' as any,
      binaryPathOverride: '/usr/bin/gpg',
    });
    const res = await gpg.encryptFile({
      inputPath: 'in.csv',
      outputPath: 'out.asc',
      recipients: ['RECIP'],
    });

    expect(res.success).toBe(true);

    const calls = (child.spawn as unknown as Mock).mock.calls;
    const encryptCall = calls.find(([, args]) => Array.isArray(args) && args.includes('--encrypt'))!;
    const args = encryptCall?.[1] as string[];

    expect(args).toContain('--armor');
    expect(args).toContain('--trust-model');
    expect(args).toContain('always');
    expect(args).toContain('--pinentry-mode');
    expect(args).toContain('loopback');
    expect(args).toContain('--output');
    expect(args).toContain('out.asc');
  });


  it('reports timeout as failure', async () => {
    enqueueScenario({ neverCloseUntilKilled: true, stderr: "" });

    const gpg = new GpgWrapper({ binaryPathOverride: '/usr/bin/gpg', timeoutMs: 100 });
    const res = await gpg.encryptFile({ inputPath: 'in.csv', outputPath: 'out.gpg', recipients: ['RECIP'] });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toMatch(/timed out/i);
  });

  it('reports success=false on general gpg termination', async () => {
    enqueueScenario({ status: 1, stderr: "unexpected close" });

    const gpg = new GpgWrapper({ binaryPathOverride: '/usr/bin/gpg' });
    const res = await gpg.encryptFile({ inputPath: 'in.csv', outputPath: 'out.gpg', recipients: ['RECIP'] });
    expect(res.success).toBe(false);
  });

});
