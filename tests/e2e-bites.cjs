// Bites: post from the + menu (rules gate, 60 s video limit, video autoplay, Grab, survives reload) and a photo Bite.
const { chromium } = require('playwright'); const S=require('path').join(__dirname,'fixtures'); const BASE=process.env.BASE||'http://127.0.0.1:5199';
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await ctx.newPage(); const errs=[]; const res=[]; const ok=(c,m)=>res.push((c?'PASS ':'FAIL ')+m);
p.on('pageerror',e=>errs.push(e.message)); p.on('console',x=>{if(x.type()==='error')errs.push(x.text())});
await p.goto(BASE+'/auth'); await p.click('text=Create account'); await p.fill('#n','Poster'); await p.fill('#e','po'+Date.now()+'@x.com'); await p.fill('#p','password123'); await p.fill('#y','1990'); await p.check('input[type=checkbox]'); await p.click('button:has-text("Create account")'); await p.waitForTimeout(1500);
// open from the + menu
await p.click('nav[aria-label=Primary] button[aria-label=Create]'); await p.waitForTimeout(500); await p.click('text=Post a Bite'); await p.waitForTimeout(900);
ok(await p.locator('[role=dialog] >> text=Post a Bite').first().isVisible(), '+ menu opens the Bite composer');
const file=p.locator('[role=dialog] input[type=file]');
ok(await file.isDisabled(), 'upload locked until the rules box is ticked');
await p.locator('[role=dialog] label:has-text("food or cooking only") input').check();
await file.setInputFiles(S+'/bite-75s.webm'); await p.waitForTimeout(1200);
ok(await p.locator('text=/up to 60 seconds/').first().isVisible(), '75-second video rejected');
await file.setInputFiles(S+'/bite-4s.webm'); await p.waitForTimeout(1200);
ok(await p.locator('[role=dialog] video').count()===1, 'video preview shows');
await p.fill('[role=dialog] textarea','Quick garlic noodle toss, 4 seconds of chaos');
await p.fill('[role=dialog] input[aria-label="Tag ingredients"]','garl'); await p.locator('[role=dialog] button:has-text("Garlic")').first().click();
await p.click('[role=dialog] button:has-text("Post Bite")'); await p.waitForTimeout(1500);
ok(await p.locator('[role=dialog]').count()===0, 'composer closes after posting');
const first=p.locator('.bite-slide').first();
ok((await first.innerText()).includes('Quick garlic noodle toss'), 'new Bite is first in the feed');
ok(await first.locator('video').count()===1, 'new Bite plays as a video');
await p.waitForTimeout(800);
const playing=await first.locator('video').evaluate(v=>!v.paused && v.currentTime>0).catch(()=>false); ok(playing, 'video autoplays (muted)');
// grab ingredients
await first.locator('button[aria-label="Add its ingredients to my shopping list"]:visible').click(); await p.waitForTimeout(500);
ok(await first.locator('.bite-rail:visible >> text=Added').isVisible(), 'Grab adds ingredients');
// survives reload (IndexedDB)
await p.reload(); await p.waitForTimeout(1800);
ok(await p.locator('.bite-slide').first().locator('video').count()===1, 'video still there after reload');
// photo Bite from Community
await p.goto(BASE+'/bites?new=1'); await p.waitForTimeout(900);
await p.locator('[role=dialog] label:has-text("food or cooking only") input').check(); await p.locator('[role=dialog] input[type=file]').setInputFiles(S+'/bite-photo.jpg'); await p.waitForTimeout(1200);
await p.fill('[role=dialog] textarea','Cacio e pepe, finally silky'); await p.click('[role=dialog] button:has-text("Post Bite")'); await p.waitForTimeout(1500);
ok((await p.locator('.bite-slide').first().innerText()).includes('finally silky') && await p.locator('.bite-slide').first().locator('img').count()===1, 'photo Bite posted with its photo');
await p.goto(BASE+'/community'); await p.waitForTimeout(1200);
ok(await p.locator('a[aria-label="Open in Bites"] img').first().isVisible(), 'Community shows the photo post');
ok(errs.length===0,'no errors '+errs.slice(0,3).join(' | ')); console.log(res.join('\n')); if (res.some(r=>r.startsWith('FAIL'))) process.exitCode=1; await b.close();})();
