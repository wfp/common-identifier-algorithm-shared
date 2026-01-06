
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import * as child from 'node:child_process';
import * as fsPromises from 'node:fs/promises';
import * as fs from 'node:fs';
import { GpgWrapper } from '@/crypto/gpg';

vi.mock('node:child_process');
vi.mock('node:fs/promises');
vi.mock('node:fs');

vi.mock('is-executable', () => ({
  isExecutableSync: vi.fn(() => true)
}));


const okAccess = () => Promise.resolve(undefined);
const failAccess = () => Promise.reject(new Error('EACCES'));

function mockSpawnSyncOnce(result: Partial<child.SpawnSyncReturns<string>>) {
  const r: child.SpawnSyncReturns<string> = {
    pid: 123,
    output: ['', result.stdout ?? '', result.stderr ?? ''],
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status ?? 0,
    signal: null,
  };
  (child.spawnSync as unknown as Mock).mockReturnValueOnce(r);
}

describe('crypto::gpg', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fsPromises.access).mockImplementation(okAccess);

    // if querying PATH ("which"/"where"), return a valid path.
    vi.mocked(child.spawnSync).mockImplementation((cmd: any, args: any) => {
      const isWhich =
        (cmd === 'which' || cmd === 'where') &&
        Array.isArray(args) &&
        args[0] === 'gpg';

      if (isWhich) {
        return {
          pid: 123,
          output: ['', '/usr/bin/gpg\n', ''],
          stdout: '/usr/bin/gpg\n',
          stderr: '',
          status: 0,
          signal: null,
        } as any;
      }

      return { pid: 123, output: ['', '', ''], stdout: '', stderr: '', status: 0, signal: null } as any;
    });
  });


  it('fails when input file is not readable', async () => {
    (fsPromises.access as unknown as Mock).mockImplementationOnce(failAccess);

    const gpg = new GpgWrapper();
    const res = await gpg.encryptFile({
      inputPath: '/path/in.csv',
      outputPath: '/path/out.gpg',
      recipient: 'RECIP',
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
      recipient: 'RECIP',
    });

    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toContain("Unable to write to output path: '/protected/out.gpg'");
  });

  it('succeeds on happy path (no signing, armor off, trust off)', async () => {
    (fsPromises.access as unknown as Mock)
      .mockImplementationOnce(okAccess) // read okay
      .mockImplementationOnce(okAccess); // write okay

    // spawnSync returns status 0 (success).
    mockSpawnSyncOnce({ status: 0, stdout: '' });

    const gpg = new GpgWrapper();
    const res = await gpg.encryptFile({
      inputPath: 'in.csv',
      outputPath: 'out.gpg',
      recipient: 'RECIP',
    });

    expect(res).toEqual({ success: true, outputPath: 'out.gpg' });
  });

  it('passes signer + loopback + passphrase via stdin (spawn args include --passphrase-fd 0)', async () => {
    (fsPromises.access as unknown as Mock)
      .mockImplementationOnce(okAccess)
      .mockImplementationOnce(okAccess);

    mockSpawnSyncOnce({ status: 0 });

    const gpg = new GpgWrapper({ pinentryMode: 'loopback' as any });
    const res = await gpg.encryptFile({
      inputPath: 'in.csv',
      outputPath: 'out.gpg',
      recipient: 'RECIP',
      signer: 'SIGNER',
      signerPassphrase: 'secret',
    });

    expect(res.success).toBe(true);

    const call = (child.spawnSync as unknown as Mock).mock.calls.at(-1);
    expect(call?.[1]).toContain('--passphrase-fd');
    expect(call?.[1]).toContain('0');
  });

  it('warns when loopback is set but no signer passphrase (still proceeds)', async () => {
    (fsPromises.access as unknown as Mock)
      .mockImplementationOnce(okAccess)
      .mockImplementationOnce(okAccess);

    mockSpawnSyncOnce({ status: 0 });

    const gpg = new GpgWrapper({ pinentryMode: 'loopback' as any });
    const res = await gpg.encryptFile({
      inputPath: 'in.csv',
      outputPath: 'out.gpg',
      recipient: 'RECIP',
      signer: 'SIGNER',
    });

    expect(res.success).toBe(true);
  });

  it('classifies generic GPG failure via stderr and returns success=false ', async () => {
    (fsPromises.access as unknown as Mock)
      .mockImplementationOnce(okAccess)
      .mockImplementationOnce(okAccess);

    // Simulate NEED_TTY error in stderr and non-zero status.
    mockSpawnSyncOnce({
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
      recipient: 'RECIP',
      signer: 'SIGNER',
    });

    expect(res.success).toBe(false);
  });

  it('sets armor/trustAlways/pinentry mode flags when options require them', async () => {
    (fsPromises.access as unknown as Mock)
      .mockImplementationOnce(okAccess)
      .mockImplementationOnce(okAccess);

    mockSpawnSyncOnce({ status: 0 });

    const gpg = new GpgWrapper({
      armor: true,
      trustAlways: true,
      pinentryMode: 'loopback' as any,
      binaryPathOverride: '/usr/bin/gpg',
    });
    const res = await gpg.encryptFile({
      inputPath: 'in.csv',
      outputPath: 'out.asc',
      recipient: 'RECIP',
    });

    expect(res.success).toBe(true);

    const call = (child.spawnSync as unknown as Mock).mock.calls.at(-1);
    const args = call?.[1] as string[];
    expect(args).toContain('--armor');
    expect(args).toContain('--trust-model');
    expect(args).toContain('always');
    expect(args).toContain('--pinentry-mode');
    expect(args).toContain('loopback');
    expect(args).toContain('--output');
    expect(args).toContain('out.asc');
  });


  it('reports timeout as failure', async () => {
    vi.mocked(child.spawnSync).mockReturnValueOnce({
      pid: 1, output: [], stdout: '', stderr: '',
      status: null, signal: null, error: Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT' })
    } as any);

    const gpg = new GpgWrapper({ binaryPathOverride: '/usr/bin/gpg' });
    const res = await gpg.encryptFile({ inputPath: 'in.csv', outputPath: 'out.gpg', recipient: 'RECIP' });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toMatch(/timed out/i);
  });

  it('reports success=false on general gpg termination', async () => {
    vi.mocked(child.spawnSync).mockReturnValueOnce({
      pid: 1, output: [], stdout: '', stderr: '',
      status: null, signal: null, error: Object.assign(new Error('qwerty'), { code: 'qwerty' })
    } as any);

    const gpg = new GpgWrapper({ binaryPathOverride: '/usr/bin/gpg' });
    const res = await gpg.encryptFile({ inputPath: 'in.csv', outputPath: 'out.gpg', recipient: 'RECIP' });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toMatch(/terminated without an exit status/i);
  });

});
