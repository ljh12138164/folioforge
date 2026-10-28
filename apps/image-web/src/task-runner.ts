// ponytail: two conversions at most until wider device benchmarks justify a larger pool.
export function concurrencyFor(cores: number, memory?: number) {
  return cores >= 4 && (memory ?? 0) >= 8 ? 2 : 1;
}

function imagePixels(bytes: Uint8Array): number | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset: number, length: number) => String.fromCharCode(...bytes.subarray(offset, offset + length));
  if (bytes.length >= 24 && view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a && text(12, 4) === 'IHDR') {
    return view.getUint32(16) * view.getUint32(20);
  }
  if (bytes.length >= 30 && text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') {
    if (text(12, 4) === 'VP8X') return (1 + (view.getUint32(24, true) & 0xffffff)) * (1 + (view.getUint32(26, true) >>> 8));
    if (text(12, 4) === 'VP8 ' && text(23, 3) === '\x9d\x01\x2a') return (view.getUint16(26, true) & 0x3fff) * (view.getUint16(28, true) & 0x3fff);
    if (text(12, 4) === 'VP8L' && bytes[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      return (1 + (bits & 0x3fff)) * (1 + ((bits >>> 14) & 0x3fff));
    }
  }
  if (bytes.length >= 4 && view.getUint16(0) === 0xffd8) {
    let offset = 2;
    while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
      const marker = bytes[++offset];
      if (marker === 0xff) continue;
      if (marker === 0xda || marker === 0xd9) break;
      const length = view.getUint16(offset + 1);
      if (length < 2 || offset + 1 + length > bytes.length) break;
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker) && length >= 7) {
        return view.getUint16(offset + 4) * view.getUint16(offset + 6);
      }
      offset += length + 1;
    }
  }
}

export async function needsExclusive(file: Blob) {
  // Read only headers; unknown formats and large images run alone without a second full decode.
  if (file.size > 8 * 1024 * 1024) return true;
  try {
    const pixels = imagePixels(new Uint8Array(await file.slice(0, 64 * 1024).arrayBuffer()));
    return !pixels || pixels > 8_000_000;
  } catch { return true; }
}

export async function runQueue<T>(jobs: T[], concurrency: number, execute: (job: T, slot: number) => Promise<void>, stopped: () => boolean, exclusive: (job: T) => Promise<boolean>) {
  const active = new Map<number, Promise<void>>();
  let failure: { error: unknown } | undefined;
  try {
    for (const job of jobs) {
      if (stopped() || failure) break;
      let alone = await exclusive(job) || concurrency === 1;
      if (alone) await Promise.all(active.values());
      else if (active.size >= concurrency) await Promise.race(active.values());
      if (!alone && active.size && await exclusive(job)) {
        await Promise.all(active.values());
        alone = true;
      }
      if (stopped() || failure) break;
      let slot = 0;
      while (active.has(slot)) slot++;
      const pending = Promise.resolve().then(() => execute(job, slot))
        .catch((error: unknown) => { failure ??= { error }; })
        .finally(() => { active.delete(slot); });
      active.set(slot, pending);
      if (alone) await pending;
    }
  } catch (error) { failure ??= { error }; }
  // Wait for every in-flight commit, even after a failure, before the queue can be edited again.
  await Promise.all(active.values());
  if (failure) throw failure.error;
}
