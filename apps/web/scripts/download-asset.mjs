import { createHash } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

export async function downloadAsset(url, expectedHash) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error(`Asset download failed: ${url} (${response.status})`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (createHash('sha256').update(bytes).digest('hex') !== expectedHash) throw new Error(`Asset checksum mismatch: ${url}`);
      return bytes;
    } catch (error) {
      if (attempt === 2) throw error;
      console.warn(`Asset download attempt ${attempt + 1} failed; retrying: ${url}`);
      await setTimeout(1000 * 2 ** attempt);
    }
  }
}
