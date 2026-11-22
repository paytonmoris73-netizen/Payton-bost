const { chromium } = require('playwright');
// Sign-up screen as a brand-new visitor: errors, reset, Terms/Privacy sheets (contents links must not change the
// address), 'I agree', age + password rules, then sign-up. Phone and desktop.
const BASE = process.env.BASE || 'http://127.0.0.1:5199'; const URL0 = BASE + '/auth'; const tag = 'site';
(async()=>{const b=await chromium.launch();
for (const [vw,vh] of [[390,844],[1280,860]]) {
const ctx=await b.newContext({viewport:{width:vw,height:vh}}); const p=await ctx.newPage(); const errs=[]; const res=[];
const ok=(c,m)=>res.push((c?'PASS ':'FAIL ')+m);
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto(URL0); await p.waitForTimeout(1200);
ok(await p.locator('text=Welcome back').isVisible(),'auth page shows');
await p.click('button:has-text("Log in")'); await p.waitForTimeout(300); ok(await p.locator('[role=alert]').isVisible(),'empty login shows error');
await p.click('text=Forgot password?'); ok(await p.locator('text=Reset password').first().isVisible(),'reset mode'); await p.click('text=Back to log in');
await p.click('text=Create account'); await p.waitForTimeout(300);
await p.fill('#n','Mom'); await p.fill('#e','mom@example.com'); await p.fill('#p','password123'); await p.fill('#y','1968');
await p.click('button:has-text("Create account")'); await p.waitForTimeout(300); ok((await p.locator('[role=alert]').innerText()).includes('Terms'),'must accept terms error');
const urlBefore=p.url();
await p.click('button:has-text("Terms of Service")'); await p.waitForTimeout(500);
ok(await p.locator('[role=dialog] >> text=The short version').isVisible(),'terms sheet opens');
ok(!(await p.locator('input[type=checkbox]').isChecked()),'opening terms does not tick box');
const links=p.locator('[role=dialog] nav[aria-label=Contents] a'); const n=await links.count(); ok(n>3,'contents links: '+n);
for (let i=0;i<n;i++){ await links.nth(i).click(); await p.waitForTimeout(150); }
ok(p.url()===urlBefore,'contents links keep address ('+p.url().slice(-30)+')');
ok(await p.locator('[role=dialog]').isVisible(),'sheet still open after contents links');
await p.click('[role=dialog] button:has-text("I agree")'); await p.waitForTimeout(500);
ok(await p.locator('input[type=checkbox]').isChecked(),'I agree ticks box');
ok(await p.inputValue('#n')==='Mom' && await p.inputValue('#e')==='mom@example.com','form keeps typed values');
await p.click('button:has-text("Privacy Policy")'); await p.waitForTimeout(500);
ok(await p.locator('[role=dialog] >> text=What CRUNCH stores').isVisible(),'privacy sheet opens');
await p.keyboard.press('Escape'); await p.waitForTimeout(500); ok(!(await p.locator('[role=dialog]').isVisible()),'Esc closes sheet');
await p.fill('#y','2020'); await p.click('button:has-text("Create account")'); await p.waitForTimeout(400); ok(await p.locator('[role=alert]').isVisible(),'under-13 rejected');
await p.fill('#y','1968'); await p.fill('#p','short'); await p.click('button:has-text("Create account")'); await p.waitForTimeout(400); ok(await p.locator('[role=alert]').isVisible(),'weak password rejected');
await p.fill('#p','password123'); await p.click('button:has-text("Create account")'); await p.waitForTimeout(1500);
ok(!p.url().includes('auth') && await p.locator('text=/Good (morning|afternoon|evening)/').first().isVisible(),'signed in, home opens ('+p.url().slice(-12)+')');
ok(errs.length===0,'no console/page errors '+errs.join(' | '));
console.log(`== ${vw}px\n`+res.join('\n')); if (res.some((r) => r.startsWith('FAIL'))) process.exitCode = 1; await ctx.close(); }
await b.close(); console.log(process.exitCode ? 'AUTH FAIL' : 'AUTH PASS');})();
