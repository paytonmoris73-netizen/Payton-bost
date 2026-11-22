// Cookbook journeys: private notes + cooking status persist, status filter works, copyright complaint is filed.
// (Replaces two older scripts that drove a native <select> the app no longer uses.)
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:5199';
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); let fails = 0; const ok = (n, v) => { console.log((v ? 'PASS ' : 'FAIL ') + n); if (!v) fails++; };
  const pick = async (label, option) => { await p.click(`button[aria-label="${label}"]`); await p.click(`[role=option]:has-text("${option}")`); await p.waitForTimeout(200); };
  await p.goto(BASE + '/auth'); await p.click('text=Create account'); await p.fill('#n', 'Cook Book'); await p.fill('#e', 'cb@example.com'); await p.fill('#p', 'Password123!'); await p.fill('#y', '1990'); await p.check('input[type=checkbox]'); await p.click('button:has-text("Create account")'); await p.waitForTimeout(1200);
  await p.goto(BASE + '/recipe/r2'); await p.waitForSelector('textarea[aria-label="Private notes"]');
  await p.fill('textarea[aria-label="Private notes"]', 'extra garlic'); await p.click('button[aria-label="Save recipe"]'); await pick('Cooking status', 'Cooked');
  await p.reload(); await p.waitForSelector('textarea[aria-label="Private notes"]');
  ok('private note persists after reload', (await p.inputValue('textarea[aria-label="Private notes"]')) === 'extra garlic');
  ok('cooking status persists after reload', /Cooked/.test(await p.locator('button[aria-label="Cooking status"]').innerText()));
  await p.click('button:has-text("Report")'); await p.waitForSelector('text=Scam or bait-and-switch');
  await p.check('text=copyright complaint'); await p.fill('textarea[aria-label="Details"]', 'Copied from my blog, same photos and text.'); await p.click('button:has-text("Send report")'); await p.waitForTimeout(400);
  const reports = await p.evaluate(() => JSON.parse(localStorage.getItem('crunch-v1')).state.reports.map((r) => [r.kind, r.category, r.reason]));
  ok('copyright complaint is stored with its category', reports.some((r) => r[0] === 'copyright' && r[1] === 'stolen' && /^\[COPYRIGHT\]/.test(r[2])));
  await p.goto(BASE + '/saved'); await p.waitForTimeout(500);
  ok('saved page lists the saved recipe', await p.locator('a[href*="/recipe/r2"]').count() > 0);
  await pick('Filter by cooking status', 'Planned'); ok('status filter "Planned" hides a Cooked recipe', await p.locator('a[href*="/recipe/r2"]').count() === 0);
  await pick('Filter by cooking status', 'Cooked'); ok('status filter "Cooked" shows it', await p.locator('a[href*="/recipe/r2"]').count() > 0);
  ok('no page errors', errs.length === 0); await b.close(); console.log(fails ? `\n${fails} FAILED` : '\nCOOKBOOK PASS'); process.exit(fails ? 1 : 0);
})();
