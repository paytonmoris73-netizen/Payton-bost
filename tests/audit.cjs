// Whole-app sweep: every route x phone/desktop x light/dark. Reports console errors, failed requests,
// horizontal overflow, tiny tap targets and axe accessibility violations. Needs the dev server on :5199.
const { chromium } = require('playwright'); const fs = require('fs');
const BASE = process.env.BASE || 'http://127.0.0.1:5199';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const ROUTES = ['/', '/combiner', '/chef', '/discover', '/search?q=pasta', '/marketplace', '/marketplace/cart', '/marketplace/r2', '/recipe/r1', '/cook/r1', '/shop', '/community', '/bites', '/cookbook', '/saved', '/lists', '/messages', '/profile', '/creator/c1', '/creator/studio', '/creator/new', '/settings', '/plus', '/safety', '/terms', '/admin', '/nope'];
(async () => {
  const b = await chromium.launch(); const issues = {}; const add = (k, m) => { (issues[k] = issues[k] || new Set()).add(m); };
  for (const [vp, w, h, mobile] of [['phone', 390, 844, true], ['desktop', 1280, 860, false]]) for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, colorScheme: scheme }); const p = await ctx.newPage(); let route = '';
    const tag = () => `${vp}/${scheme} ${route}`;
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/Download the React DevTools|\[vite\]/.test(m.text())) add('console', `${tag()}: ${m.text().slice(0, 160)}`); });
    p.on('pageerror', (e) => add('pageerror', `${tag()}: ${e.message.slice(0, 160)}`));
    p.on('requestfailed', (r) => add('requestfailed', `${tag()}: ${r.url().slice(0, 100)}`));
    p.on('response', (r) => { if (r.status() >= 400 && !/\/api\//.test(r.url())) add('http', `${tag()}: ${r.status()} ${r.url().slice(0, 100)}`); });
    await p.goto(BASE + '/auth'); await p.click('text=Create account'); await p.fill('#n', 'Auditor'); await p.fill('#e', `a${vp}${scheme}@example.com`); await p.fill('#p', 'Password123!'); await p.fill('#y', '1990'); await p.check('input[type=checkbox]');
    await p.click('button:has-text("Create account")'); await p.waitForTimeout(1200);
    for (const r of ROUTES) {
      route = r; await p.goto(BASE + r, { waitUntil: 'load' }); await p.waitForTimeout(450);
      const res = await p.evaluate(async (axeSrc) => {
        const out = {}; out.overflow = document.documentElement.scrollWidth - innerWidth;
        out.noAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).length;
        out.small = [...document.querySelectorAll('button, a[href], input, select, [role=button]')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (b.height < 32 || b.width < 32) && getComputedStyle(e).visibility !== 'hidden' && e.type !== 'checkbox' && e.type !== 'radio' && !e.closest('[aria-hidden=true]') && !(getComputedStyle(e, '::after').position === 'absolute' && getComputedStyle(e, '::after').content === '""'); }).length;
        if (!window.axe) { const s = document.createElement('script'); s.textContent = axeSrc; document.head.appendChild(s); }
        const a = await window.axe.run(document, { resultTypes: ['violations'] });
        out.axe = a.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target?.join(' ').slice(0, 70) }));
        return out;
      }, AXE).catch((e) => ({ err: e.message }));
      if (res.err) { add('audit-error', `${tag()}: ${res.err.slice(0, 100)}`); continue; }
      if (res.overflow > 1) add('overflow', `${tag()}: +${res.overflow}px`);
      if (res.noAlt) add('img-no-alt', `${tag()}: ${res.noAlt}`);
      if (vp === 'phone' && res.small > 0) add('tiny-targets(<32px)', `${tag()}: ${res.small}`);
      for (const v of res.axe) add('axe:' + v.id + ' (' + v.impact + ')', `${tag()} x${v.n} e.g. ${v.sample}`);
    }
    await ctx.close();
  }
  await b.close();
  const keys = Object.keys(issues).sort(); if (!keys.length) console.log('CLEAN: no issues found');
  for (const k of keys) { const arr = [...issues[k]]; console.log(`\n## ${k}  (${arr.length})`); arr.slice(0, 6).forEach((x) => console.log('  ' + x)); if (arr.length > 6) console.log(`  ... +${arr.length - 6} more`); }
})();
