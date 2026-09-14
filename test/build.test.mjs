import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build, productCard, validateProducts, validateUrl } from '../scripts/build.mjs';
const products = JSON.parse(await readFile(new URL('../content/products.json',import.meta.url),'utf8'));
test('optional links, affiliate URL preservation and escaping',()=>{
  assert.doesNotThrow(()=>validateProducts(products));
  assert.equal(products.length,6);
  assert.ok(!productCard(products[1]).includes('href='));
  const html = productCard({...products[0],name:'<script>',a8RakutenSearchUrl:'https://example.com/?a=1&b=2'});
  assert.ok(html.includes('https://example.com/?a=1&amp;b=2'));
  assert.ok(html.includes('rel="sponsored nofollow noopener"'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.throws(()=>validateUrl('javascript:alert(1)'));
  assert.throws(()=>validateProducts([...products,products[0]]));
});
test('drafts excluded; shared product links; project base path; invalid references',async()=>{
  const root = await mkdtemp(path.join(os.tmpdir(),'dooon-room-'));
  try {
    for (const dir of ['content','assets']) await cp(new URL(`../${dir}`,import.meta.url),path.join(root,dir),{recursive:true});
    const file = path.join(root,'content/posts/2026-09-15-smart-home.json');
    const post = JSON.parse(await readFile(file,'utf8'));
    await writeFile(path.join(root,'content/posts/draft.json'),JSON.stringify({...post,slug:'secret-draft',draft:true}));
    const changed = structuredClone(products);
    changed[0].a8RakutenSearchUrl = 'https://example.com/?id=1&search=W7202101';
    await writeFile(path.join(root,'content/products.json'),JSON.stringify(changed));
    await build(root);
    const home = await readFile(path.join(root,'dist/index.html'),'utf8');
    assert.ok(home.includes('/dooon_room/assets/style.css'));
    assert.ok(!home.includes('secret-draft'));
    await assert.rejects(readFile(path.join(root,'dist/posts/secret-draft/index.html')));
    for (const route of ['products','posts/smart-home-six-items']) {
      const html = await readFile(path.join(root,`dist/${route}/index.html`),'utf8');
      assert.ok(html.includes('https://example.com/?id=1&amp;search=W7202101'));
    }
    post.sections[0].productIds = ['missing'];
    await writeFile(file,JSON.stringify(post));
    await assert.rejects(build(root),/Unknown product/);
  } finally { await rm(root,{recursive:true,force:true}); }
});
