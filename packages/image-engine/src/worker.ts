/// <reference lib="webworker" />
/// <reference path="./env.d.ts" />
import { initializeImageMagick, MagickError } from '@imagemagick/magick-wasm';
import wasmPath from '@imagemagick/magick-wasm/magick.wasm';
import heicWasmPath from '@pixelforge/heic-wasm/module.wasm';
import vectorizerWasmPath from '@pixelforge/vectorizer-wasm/module.wasm';
import { convert, getCapabilities, initializeHeic, initializeVectorizer } from './convert';
import type { WorkerRequest, WorkerResponse } from './types';

const scope = self as DedicatedWorkerGlobalScope;
function send(message: WorkerResponse, transfer: Transferable[] = []) {
  scope.postMessage(message, transfer);
}

async function start() {
  try {
    await Promise.all([wasmPath, heicWasmPath, vectorizerWasmPath].map(async (path, index) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`引擎文件加载失败 (${response.status})`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (index === 0) await initializeImageMagick(bytes);
      else if (index === 1) await initializeHeic(bytes);
      else await initializeVectorizer(bytes);
    }));
    send({ type: 'ready', capabilities: getCapabilities() });
    scope.onmessage = ({ data: { id, bytes, options, sourceFormat } }: MessageEvent<WorkerRequest>) => {
      try {
        const result = convert(new Uint8Array(bytes), options, sourceFormat);
        send({ type: 'result', id, result }, [result.data.buffer, result.before.buffer, result.after.buffer]);
      } catch (error) {
        const message = error instanceof MagickError
          ? /memory|cache|resource/i.test(error.message)
            ? '浏览器内存不足，请减小图片尺寸或分批处理。'
            : '无法读取或转换此图片，文件可能损坏或使用了不支持的编码。请换一张图片重试。'
          : error instanceof Error ? error.message : '图片转换失败，请换一张图片重试。';
        send({ type: 'error', id, error: message });
      }
    };
  } catch (error) {
    send({ type: 'error', error: `无法加载转换引擎：${error instanceof Error ? error.message : String(error)}` });
  }
}

void start();
