import { expect, it, vi } from 'vitest';
import { createEngine } from '@pixelforge/image-engine';
import type { ConvertOptions } from '@pixelforge/image-engine';

const options: ConvertOptions = { format: 'PNG', quality: 82, stripMetadata: true, background: '#ffffff' };
function setup() {
  const worker = {
    postMessage: vi.fn(), terminate: vi.fn(),
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null as (() => void) | null,
  };
  const engine = createEngine(worker as unknown as Worker);
  const emit = (data: unknown) => worker.onmessage?.({ data } as MessageEvent);
  emit({ type: 'ready', capabilities: [{ id: 'PNG', read: true, write: true }] });
  return { worker, engine, emit };
}

it('cancelling during file reading never sends work to a terminated worker', async () => {
  const { worker, engine } = setup();
  let finishRead!: (bytes: ArrayBuffer) => void;
  const file = new File(['png'], 'test.png');
  const read = vi.spyOn(file, 'arrayBuffer').mockReturnValue(new Promise((resolve) => { finishRead = resolve; }));
  const conversion = engine.convert(file, options);
  await expect.poll(() => read.mock.calls.length).toBe(1);
  engine.dispose();
  finishRead(new ArrayBuffer(3));
  await expect(conversion).rejects.toThrow('转换已取消');
  expect(worker.postMessage).not.toHaveBeenCalled();
  expect(worker.terminate).toHaveBeenCalledOnce();
});

it('a worker crash rejects in-flight work and marks the client for replacement', async () => {
  const { worker, engine } = setup();
  const conversion = engine.convert(new File(['png'], 'test.png'), options);
  const failure = expect(conversion).rejects.toThrow('转换引擎意外停止');
  await expect.poll(() => worker.postMessage.mock.calls.length).toBe(1);
  worker.onerror?.();
  await failure;
  expect(engine.failed).toBe(true);
  await expect(engine.convert(new File(['png'], 'next.png'), options)).rejects.toThrow('转换引擎意外停止');
  expect(worker.postMessage).toHaveBeenCalledOnce();
});

it('a damaged image does not poison the worker for the next image', async () => {
  const { worker, engine, emit } = setup();
  const first = engine.convert(new File(['broken'], 'broken.png'), options);
  const failure = expect(first).rejects.toThrow('damaged');
  await expect.poll(() => worker.postMessage.mock.calls.length).toBe(1);
  emit({ type: 'error', id: 1, error: 'damaged' });
  await failure;
  expect(engine.failed).toBe(false);
  const second = engine.convert(new File(['png'], 'next.png'), options);
  await expect.poll(() => worker.postMessage.mock.calls.length).toBe(2);
  const output = { data: new Uint8Array([1]), before: new Uint8Array([1]), after: new Uint8Array([1]), width: 1, height: 1, originalWidth: 1, originalHeight: 1, sourceFormat: 'PNG' };
  emit({ type: 'result', id: 2, result: output });
  expect(await second).toBe(output);
});
