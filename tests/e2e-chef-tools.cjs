const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const ok = (n, v) => console.log((v ? 'PASS ' : 'FAIL ') + n);
  await p.goto('http://localhost:5199/auth'); await p.click('text=Create account');
  await p.fill('#n', 'Tester'); await p.fill('#e', 'chef@example.com'); await p.fill('#p', 'Password123!'); await p.fill('#y', '1990'); await p.check('input[type=checkbox]');
  await p.click('button:has-text("Create account")'); await p.waitForTimeout(2000);
  // Improve tool
  await p.goto('http://localhost:5199/chef?tab=improve');
  await p.fill('#ii', '2 chicken breast\n1 cup cream\n2 tbsp honey\n1 cup rice'); await p.fill('#is', 'Cook the chicken until golden.\nAdd cream and honey.');
  await p.click('button:has-text("Make it vegan")'); await p.click('button:has-text("Make it less sweet")'); await p.click('button:has-text("Analyse and improve")');
  await p.waitForSelector('text=Improved');
  const body = await p.innerText('body');
  ok('improve: original kept', /Original[\s\S]*2 chicken breast/i.test(body));
  ok('improve: vegan swaps applied', /Coconut cream/.test(body) && /Maple syrup/.test(body) && /tofu/i.test(body));
  ok('improve: step text updated', /Cook the extra-firm tofu/.test(body));
  ok('improve: findings shown', /What I noticed/.test(body));
  // Substitutions with allergy
  await p.goto('http://localhost:5199/chef?tab=substitute');
  await p.fill('#sq', 'butter'); await p.fill('#sa', 'soy');
  const sb = await p.innerText('body');
  ok('subst: olive oil offered', /Olive oil/.test(sb));
  ok('subst: soy vegan butter blocked with reason', /Not suggested for you/.test(sb) && /Contains soy/.test(sb));
  await p.fill('#sq', 'unobtainium'); ok('subst: unknown handled', /don't have a tested substitution/.test(await p.innerText('body')));
  // Ingredient DB
  await p.goto('http://localhost:5199/combiner'); await p.waitForTimeout(800);
  await p.fill('input[placeholder*="earch"]', 'pistachio'); await p.waitForTimeout(400);
  ok('db: new ingredient searchable', /Pistachios/.test(await p.innerText('body')));
  // No emoji used as UI icons on key pages
  await p.goto('http://localhost:5199/recipe/r2'); await p.waitForTimeout(800);
  const rb = await p.innerText('body'); ok('recipe page: no chrome emoji (🛒📁✅▶★)', !/[🛒📁✅▶★☆⏱]/.test(rb));
  ok('no page errors', errs.length === 0);
  await b.close();
})();
