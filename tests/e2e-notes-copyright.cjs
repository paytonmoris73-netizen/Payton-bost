const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs=[];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5199/auth'); await p.click('text=Create account');
  await p.fill('#n','Test Chef'); await p.fill('#e','t@example.com'); await p.fill('#p','Password123!'); await p.fill('#y','1990'); await p.check('input[type=checkbox]');
  await p.click('button:has-text("Create account")'); await p.waitForTimeout(1500);
  await p.goto('http://localhost:5199/recipe/r2'); await p.waitForSelector('textarea[aria-label="Private notes"]');
  await p.fill('textarea[aria-label="Private notes"]','extra garlic'); await p.selectOption('select[aria-label="Cooking status"]','cooked');
  await p.reload(); await p.waitForSelector('textarea[aria-label="Private notes"]');
  console.log('note persisted:', await p.inputValue('textarea[aria-label="Private notes"]'), '| status:', await p.inputValue('select[aria-label="Cooking status"]'));
  await p.click('button:has-text("Report")'); await p.check('text=copyright complaint'); await p.fill('textarea[placeholder^="Identify"]','Copied from my blog'); await p.click('button:has-text("Send report")');
  console.log('report stored:', JSON.stringify(JSON.parse(await p.evaluate(()=>localStorage.getItem('crunch-v1'))).state.reports.map(r=>[r.kind,r.reason])));
  await p.goto('http://localhost:5199/cookbook'); await p.selectOption('select[aria-label="Filter by cooking status"]','cooked'); await p.click('button:has-text("Saved")'); await p.waitForTimeout(500);
  console.log('cooked-filter shows r2 card:', await p.locator('a[href*="r2"]').count()>0);
  console.log('page errors:', errs.length, errs.slice(0,2));
  await b.close();
})();
