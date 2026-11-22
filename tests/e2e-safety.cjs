const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:5199';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const ok = (n, v) => { console.log((v ? 'PASS ' : 'FAIL ') + n); if (!v) process.exitCode = 1; };
  const signup = async (name, email) => {
    await p.goto(BASE + '/auth'); await p.click('text=Create account');
    await p.fill('#n', name); await p.fill('#e', email); await p.fill('#p', 'Password123!'); await p.fill('#y', '1990'); await p.check('input[type=checkbox]');
    await p.click('button:has-text("Create account")'); await p.waitForTimeout(1500);
  };
  await signup('Admin', 'admin@example.com');
  await p.goto(BASE + '/safety'); await p.waitForSelector('text=Safety Center');
  let body = await p.innerText('body');
  ok('safety center: rules, ladder, wall, warning', /Safety Promise/.test(body) && /Strike 3/.test(body) && /Wall of Removed Scams/.test(body) && /Thinking about scamming/.test(body));
  ok('safety center: scam = permanent ban, false report = 2nd offence', /Scamming: 1 strike = permanent ban/.test(body) && /False reports: banned on the 2nd offence/.test(body));
  ok('safety center: nav link present', await p.locator('a[href="/safety"]').count() > 0);
  await p.screenshot({ path: process.env.SHOT || '/tmp/safety.png', fullPage: true });

  // switch to a brand-new (non-admin) account
  await p.evaluate(() => { const k = 'crunch-v1'; const v = JSON.parse(localStorage.getItem(k)); v.state.session = null; localStorage.setItem(k, JSON.stringify(v)); });
  await signup('Newbie', 'newbie@example.com');
  await p.goto(BASE + '/creator/new'); await p.waitForSelector('#rt');
  body = await p.innerText('body'); ok('editor: scam warning shown', /Before you post/.test(body));
  await p.fill('#rt', 'Totally normal rice'); await p.fill('#rd', 'A simple rice dish for a weeknight dinner at home.');
  const ings = p.locator('input[aria-label="Ingredient"]'); const amts = p.locator('input[aria-label="Amount"]');
  await ings.nth(0).fill('bleach'); await amts.nth(0).fill('1 cup'); await ings.nth(1).fill('rice'); await amts.nth(1).fill('1 cup');
  await p.locator('textarea[aria-label="Step 1"]').fill('Mix everything in a pot and heat gently for ten minutes.'); await p.locator('textarea[aria-label="Step 2"]').fill('Serve warm with a little salt and some fresh herbs on top.');
  await p.locator('input[type=checkbox]').last().check(); await p.click('button:has-text("Publish")'); await p.waitForTimeout(500);
  body = await p.innerText('body'); ok('editor: toxic ingredient refuses publish', /toxic substance/.test(body) && /can't be published/.test(body));
  await ings.nth(0).fill('butter'); await p.click('button:has-text("Publish")'); await p.waitForURL('**/creator/studio'); await p.waitForTimeout(500);
  body = await p.innerText('body'); ok('studio: new account recipe waits for review', /Waiting for safety review/.test(body));
  ok('banner/notice mentions review', /waiting for a safety review/.test(body));
  await p.screenshot({ path: (process.env.SHOT || '/tmp/safety.png').replace('.png', '-studio.png') });

  // report dialog on a seeded recipe
  await p.goto(BASE + '/recipe/r2'); await p.waitForSelector('button:has-text("Report")'); await p.click('button:has-text("Report")');
  await p.waitForSelector('text=Scam or bait-and-switch'); body = await p.innerText('body');
  ok('report dialog: categories + false-report ban warning', /Unsafe or harmful/.test(body) && /I \(or someone\) got sick/.test(body) && /permanent ban the second/.test(body));
  await p.click('text=Scam or bait-and-switch'); await p.fill('textarea[aria-label="Details"]', 'Photo does not match the recipe at all'); await p.click('button:has-text("Send report")');
  await p.waitForTimeout(500); ok('report: accepted', /Moderators will review/.test(await p.innerText('body')));
  await p.click('button:has-text("Report")'); await p.waitForSelector('text=Scam or bait-and-switch'); await p.fill('textarea[aria-label="Details"]', 'Photo does not match the recipe at all'); await p.click('button:has-text("Send report")');
  await p.waitForTimeout(400); ok('report: duplicate refused', /already reported/.test(await p.innerText('body')));

  // community composer + post scan
  await p.goto(BASE + '/community'); await p.click('button:has-text("Share something")'); await p.fill('textarea[aria-label="Post text"]', 'Try my bleach and rice dinner'); await p.click('button:has-text("Post")'); await p.waitForTimeout(400);
  ok('community: dangerous post refused', /Not posted/.test(await p.innerText('body')));
  ok('community: no scam warning on the posting form (it lives on selling)', !/Before you post/.test(await p.innerText('body')));


  // ---- Terms of Service (public, no login needed) ----
  const anon = await ctx.newPage(); await anon.goto(BASE + '/terms'); await anon.waitForSelector('text=Terms of Service'); const tb = await anon.innerText('body');
  ok('terms: public page loads without login', /Terms of Service/.test(tb) && !/Create account/.test(tb));
  ok('terms: own-risk food responsibility + food poisoning', /cook at your own risk/i.test(tb) && /Food poisoning and unsafe food advice are not okay/.test(tb) && /responsible for[\s\S]*recipe you buy/i.test(tb));
  ok('terms: massive prohibited list', (await anon.locator('#prohibited li').count()) >= 80);
  ok('terms: scam ban, false report ban, refunds both sides', /permanently banned immediately/.test(tb) && /Refunds we give/.test(tb) && /Refunds we don't give/.test(tb));
  await anon.goto(BASE + '/terms#refunds'); await anon.waitForTimeout(300); ok('terms: #refunds anchor scrolls', await anon.evaluate(() => document.getElementById('refunds').getBoundingClientRect().top < 200));
  await anon.close();
  await p.goto(BASE + '/auth'); await p.evaluate(() => {}); 

  // ---- refunds (as Newbie) ----
  await p.evaluate(() => { const k = 'crunch-v1'; const v = JSON.parse(localStorage.getItem(k)); v.state.session = v.state.accounts.find((a) => a.name === 'Newbie').id; v.state.purchases = [{ id: 'ord_test1', recipeIds: ['r3'], total: 4.5, at: new Date().toISOString(), status: 'paid', method: 'demo', unitPrices: { r3: 4.5 } }]; localStorage.setItem(k, JSON.stringify(v)); });
  await p.goto(BASE + '/marketplace/cart'); await p.waitForSelector('text=Request refund'); await p.click('button:has-text("Request refund")');
  await p.waitForSelector('text=What went wrong?'); await p.click('text=I changed my mind');
  body = await p.innerText('body'); ok('refund: not-covered reason is refused clearly', /isn't covered by our refund policy/.test(body) && await p.locator('button:has-text("Send request")').isDisabled());
  await p.click('text=It doesn\'t match the title'); await p.fill('textarea[aria-label="Details"]', 'The photo shows lasagne but this is just plain pasta.'); await p.click('button:has-text("Send request")'); await p.waitForTimeout(400);
  ok('refund: covered reason goes to review', /Refund under review/.test(await p.innerText('body')));

  // admin console
  await p.evaluate(() => { const k = 'crunch-v1'; const v = JSON.parse(localStorage.getItem(k)); v.state.session = v.state.accounts.find((a) => a.role === 'admin').id; localStorage.setItem(k, JSON.stringify(v)); });
  await p.goto(BASE + '/admin'); await p.click('button:has-text("Safety")'); await p.waitForTimeout(400);
  body = await p.innerText('body'); ok('admin safety tab: held recipe listed with actions', /Held for review/.test(body) && /Totally normal rice/.test(body) && /Remove \+ strike/.test(body));
  await p.click('button:has-text("Approve")'); await p.waitForTimeout(300); ok('admin: approve clears the queue', /Nothing waiting/.test(await p.innerText('body')));
  await p.click('button:has-text("Refunds")'); await p.waitForTimeout(300); ok('admin refunds: request shown with reason', /ord_test1/.test(await p.innerText('body')) && /match the title/.test(await p.innerText('body')));
  await p.click('button:has-text("Approve refund")'); await p.waitForTimeout(300); ok('admin refunds: approve works', /approved/.test(await p.innerText('body')));
  await p.click('button:has-text("Reports")'); await p.waitForTimeout(300); body = await p.innerText('body'); ok('admin reports: category + weight shown + punish options', /Scam or bait-and-switch/.test(body) && /weight ×/.test(body) && /PERMANENT BAN/.test(body) && /False report \(punish\)/.test(body));
  await p.screenshot({ path: (process.env.SHOT || '/tmp/safety.png').replace('.png', '-admin.png') });
  ok('no page errors', errs.length === 0); if (errs.length) console.log(errs);
  await b.close();
})();
