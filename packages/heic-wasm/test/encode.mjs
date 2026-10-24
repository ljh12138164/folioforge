import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {initializeImageMagick,ImageMagick,Quantum} from '@imagemagick/magick-wasm';
import init,{encode_heic} from '../pkg/folioforge_heic.js';

const wasm=readFileSync(new URL('../pkg/folioforge_heic_bg.wasm',import.meta.url));
await init({module_or_path:wasm});
await initializeImageMagick(readFileSync(new URL(import.meta.resolve('@imagemagick/magick-wasm/magick.wasm'))));
function pixels(w,h){
  const rgba=new Uint8Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;
    rgba.set([Math.round(x/Math.max(1,w-1)*255),Math.round(y/Math.max(1,h-1)*255),(x*17+y*11)%256,255],i);
  }
  return rgba;
}
for(const [w,h] of [[1,1],[31,17],[257,145]]){
  const source=pixels(w,h),high=encode_heic(source,w,h,95),low=encode_heic(source,w,h,15);
  assert.equal(new TextDecoder().decode(high.subarray(4,12)),'ftypheic');
  if(w===257)assert(Buffer.from(high).at(Buffer.from(high).indexOf('hvcC')+16)>=60,'hvcC must carry the SPS level above 36,864 coded pixels');
  const error=bytes=>ImageMagick.read(bytes,image=>{
    assert.equal(image.width,w);assert.equal(image.height,h);
    return image.getPixels(cache=>{
      const decoded=cache.toByteArray(0,0,w,h,'RGBA');
      let mse=0;for(let i=0;i<source.length;i++)if(i%4!==3)mse+=(decoded[i]-source[i])**2;
      return mse/(w*h*3);
    });
  });
  const highError=error(high),lowError=error(low);
  assert(highError<5000,`independent decode MSE ${highError}`);
  if(w>1){assert(high.length>low.length);assert(highError<lowError);}
  console.log(`PASS HEIC ${w}x${h}: high ${high.length}B/MSE ${highError.toFixed(1)}, low ${low.length}B/MSE ${lowError.toFixed(1)}`);
}
const red=encode_heic(Uint8Array.from({length:32*32*4},(_,i)=>i%4===0||i%4===3?255:0),32,32,100);
ImageMagick.read(red,image=>image.getPixels(cache=>{const p=cache.getPixel(0,0);assert(p[0]/Quantum.max>.95&&p[1]/Quantum.max<.05&&p[2]/Quantum.max<.05);}));
assert.throws(()=>encode_heic(new Uint8Array(),0,1,80));
assert.throws(()=>encode_heic(new Uint8Array(),16385,1,80));
assert.throws(()=>encode_heic(new Uint8Array(),10000,10000,80));
assert.throws(()=>encode_heic(new Uint8Array(4),1,1,80));
assert.throws(()=>encode_heic(new Uint8Array([0,0,0,255]),1,1,0));
console.log(`PASS buffer, alpha, bounds, quality validation; WASM ${wasm.length}B / gzip ${gzipSync(wasm).length}B`);
