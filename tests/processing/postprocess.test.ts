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

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GpgOptions, GpgWrapper } from '@/crypto/gpg';

const hoisted = vi.hoisted(() => {
  const encryptFileMock = vi.fn();
  const constructedOptions: Array<GpgOptions> = [];

  const instances: any[] = [];

  class GpgWrapperMock {
    public opts: GpgOptions;

    constructor(opts: GpgWrapperMock['opts']) {
      this.opts = opts;
      constructedOptions.push(opts);
      instances.push(this);
    }

    encryptFile(args: Parameters<GpgWrapper['encryptFile']>[0]) {
      return encryptFileMock(args);
    }
  }

  return { encryptFileMock, constructedOptions, instances, GpgWrapperMock };
});

vi.mock('@/crypto/gpg', () => ({
  GpgWrapper: hoisted.GpgWrapperMock,
}));


import { postprocessFile } from '@/processing/postprocess';

describe('postprocess', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    hoisted.encryptFileMock.mockReset();
    hoisted.constructedOptions.length = 0;
    hoisted.instances.length = 0;
  });

  it('returns success=true with no steps when no post_processing is configured', async () => {
    const config = { meta: { signature: 'QWERTY' }} as any;
    const res = await postprocessFile({ config, inputPath: 'in.csv', outputPath: 'out.gpg'});

    expect(res).toEqual({ success: true, steps: [] });
    expect(hoisted.encryptFileMock).not.toHaveBeenCalled();
    expect(hoisted.constructedOptions).toHaveLength(0);
  });

  it('no-op when post_processing exists but encryption is missing', async () => {
    const config = { meta: { signature: 'QWERTY' }, post_processing: {} } as any;
    const res = await postprocessFile({ config, inputPath: 'in.csv', outputPath: 'out.gpg' });

    expect(res).toEqual({ success: true, steps: [] });
    expect(hoisted.encryptFileMock).not.toHaveBeenCalled();
    expect(hoisted.constructedOptions).toHaveLength(0);
  });
});

describe('postprocess::encrypt', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    hoisted.encryptFileMock.mockReset();
    hoisted.constructedOptions.length = 0;
    hoisted.instances.length = 0;
  });
  it('runs encryption and returns success with outputPath (happy path)', async () => {
    hoisted.encryptFileMock.mockResolvedValueOnce({ success: true, outputPath: 'out.gpg' });

    const config = { meta: { signature: 'QWERTY' }, post_processing: { encryption: { recipient: 'RECIP' }}} as any;
    const res = await postprocessFile({ config, inputPath: 'in.csv', outputPath: 'out.gpg', options: { signer: 'SIGNER' } });

    expect(res.success).toBe(true);
    expect(res.steps).toEqual([{ success: true, step: 'ENCRYPTION', outputPath: 'out.gpg' }]);
    expect(res.outputPath).toBe('out.gpg');

    const callArgs = hoisted.encryptFileMock.mock.calls.at(-1)?.[0];
    expect(callArgs).toMatchObject({
      inputPath: 'in.csv',
      outputPath: 'out.gpg',
      recipients: ['RECIP', 'SIGNER'],
      signer: "SIGNER",
    });

    expect(hoisted.constructedOptions).toEqual([{ trustAlways: true, timeoutMs: 60_000, verifyKeys: true }]);
  });

  it('forwards signer option to encryptFile', async () => {
    hoisted.encryptFileMock.mockResolvedValueOnce({ success: true, outputPath: 'out.gpg' });

    const config = {
      meta: { signature: 'QWERTY' },
      post_processing: { encryption: { recipient: 'RECIP' }}
    } as any;

    await postprocessFile({ config, inputPath: 'in.csv', outputPath: 'out.gpg', options: { signer: 'SIGNER' }});

    const callArgs = hoisted.encryptFileMock.mock.calls.at(-1)?.[0];
    expect(callArgs.signer).toBe('SIGNER');
  });

  it('records failed encryption and returns success=false', async () => {
    hoisted.encryptFileMock.mockResolvedValueOnce({
      success: false,
      error: 'Recipient key not found',
      code: 'RECIPIENT_KEY_NOT_FOUND'
    });

    const config = {
      meta: { signature: 'QWERTY' },
      post_processing: { encryption: { recipient: 'RECIP' }}
    } as any;

    const res = await postprocessFile({ config, inputPath: 'in.csv', outputPath: 'out.gpg' });

    expect(res.success).toBe(false);
    expect(res.steps).toEqual([{ success: false, step: 'ENCRYPTION', error: 'Recipient key not found' }]);
    expect(res.outputPath).toBeUndefined();
    expect(hoisted.encryptFileMock).toHaveBeenCalledTimes(1);
  });

  it('sets final outputPath to last successful step (single step today)', async () => {
    hoisted.encryptFileMock.mockResolvedValueOnce({ success: true, outputPath: 'encrypted.gpg' });

    const config = {
      meta: { signature: 'QWERTY' },
      post_processing: { encryption: { recipient: 'RECIP' }}
    } as any;

    const res = await postprocessFile({
      config,
      inputPath: 'in.csv',
      outputPath: 'encrypted.gpg'
    });

    expect(res.success).toBe(true);
    expect(res.outputPath).toBe('encrypted.gpg');
  });
});
