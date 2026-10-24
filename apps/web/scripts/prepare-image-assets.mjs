import {mkdir,copyFile} from 'node:fs/promises';
const target=new URL('../public/image-assets/',import.meta.url);
await mkdir(target,{recursive:true});
await copyFile(new URL(import.meta.resolve('@pixelforge/heic-wasm/LICENSE.txt')),new URL('HEIC-LICENSE.txt',target));
await copyFile(new URL(import.meta.resolve('@pixelforge/vectorizer-wasm/LICENSE.txt')),new URL('VECTORIZER-LICENSE.txt',target));
