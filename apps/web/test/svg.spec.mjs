import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {unzipSync} from 'fflate';

test('SVG imports rasterize real pixels and preserve alpha',async({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/convert/?format=PNG');
  await expect(page.locator('.app-shell')).toHaveAttribute('aria-busy','false');
  await expect(page.locator('footer')).toContainText('引擎就绪');
  await page.getByRole('button',{name:'更多格式',exact:true}).click();
  await expect(page.getByRole('button',{name:'SVG',exact:true})).toBeEnabled();
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="31" height="17"><path fill="#ff0000" d="M0 0H15V17H0Z"/></svg>';
  await page.getByLabel('选择图片文件').setInputFiles({name:'vector.svg',mimeType:'image/svg+xml',buffer:Buffer.from(svg)});
  await expect(page.locator('.convert-button')).toBeEnabled();await page.locator('.convert-button').click();
  await expect(page.locator('.status-done')).toHaveCount(1);
  const event=page.waitForEvent('download');
  await page.getByRole('button',{name:'下载 vector.png',exact:true}).click();
  const path=info.outputPath('vector.png');await(await event).saveAs(path);
  const png=await readFile(path);
  expect(png.subarray(1,4).toString()).toBe('PNG');expect(png.readUInt32BE(16)).toBe(31);expect(png.readUInt32BE(20)).toBe(17);
  const pixels=await page.evaluate(async bytes=>{
    const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);image.close();
    return {red:Array.from(ctx.getImageData(1,1,1,1).data),clear:Array.from(ctx.getImageData(30,1,1,1).data)};
  },Array.from(png));
  expect(pixels.red).toEqual([255,0,0,255]);expect(pixels.clear[3]).toBe(0);expect(errors).toEqual([]);
});

async function inspectSvg(page,bytes){
  const text=Buffer.from(bytes).toString();
  expect(text).toContain('<path ');
  expect(text).not.toMatch(/<image|base64|<script|href=/i);
  return page.evaluate(async svg=>{
    const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
    if(doc.querySelector('parsererror'))throw new Error('Invalid SVG XML');
    const image=new Image(),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    try{
      image.src=url;await image.decode();
      const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
      return {width:image.naturalWidth,height:image.naturalHeight,
        red:Array.from(ctx.getImageData(40,40,1,1).data),background:Array.from(ctx.getImageData(2,2,1,1).data)};
    }finally{URL.revokeObjectURL(url);}
  },text);
}

