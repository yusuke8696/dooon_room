import { readFile, readdir, mkdir, writeFile, rm, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validateUrl(value) {
  if (typeof value !== 'string') throw new Error('URL must be a string');
  if (!value) return;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('HTTPS URL required');
}
export function validateProducts(products) {
  const ids = new Set();
  for (const p of products) {
    if (!/^[a-z0-9-]+$/.test(p.id) || ids.has(p.id)) throw new Error('Invalid or duplicate product id');
    ids.add(p.id);
    for (const key of ['name','model','jan','category','description','rakutenSearchKeyword','notes']) {
      if (typeof p[key] !== 'string') throw new Error(`Missing ${key}: ${p.id}`);
    }
    if (!p.name || !p.description || (!p.model && !p.jan)) throw new Error('Incomplete product');
    for (const key of ['productUrl','roomUrl','a8RakutenSearchUrl']) validateUrl(p[key]);
    if (p.a8RakutenSearchUrl && !p.rakutenSearchKeyword) throw new Error('Affiliate URL needs a search keyword');
  }
}
export function productCard(p) {
  const e = escapeHtml;
  return `<article class="product" id="${e(p.id)}"><span class="eyebrow">${e(p.category)}</span><h3>${e(p.name)}</h3><p class="model">${p.model ? `型番 ${e(p.model)}` : `JAN ${e(p.jan)} · 型番確認中`}</p><p>${e(p.description)}</p><div class="links">${p.a8RakutenSearchUrl ? `<a class="button" href="${e(p.a8RakutenSearchUrl)}" rel="sponsored nofollow noopener">楽天で型番検索（広告） ↗</a>` : ''}${p.productUrl ? `<a href="${e(p.productUrl)}" rel="noopener">楽天の商品情報 ↗</a>` : ''}${p.roomUrl ? `<a href="${e(p.roomUrl)}" rel="sponsored nofollow noopener">ROOMで見る ↗</a>` : ''}</div></article>`;
}
export async function build(root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))) {
  const json = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
  const site = await json('content/site.json');
  const products = await json('content/products.json');
  validateProducts(products);
  validateUrl(site.url); validateUrl(site.roomUrl);
  if (!/^(\/[a-zA-Z0-9_-]+)*$/.test(site.basePath)) throw new Error('Invalid basePath');
  const posts = [];
  const slugs = new Set();
  for (const file of await readdir(path.join(root, 'content/posts'))) {
    if (!file.endsWith('.json')) continue;
    const post = await json(`content/posts/${file}`);
    if (!/^[a-z0-9-]+$/.test(post.slug) || slugs.has(post.slug)) throw new Error('Invalid or duplicate slug');
    slugs.add(post.slug);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date) || !Number.isFinite(Date.parse(post.date)) || !post.title || typeof post.excerpt !== 'string' || typeof post.draft !== 'boolean' || !Array.isArray(post.sections)) throw new Error('Invalid post');
    for (const section of post.sections) {
      if (typeof section.heading !== 'string' || !Array.isArray(section.paragraphs) || section.paragraphs.some(p => typeof p !== 'string')) throw new Error('Invalid section');
      for (const id of section.productIds ?? []) if (!products.some(p => p.id === id)) throw new Error(`Unknown product: ${id}`);
    }
    if (!post.draft) posts.push(post);
  }
  posts.sort((a,b) => b.date.localeCompare(a.date));
  const e = escapeHtml, link = p => `${site.basePath}${p}`;
  const layout = (title, description, route, body) => `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)} | ${e(site.name)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${e(site.url + link(route))}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${e(site.url + link(route))}"><link rel="stylesheet" href="${link('/assets/style.css')}"></head><body><a class="skip" href="#main">本文へ</a><header><a class="brand" href="${link('/')}">${e(site.name)}</a><nav aria-label="メイン"><a href="${link('/')}#journal">記事</a><a href="${link('/products/')}">紹介アイテム</a><a href="${link('/')}#about">プロフィール</a></nav></header><main id="main">${body}</main><footer><p>広告について：当サイトはアフィリエイト広告を利用します。広告リンクを経由した購入により、運営者に報酬が発生する場合があります。</p><a href="${e(site.roomUrl)}" rel="sponsored nofollow noopener">楽天ROOMで紹介アイテムを見る ↗</a><p>© ${e(site.name)}</p></footer></body></html>`;
  const out = path.join(root, 'dist');
  await rm(out, {recursive:true, force:true});
  const save = async (file, data) => { await mkdir(path.dirname(path.join(out,file)),{recursive:true}); await writeFile(path.join(out,file),data); };
  await save('index.html', layout('暮らしに、ちょうどいいスマートホーム。', '自宅で選んだスマート家電と、組み合わせの記録。', '/', `<section class="hero"><span class="eyebrow">DOOOON / SMART HOME JOURNAL</span><h1>暮らしに、ちょうどいい<br>スマートホーム。</h1><p>調べて、選んで、使ってみる。<br>わが家の小さな工夫と、機器選びの記録。</p><a class="button" href="${link('/products/')}">紹介アイテムを見る →</a><div class="hero-note">HOME NETWORK / LIGHTING / AUTOMATION</div></section><section id="journal"><span class="eyebrow">JOURNAL</span><h2>スマートホームの記録</h2>${posts.map(p => `<article class="post-preview"><time datetime="${e(p.date)}">${e(p.date)}</time><h3><a href="${link(`/posts/${p.slug}/`)}">${e(p.title)} →</a></h3><p>${e(p.excerpt)}</p></article>`).join('')}</section><section id="about" class="about"><span class="eyebrow">ABOUT</span><h2>${e(site.name)}</h2><p class="bio">${e(site.bio)}</p><a class="button" href="${e(site.roomUrl)}" rel="sponsored nofollow noopener">楽天ROOMへ ↗</a></section>`));
  await save('products/index.html', layout('紹介アイテム', '自宅のスマートホーム化で選んだアイテム。', '/products/', `<section><span class="eyebrow">OUR EQUIPMENT</span><h1>紹介アイテム</h1><p>選んだ理由と、使ってみた感想をまとめました。</p><div class="grid">${products.map(productCard).join('')}</div></section>`));
  for (const post of posts) {
    await save(`posts/${post.slug}/index.html`, layout(post.title, post.excerpt, `/posts/${post.slug}/`, `<article class="story"><a href="${link('/')}#journal">← 記事一覧</a><p class="eyebrow"><time datetime="${e(post.date)}">${e(post.date)}</time> / SMART HOME</p><h1>${e(post.title)}</h1><p class="lead">${e(post.excerpt)}</p><p class="ad-note">この記事には広告リンクが含まれる場合があります。</p>${post.sections.map(s => `<section><h2>${e(s.heading)}</h2>${s.paragraphs.map(p => `<p>${e(p)}</p>`).join('')}${(s.productIds ?? []).map(id => productCard(products.find(p => p.id === id))).join('')}</section>`).join('')}</article>`));
  }
  await save('404.html',layout('ページが見つかりません','ページが見つかりません。','/404.html',`<section><h1>ページが見つかりません</h1><a href="${link('/')}">トップに戻る</a></section>`));
  await save('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/products/',...posts.map(p=>`/posts/${p.slug}/`)].map(p=>`<url><loc>${e(site.url+link(p))}</loc></url>`).join('')}</urlset>`);
  await save('.nojekyll','');
  await mkdir(path.join(out,'assets'),{recursive:true});
  await copyFile(path.join(root,'assets/style.css'),path.join(out,'assets/style.css'));
  console.log(`Built ${posts.length} posts and ${products.length} products → dist`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
