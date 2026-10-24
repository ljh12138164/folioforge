import { afterEach, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { downloadAsset } from './download-asset.mjs';

vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn().mockResolvedValue(undefined) }));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const bytes = Buffer.from('verified model');
const hash = createHash('sha256').update(bytes).digest('hex');

it('recovers from a transient network timeout without skipping checksum validation', async () => {
  const fetch = vi.fn().mockRejectedValueOnce(new Error('connect timeout')).mockResolvedValueOnce(new Response(bytes));
  vi.stubGlobal('fetch', fetch); vi.spyOn(console, 'warn').mockImplementation(() => {});
  expect(await downloadAsset('https://example.test/model', hash)).toEqual(bytes);
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('never accepts a corrupt response and stops after three attempts', async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response('corrupt'));
  vi.stubGlobal('fetch', fetch); vi.spyOn(console, 'warn').mockImplementation(() => {});
  await expect(downloadAsset('https://example.test/model', hash)).rejects.toThrow('checksum mismatch');
  expect(fetch).toHaveBeenCalledTimes(3);
});

it('HTTP failures remain failures after the retry budget', async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response('unavailable', { status: 503 }));
  vi.stubGlobal('fetch', fetch); vi.spyOn(console, 'warn').mockImplementation(() => {});
  await expect(downloadAsset('https://example.test/model', hash)).rejects.toThrow('(503)');
  expect(fetch).toHaveBeenCalledTimes(3);
});