test('Rust SVG: three modes, real previews, offline batch, ZIP, restore and PNG round trip',async({page,context},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/convert/?format=SVG');
  await expect(page.locator('.app-shell')).toHaveAttribute('aria-busy','false');
  await expect(page.locator('footer')).toContainText('16 种导出格式');
  await expect(page.getByRole('button',{name:'SVG',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'彩色图标',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByLabel('图片质量')).toHaveCount(0);
  const buffers=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=96;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#ff0000';ctx.beginPath();ctx.arc(40,40,20,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#0044ff';ctx.fillRect(80,15,32,40);
    ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(16,72,96,8);
    const icon=canvas.toDataURL('image/png').split(',')[1];
    ctx.clearRect(0,0,128,96);ctx.strokeStyle='#000000';ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(16,16);ctx.lineTo(112,80);ctx.moveTo(112,16);ctx.lineTo(16,80);ctx.stroke();
    return [icon,canvas.toDataURL('image/png').split(',')[1]];
  });
  await page.getByLabel('选择图片文件').setInputFiles(buffers.map((data,i)=>({name:i?'line.png':'icon.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')})));
  // Verify mode changes produce newly encoded downloads, and the browser can render those bytes.
  for(const mode of ['黑白线稿','照片描摹','彩色图标']){
    await page.getByRole('button',{name:mode,exact:true}).click();
    const link=page.getByRole('link',{name:'下载 SVG',exact:true});await expect(link).toBeVisible({timeout:30_000});
    const event=page.waitForEvent('download');await link.click();
    const output=info.outputPath(`${mode}.svg`);await(await event).saveAs(output);
    const pixels=await inspectSvg(page,await readFile(output));
    expect([pixels.width,pixels.height]).toEqual([128,96]);
    // Region clustering averages boundary colors; allow a small RGB fitting error, never lost alpha.
    expect(pixels.background[3]).toBe(255);expect(pixels.background.slice(0,3).every(c=>c>=250)).toBe(true);
    if(mode==='彩色图标'){expect(pixels.red[0]).toBeGreaterThanOrEqual(250);expect(pixels.red.slice(1)).toEqual([0,0,255]);}
    if(mode==='黑白线稿')expect(pixels.red).toEqual([0,0,0,255]);
    await expect.poll(()=>page.getByAltText('实际转换结果').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  }
  await expect(page.locator('.convert-button')).toBeEnabled();
  await context.setOffline(true);
  await page.locator('.convert-button').click();
  await expect(page.locator('.status-done')).toHaveCount(2,{timeout:30_000});
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'下载 ZIP',exact:true}).click();
  const zipPath=info.outputPath('vectors.zip');await(await event).saveAs(zipPath);
  const zip=unzipSync(await readFile(zipPath));
  expect(Object.keys(zip).sort()).toEqual(['icon.svg','line.svg']);
  const pixels=await inspectSvg(page,zip['icon.svg']);expect(pixels.red[0]).toBeGreaterThanOrEqual(250);expect(pixels.red.slice(1)).toEqual([0,0,255]);
  await inspectSvg(page,zip['line.svg']);
  await context.setOffline(false);
  await page.reload();await expect(page.locator('.status-done')).toHaveCount(2);
  await expect(page.getByRole('button',{name:'SVG',exact:true})).toHaveAttribute('aria-pressed','true');
  const restoredEvent=page.waitForEvent('download');await page.getByRole('button',{name:'下载 icon.svg',exact:true}).click();
  const restored=info.outputPath('restored.svg');await(await restoredEvent).saveAs(restored);
  expect(await readFile(restored)).toEqual(Buffer.from(zip['icon.svg']));
  await page.screenshot({path:info.outputPath('svg-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:info.outputPath('svg-mobile.png'),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize({width:310,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'清空',exact:true}).click();await expect(page.locator('.file-row')).toHaveCount(0);
  await page.getByRole('button',{name:'PNG',exact:true}).click();
  await page.getByLabel('选择图片文件').setInputFiles({name:'roundtrip.svg',mimeType:'image/svg+xml',buffer:Buffer.from(zip['icon.svg'])});
  await expect(page.locator('.convert-button')).toBeEnabled();await page.locator('.convert-button').click();
  await expect(page.locator('.status-done')).toHaveCount(1);
  const pngEvent=page.waitForEvent('download');await page.getByRole('button',{name:'下载 roundtrip.png',exact:true}).click();
  const pngPath=info.outputPath('roundtrip.png');await(await pngEvent).saveAs(pngPath);
  const png=await readFile(pngPath);expect(png.readUInt32BE(16)).toBe(128);expect(png.readUInt32BE(20)).toBe(96);
  expect(errors).toEqual([]);
});

test('SVG photo tracing renders an actual photograph',async({page},info)=>{
  await page.goto('/convert/?format=SVG&maxWidth=257');
  await expect(page.locator('footer')).toContainText('16 种导出格式');
  await page.getByRole('button',{name:'照片描摹',exact:true}).click();
  await page.getByLabel('选择图片文件').setInputFiles(resolve('public/sample-landscape.png'));
  const link=page.getByRole('link',{name:'下载 SVG',exact:true});await expect(link).toBeVisible({timeout:30_000});
  const event=page.waitForEvent('download');await link.click();
  const output=info.outputPath('photo.svg');await(await event).saveAs(output);
  expect((await inspectSvg(page,await readFile(output))).width).toBe(257);
  await expect.poll(()=>page.getByAltText('实际转换结果').evaluate(img=>img.complete&&img.naturalWidth===257)).toBe(true);
});
