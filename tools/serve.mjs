import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.woff2':'font/woff2' };
const server = http.createServer(async (req, res) => {
  try {
    let relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '');
    // Also exercise the exact repository-prefix behavior used by GitHub Pages.
    if (relative.startsWith('Bloodpals/')) relative = relative.slice('Bloodpals/'.length);
    let filename = path.resolve(root, relative);
    if (filename !== root && !filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    let status = 200;
    try {
      if ((await fs.stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
      await fs.access(filename);
    } catch { filename = path.join(root, '404.html'); status = 404; }
    res.writeHead(status, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(await fs.readFile(filename));
  } catch { res.writeHead(400).end('Solicitud no válida'); }
});
const host = process.env.BLOODPALS_PREVIEW_HOST || '127.0.0.1';
server.listen(5173, host, () => console.log('BLOODPALS: http://' + host + ':5173/'));
