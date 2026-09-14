import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
const site = JSON.parse(await readFile('content/site.json','utf8'));
http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    if (url.pathname === '/') { res.writeHead(302,{Location:site.basePath+'/'}); return res.end(); }
    if (!url.pathname.startsWith(site.basePath+'/')) throw new Error('Not found');
    let rel = decodeURIComponent(url.pathname.slice(site.basePath.length));
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(root,'.'+rel);
    if (!file.startsWith(root+path.sep)) throw new Error('Not found');
    const data = await readFile(file);
    res.setHeader('Content-Type', file.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8');
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173'+site.basePath+'/'));
