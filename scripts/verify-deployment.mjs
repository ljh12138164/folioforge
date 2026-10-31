import assert from 'node:assert/strict';

const base = new URL(process.argv[2] || 'http://127.0.0.1:18085');
const revision = process.argv[3];
const product = process.argv[4] || 'pdf';
assert.ok(['pdf', 'image'].includes(product), 'Product must be pdf or image');
const origin = product === 'pdf' ? 'https://pdf.ljhboard.cn' : 'https://img.ljhboard.cn';
const paths = product === 'pdf' ? ['/', '/pdf/', '/guide/'] : ['/', '/convert/', '/images/', '/guide/'];
async function get(path, method = 'GET') {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(new URL(path, base), { method, redirect: 'manual', signal: AbortSignal.timeout(25000), headers: { 'Cache-Control': 'no-cache' } });
    } catch (error) {
      if (attempt >= 3) throw new Error(`Connection failed: ${path}`, { cause: error });
      await new Promise(r => setTimeout(r, 800));
    }
  }
}
for (const path of paths) {
  const response = await get(path);
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get('content-type') || '', /text\/html/, path);
  assert.match(response.headers.get('cache-control') || '', /no-cache/, path);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff', path);
  const html = await response.text();
  assert.ok(html.includes(`rel="canonical" href="${origin}${path}"`), `Canonical: ${path}`);
  assert.ok(html.includes('application/ld+json'), `Schema: ${path}`);
}
let assets = [];
if (product === 'pdf') {
const worker = await get('/pdf-sw.js');
assert.match(worker.headers.get('cache-control') || '', /no-store/);
assert.match(worker.headers.get('content-type') || '', /javascript/);
const source = await worker.text();
assets = JSON.parse(source.match(/const ASSETS = (\[[^\n]*\]);/)[1]);
for (let offset = 0; offset < assets.length; offset += 12) {
  await Promise.all(assets.slice(offset, offset + 12).map(async path => {
    const response = await get(path, 'HEAD');
    assert.equal(response.status, 200, `Offline asset: ${path}`);
    if (path.endsWith('.wasm')) assert.match(response.headers.get('content-type') || '', /application\/wasm/, path);
    if (path.endsWith('.mjs')) assert.match(response.headers.get('content-type') || '', /javascript/, path);
    if (path.startsWith('/_next/static/')) assert.match(response.headers.get('cache-control') || '', /immutable/, path);
  }));
}
} else {
  for (const path of ['/image-assets/HEIC-LICENSE.txt', '/image-assets/VECTORIZER-LICENSE.txt', '/sample-landscape.png']) assert.equal((await get(path)).status, 200, path);
}
for (const path of product === 'pdf' ? ['/convert/', '/images/', '/image-assets/HEIC-LICENSE.txt'] : ['/pdf/', '/pdf-sw.js', '/pdf-assets/pdf.worker.min.mjs']) assert.equal((await get(path)).status, 404, 'Unexpected feature: ' + path);
const sitemap = await get('/sitemap.xml');
assert.match(sitemap.headers.get('content-type') || '', /^application\/xml(?:;|$)/);
assert.deepEqual([...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), paths.map(path => origin + path));
assert.ok((await (await get('/robots.txt')).text()).includes(origin + '/sitemap.xml'));
const llms = await get('/llms.txt');
assert.match(llms.headers.get('content-type') || '', /text\/plain/);
assert.ok((await llms.text()).includes(origin + '/guide/'));
for (const path of ['/missing-release-page', '/_next/static/missing.js']) assert.equal((await get(path)).status, 404, path);
for (const path of paths.filter(path => path !== '/').map(path => path.slice(0, -1))) {
  const response = await get(path + '?verify=1');
  assert.equal(response.status, 301, path);
  assert.equal(response.headers.get('location'), path + '/?verify=1');
}
assert.equal((await get('/healthz')).status, 200);
if (revision) assert.equal((await (await get('/release.txt')).text()).trim(), revision);
console.log(`Deployment verified: ${paths.length} pages, ${assets.length} offline resources, MIME/cache/404/redirects${revision ? ', revision ' + revision : ''}.`);
