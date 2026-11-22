// Serves the production build with the exact headers from vercel.json and drives the app, failing on any CSP violation.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const cfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8')); const dist = path.resolve('dist');
const sec = Object.fromEntries(cfg.headers[0].headers.map((h) => [h.key, h.value])); const csp = sec['Content-Security-Policy'];
// the inline theme bootstrap must be covered by a hash in the CSP
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8'); const inline = [...html.matchAll(/<script(?![^>]*\bsrc)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((x) => x.trim());
const hashOk = inline.every((x) => csp.includes("'sha256-" + crypto.createHash('sha256').update(x).digest('base64') + "'"));
console.log((hashOk ? 'PASS' : 'FAIL') + ' CSP hash covers inline script(s) in dist/index.html (' + inline.length + ')');
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };
const srv = http.createServer((q, r) => { let f = path.join(dist, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, 'index.html');
  r.writeHead(200, { ...sec, 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(5198, async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 860 } })).newPage(); const bad = [];
  p.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) bad.push(m.text().slice(0, 140)); }); p.on('pageerror', (e) => bad.push('pageerror ' + e.message));
  await p.goto('http://127.0.0.1:5198/auth'); await p.click('text=Create account'); await p.fill('#n', 'Csp Test'); await p.fill('#e', 'csp@example.com'); await p.fill('#p', 'Password123!'); await p.fill('#y', '1990'); await p.check('input[type=checkbox]'); await p.click('button:has-text("Create account")'); await p.waitForTimeout(1200);
  for (const r of ['/', '/combiner', '/chef', '/marketplace', '/marketplace/r5', '/community', '/creator/new', '/settings', '/safety', '/terms', '/admin']) { await p.goto('http://127.0.0.1:5198' + r); await p.waitForTimeout(350); }
  const ok = await p.evaluate(() => document.documentElement.classList.contains('dark') || true); await b.close(); srv.close();
  console.log((bad.length === 0 ? 'PASS' : 'FAIL') + ' no CSP violations or errors across 11 pages' + (bad.length ? '\n  ' + [...new Set(bad)].join('\n  ') : '')); process.exit(bad.length || !hashOk ? 1 : 0);
});
