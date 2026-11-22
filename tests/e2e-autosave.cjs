// Nothing typed is lost: Settings autosaves, and the recipe editor restores unsaved work after a tab switch / reload / navigation.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:5199';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); let fails = 0; const ok = (n, v) => { console.log((v ? 'PASS ' : 'FAIL ') + n); if (!v) fails++; };
  const me = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('crunch-v1')).state; return s.accounts.find((a) => a.id === s.session); });
  await p.goto(BASE + '/auth'); await p.click('text=Create account'); await p.fill('#n', 'Auto Saver'); await p.fill('#e', 'as@example.com'); await p.fill('#p', 'Password123!'); await p.fill('#y', '1990'); await p.check('input[type=checkbox]'); await p.click('button:has-text("Create account")'); await p.waitForTimeout(1200);

  // --- Settings: type, switch tab WITHOUT pressing save ---
  await p.goto(BASE + '/settings'); await p.fill('#sb', 'I love cooking noodles'); await p.click('button:has-text("Food preferences")'); await p.waitForTimeout(150);
  ok('settings: edit is saved when switching tabs (no Save press)', (await me()).bio === 'I love cooking noodles');
  await p.click('button:has-text("Profile")'); await p.fill('#sn', 'Auto Saver Two'); await p.waitForTimeout(1000); ok('settings: debounced autosave after typing stops', (await me()).name === 'Auto Saver Two');
  ok('settings: shows "All changes saved"', /All changes saved/.test(await p.innerText('body')));
  await p.fill('#sh', 'bad handle'); await p.waitForTimeout(900); ok('settings: invalid handle is NOT saved and explains why', (await me()).handle !== 'bad handle' && /handle must look like/i.test(await p.innerText('body')));
  await p.fill('#sb', 'bio typed then leave page'); await p.fill('#sh', '@autosaver'); await p.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await p.goto(BASE + '/community'); await p.waitForTimeout(300); ok('settings: leaving the page saves pending edits', (await me()).bio === 'bio typed then leave page');

  // --- Recipe editor: draft survives switching tabs, reload and navigation ---
  await p.goto(BASE + '/creator/new'); await p.waitForSelector('#rt'); await p.fill('#rt', 'My Draft Soup'); await p.fill('#rd', 'A cozy soup I am still writing up for everyone.');
  await p.locator('input[aria-label="Ingredient"]').first().fill('carrots'); await p.locator('input[aria-label="Amount"]').first().fill('3');
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }); // what the browser fires when you switch tabs (headless Chrome never hides a page by itself); read storage immediately, before the 500ms debounce
  const stored = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('crunch-recipe-draft')).map((k) => JSON.parse(localStorage.getItem(k)).r.title));
  ok('editor: draft written to storage the moment the tab is hidden', stored.includes('My Draft Soup')); await p.evaluate(() => { delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
  await p.reload(); await p.waitForSelector('#rt'); ok('editor: draft restored after reload', (await p.inputValue('#rt')) === 'My Draft Soup' && (await p.inputValue('#rd')).includes('cozy soup') && /Restored your unsaved work/.test(await p.innerText('body')));
  ok('editor: ingredient restored', (await p.locator('input[aria-label="Ingredient"]').first().inputValue()) === 'carrots');
  await p.goto(BASE + '/'); await p.goto(BASE + '/creator/new'); await p.waitForSelector('#rt'); ok('editor: draft restored after navigating away and back', (await p.inputValue('#rt')) === 'My Draft Soup');
  await p.click('button:has-text("Save draft")'); await p.waitForTimeout(600);
  const left = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('crunch-recipe-draft')).length); ok('editor: draft storage cleared after a successful save', left === 0);
  await p.goto(BASE + '/creator/new'); await p.waitForSelector('#rt'); ok('editor: new recipe form starts empty after saving', (await p.inputValue('#rt')) === '');
  await p.fill('#rt', 'Throwaway'); await p.waitForTimeout(700); await p.reload(); await p.waitForSelector('#rt'); await p.click('button:has-text("Discard")'); await p.waitForSelector('#rt'); await p.waitForTimeout(400);
  ok('editor: "Discard & start over" clears the draft', (await p.inputValue('#rt')) === '' && !/Restored/.test(await p.innerText('body')));
  ok('no page errors', errs.length === 0); await b.close(); console.log(fails ? `\n${fails} FAILED` : '\nAUTOSAVE PASS'); process.exit(fails ? 1 : 0);
})();
