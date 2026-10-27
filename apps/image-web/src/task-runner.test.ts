import { describe, expect, it } from 'vitest';
import { concurrencyFor, needsExclusive, runQueue } from './task-runner';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}
const shared = async () => false;

describe('bounded task queue', () => {
  it('fills free slots without waiting for slower jobs and preserves input order', async () => {
    const gates = Array.from({ length: 4 }, deferred);
    const started: number[] = [];
    const slots: number[] = [];
    const jobs = [0, 1, 2, 3];
    const running = runQueue(jobs, 2, async (job, slot) => { started.push(job); slots.push(slot); await gates[job].promise; }, () => false, shared);
    await expect.poll(() => started).toEqual([0, 1]);
    gates[1].resolve();
    await expect.poll(() => started).toEqual([0, 1, 2]);
    expect(slots).toEqual([0, 1, 1]);
    gates.forEach((gate) => gate.resolve());
    await running;
    expect(started).toEqual(jobs);
    expect(jobs).toEqual([0, 1, 2, 3]);
  });

  it('drains all active jobs before running a large job alone', async () => {
    const gates = Array.from({ length: 4 }, deferred);
    const started: number[] = [];
    const running = runQueue([0, 1, 2, 3], 2, async (job) => { started.push(job); await gates[job].promise; }, () => false, async (job) => job === 2);
    await expect.poll(() => started).toEqual([0, 1]);
    gates[1].resolve();
    await Promise.resolve();
    expect(started).toEqual([0, 1]);
    gates[0].resolve();
    await expect.poll(() => started).toEqual([0, 1, 2]);
    gates[2].resolve();
    await expect.poll(() => started).toEqual([0, 1, 2, 3]);
    gates[3].resolve();
    await running;
  });

  it('pause stops claiming new jobs and waits for active commits', async () => {
    const gate = deferred();
    let paused = false;
    const started: number[] = [];
    const running = runQueue([0, 1, 2], 2, async (job) => { started.push(job); await gate.promise; }, () => paused, shared);
    await expect.poll(() => started.length).toBe(2);
    paused = true;
    gate.resolve();
    await running;
    expect(started).toEqual([0, 1]);
  });

  it('storage failure stops claiming jobs but awaits the other in-flight commit', async () => {
    const gate = deferred();
    const error = new Error('quota');
    const started: number[] = [];
    let settled = false;
    const running = runQueue([0, 1, 2], 2, async (job) => {
      started.push(job);
      if (job === 0) { await Promise.resolve(); throw error; }
      await gate.promise;
    }, () => false, shared).catch((value) => { settled = true; return value; });
    await expect.poll(() => started.length).toBe(2);
    expect(settled).toBe(false);
    gate.resolve();
    expect(await running).toBe(error);
    expect(started).toEqual([0, 1]);
  });

  it('uses one slot on devices with low or unknown memory', () => {
    expect(concurrencyFor(12, 8)).toBe(2);
    expect(concurrencyFor(2, 8)).toBe(1);
    expect(concurrencyFor(12, 4)).toBe(1);
    expect(concurrencyFor(12)).toBe(1);
  });

  it('rechecks memory pressure after a slot is freed and drains the remaining conversion', async () => {
    const gates = Array.from({ length: 3 }, deferred);
    const started: number[] = [];
    let serial = false;
    const running = runQueue([0, 1, 2], 2, async (job) => {
      started.push(job);
      await gates[job].promise;
      if (job === 0) serial = true;
    }, () => false, async () => serial);
    await expect.poll(() => started).toEqual([0, 1]);
    gates[0].resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(started).toEqual([0, 1]);
    gates[1].resolve();
    await expect.poll(() => started).toEqual([0, 1, 2]);
    gates[2].resolve();
    await running;
  });
});

describe('image memory guard', () => {
  it('checks PNG dimensions even when a large image compresses to a tiny file', async () => {
    const bytes = new Uint8Array(24);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, 0x89504e47); view.setUint32(4, 0x0d0a1a0a);
    bytes.set(new TextEncoder().encode('IHDR'), 12);
    view.setUint32(16, 1600); view.setUint32(20, 1200);
    expect(await needsExclusive(new Blob([bytes]))).toBe(false);
    view.setUint32(16, 8000); view.setUint32(20, 6000);
    expect(await needsExclusive(new Blob([bytes]))).toBe(true);
  });

  it('reads JPEG dimensions past metadata and rejects incomplete headers', async () => {
    const bytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0, 4, 0, 0, 0xff, 0xc0, 0, 7, 8, 0, 120, 0, 160]);
    expect(await needsExclusive(new Blob([bytes]))).toBe(false);
    expect(await needsExclusive(new Blob([bytes.slice(0, -1)]))).toBe(true);
    bytes[13] = 0x20; bytes[15] = 0x20;
    expect(await needsExclusive(new Blob([bytes]))).toBe(true);
  });

  it.each(['VP8X', 'VP8 ', 'VP8L'])('reads %s WebP dimensions', async (type) => {
    const bytes = new Uint8Array(30);
    bytes.set(new TextEncoder().encode('RIFF'), 0);
    bytes.set(new TextEncoder().encode('WEBP'), 8);
    bytes.set(new TextEncoder().encode(type), 12);
    if (type === 'VP8 ') { bytes.set([0x9d, 1, 0x2a], 23); bytes[26] = 160; bytes[28] = 120; }
    else if (type === 'VP8L') { bytes[20] = 0x2f; new DataView(bytes.buffer).setUint32(21, 159 | (119 << 14), true); }
    else { bytes[24] = 159; bytes[27] = 119; }
    expect(await needsExclusive(new Blob([bytes]))).toBe(false);
    const view = new DataView(bytes.buffer);
    if (type === 'VP8 ') { view.setUint16(26, 4000, true); view.setUint16(28, 3000, true); }
    else if (type === 'VP8L') view.setUint32(21, 3999 | (2999 << 14), true);
    else { bytes.set([0x9f, 0x0f, 0], 24); bytes.set([0xb7, 0x0b, 0], 27); }
    expect(await needsExclusive(new Blob([bytes]))).toBe(true);
  });

  it('runs unknown formats and large files alone', async () => {
    expect(await needsExclusive(new Blob(['unknown']))).toBe(true);
    expect(await needsExclusive(new Blob([new Uint8Array(8 * 1024 * 1024 + 1)]))).toBe(true);
  });
});
