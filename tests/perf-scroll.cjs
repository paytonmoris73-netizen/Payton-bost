// Scroll-smoothness probe: signs up, scrolls the heaviest pages with 4x CPU throttle, reports frame times.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:5199';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
  await p.goto(BASE + '/auth'); await p.click('text=Create account'); await p.fill('#n', 'Perf Tester'); await p.fill('#e', 'perf@example.com'); await p.fill('#p', 'Password123!'); await p.fill('#y', '1990'); await p.check('input[type=checkbox]');
  await p.click('button:has-text("Create account")'); await p.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const out = {};
  for (const path of ['/', '/marketplace', '/community', '/discover']) {
    await p.goto(BASE + path); await p.waitForTimeout(1500);
    const r = await p.evaluate(async () => {
      const frames = []; let last = performance.now(); let run = true;
      const tick = (t) => { frames.push(t - last); last = t; if (run) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
      const h = document.documentElement.scrollHeight - innerHeight; const start = performance.now();
      await new Promise((res) => { const step = () => { const k = Math.min(1, (performance.now() - start) / 2500); scrollTo(0, h * k); k < 1 ? requestAnimationFrame(step) : res(); }; step(); });
      run = false; frames.shift(); frames.sort((a, b) => a - b);
      return { n: frames.length, p50: +frames[Math.floor(frames.length / 2)].toFixed(1), p95: +frames[Math.floor(frames.length * 0.95)].toFixed(1), worst: +frames[frames.length - 1].toFixed(1), over33: frames.filter((f) => f > 33).length, h };
    });
    out[path] = r;
  }
  const blur = await p.evaluate(() => [...document.querySelectorAll('*')].filter((e) => { const s = getComputedStyle(e); return (s.backdropFilter && s.backdropFilter !== 'none'); }).length);
  console.log(JSON.stringify({ liveBlurElements: blur, pages: out }, null, 1)); await b.close();
})();
