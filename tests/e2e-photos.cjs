const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const ok = (n, v) => console.log((v ? 'PASS ' : 'FAIL ') + n);
  const tmp = path.join(require('os').tmpdir(), 'testphoto.jpg');
  const shot = await p.screenshot({ type: 'jpeg' }); fs.writeFileSync(tmp, shot);   // stand-in file, only to test the pipeline
  await p.goto('http://localhost:5199/auth'); await p.click('text=Create account');
  await p.fill('#n', 'Tester'); await p.fill('#e', 'ph@example.com'); await p.fill('#p', 'Password123!'); await p.fill('#y', '1990'); await p.check('input[type=checkbox]');
  await p.click('button:has-text("Create account")'); await p.waitForTimeout(2000);
  await p.goto('http://localhost:5199/creator/new'); await p.waitForTimeout(800);
  await p.setInputFiles('input[type=file][accept*="jpeg"]', tmp); await p.waitForSelector('img[alt="Cover preview"]');
  const src = await p.getAttribute('img[alt="Cover preview"]', 'src'); ok('upload: compressed jpeg data URL', src.startsWith('data:image/jpeg'));
  ok('upload: placeholder emoji still available', /placeholder emoji/i.test(await p.innerText('body')));
  await p.setInputFiles('input[type=file][accept*="jpeg"]', { name: 'x.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') });
  await p.waitForTimeout(300); ok('upload: wrong type rejected', /JPG, PNG or WebP/.test(await p.innerText('body')));
  ok('no page errors', errs.length === 0); await b.close();
})();
