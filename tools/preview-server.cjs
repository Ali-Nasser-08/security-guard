// Local-only preview. No packages, external requests, or build step.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.PREVIEW_PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.ttf':'font/ttf','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch {res.writeHead(400);res.end();return;}
  const file = path.resolve(root, '.' + (decoded === '/' ? '/index.html' : decoded));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403);res.end();return;}
  fs.readFile(file, (err, data) => {
    if (err) {res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`Training preview: http://127.0.0.1:${port}`));
