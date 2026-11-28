// Motion & performance settings: slow-device detection, Reduce Motion / Transparency, FPS meter, persistence.
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:5199';
(async () => {
  const b = await chromium.launch(); let fails = 0; const ok = (n, v) => { console.log((v ? 'PASS ' : 'FAIL ') + n); if (!v) fails++; };
  const signUp = async (p, email) => { await p.goto(BASE + '/auth'); await p.click('text=Create account'); await p.fill('#n', 'Perf Settings'); await p.fill('#e', email); await p.fill('#p', 'Password123!'); await p.fill('#y', '1990'); await p.check('input[type=checkbox]'); await p.click('button:has-text("Create account")'); await p.waitForTimeout(1200); };
  const cls = (p) => p.evaluate(() => document.documentElement.className);

  // iPhone 8 (iOS <= 16) starts in the cheap renderer automatically; a current iPhone gets full quality.
  const old = await b.newContext({ ...devices['iPhone 8'], userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' });
  const p = await old.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await signUp(p, 'perf-old@example.com');
  ok('iOS 16 iPhone starts in Smooth (lite) mode', /\bfx-lite\b/.test(await cls(p)));
  ok('lite mode has no live blur', await p.evaluate(() => ![...document.querySelectorAll('*')].some((e) => { const s = getComputedStyle(e).backdropFilter; return s && s !== 'none'; })));
  const modern = await b.newContext({ ...devices['iPhone 15 Pro'] }); const q = await modern.newPage();
  await signUp(q, 'perf-new@example.com'); ok('current iPhone starts in Quality mode', !/\bfx-lite\b/.test(await cls(q)));

  await p.goto(BASE + '/settings'); await p.click('button:has-text("Appearance")'); await p.waitForTimeout(300);
  ok('Motion & performance section shown', await p.isVisible('#perf-h'));
  await p.click('[role=radiogroup][aria-label="Motion"] >> text=Reduced'); await p.waitForTimeout(150);
  ok('Reduce motion applies instantly', /\breduce-motion\b/.test(await cls(p)));
  ok('reduced motion: page transitions become fades', await p.evaluate(() => { const d = document.createElement('div'); d.className = 'sheet-in'; document.body.appendChild(d); const n = getComputedStyle(d).animationName; d.remove(); return n === 'fadeIn'; }));
  await p.click('[role=switch][aria-label="Reduce transparency"]'); await p.waitForTimeout(150);
  ok('Reduce transparency makes cards opaque', await p.evaluate(() => { const c = document.querySelector('.card'); return /rgb\(\d+, \d+, \d+\)$/.test(getComputedStyle(c).backgroundColor); }));
  await p.click('[role=switch][aria-label="Show frame rate"]'); await p.waitForTimeout(1300);
  ok('FPS meter shows a reading', /\d+ fps/.test((await p.textContent('.fps-meter')) || ''));
  await p.click('[role=switch][aria-label="Autoplay videos in Bites"]'); await p.waitForTimeout(150);
  await p.click('[role=radiogroup][aria-label="Graphics quality"] >> text=Quality'); await p.waitForTimeout(150);
  ok('choosing Quality overrides detection', !/\bfx-lite\b/.test(await cls(p)));
  await p.reload(); await p.waitForTimeout(800);
  const c = await cls(p); const saved = JSON.parse(await p.evaluate(() => localStorage.getItem('crunch-perf')));
  ok('all choices survive a reload', /reduce-motion/.test(c) && /reduce-transparency/.test(c) && !/fx-lite/.test(c) && saved.autoplay === false && !!(await p.$('.fps-meter')));
  await p.click('button:has-text("Appearance")'); await p.click('section[aria-labelledby=perf-h] button:has-text("Reset")'); await p.waitForTimeout(200);
  ok('reset returns to recommended (Smooth on this phone, no overrides)', /\bfx-lite\b/.test(await cls(p)) && !/reduce-motion|reduce-transparency/.test(await cls(p)) && !(await p.$('.fps-meter')));
  ok('no page errors', errs.length === 0); if (errs.length) console.log(errs);
  await b.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();
