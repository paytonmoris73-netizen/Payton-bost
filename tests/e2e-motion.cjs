// Motion + flicker check: page changes must never blank or shift; every micro-animation (add to list, cross off,
// slide-out, fly-to-cart, like, follow, sheets) must cause zero layout shift and no slow frames at 4x CPU throttle.
const { chromium } = require('playwright'); const BASE=process.env.BASE||'http://127.0.0.1:5199';
(async()=>{const b=await chromium.launch(); const out=[]; let bad=0; const rep=(ok,m)=>{ if(!ok) bad++; out.push((ok?'PASS ':'FAIL ')+m); };
for (const [name,vp,mobile] of [['phone',{width:390,height:844},true],['desktop',{width:1440,height:900},false]]) {
 const ctx=await b.newContext({viewport:vp,isMobile:mobile,hasTouch:mobile}); const p=await ctx.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.addInitScript(()=>{ window.__cls=0; window.__shifts=[]; new PerformanceObserver(l=>{for(const e of l.getEntries()){ if(!e.hadRecentInput){ window.__cls+=e.value; window.__shifts.push({v:+e.value.toFixed(4),src:(e.sources||[]).map(s=>s.node&&s.node.className&&String(s.node.className).slice(0,50)).join('|')}); } }}).observe({type:'layout-shift',buffered:true}); });
 await p.goto(BASE+'/auth'); await p.waitForTimeout(800);
 await p.click('text=Create account'); await p.fill('#n','Flicker Test'); await p.fill('#e',`f${name}${Date.now()}@x.com`); await p.fill('#p','password123'); await p.fill('#y','1990'); await p.check('input[type=checkbox]'); await p.click('button:has-text("Create account")'); await p.waitForTimeout(3500); // let preloading finish
 const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 // frame + blank-flash monitor
 const startMon=()=>p.evaluate(()=>{ window.__mon={frames:[],blank:0,last:performance.now(),run:true}; const t=(now)=>{const m=window.__mon; m.frames.push(now-m.last); m.last=now; const main=document.querySelector('main'); if(!main||main.innerText.trim().length<5) m.blank++; if(m.run) requestAnimationFrame(t);}; requestAnimationFrame(t); });
 const stopMon=()=>p.evaluate(()=>{ const m=window.__mon; m.run=false; const f=m.frames.slice(1).sort((a,b)=>a-b); return {n:f.length, p95:+(f[Math.floor(f.length*.95)]||0).toFixed(1), worst:+(f[f.length-1]||0).toFixed(1), over50:f.filter(x=>x>50).length, blank:m.blank}; });
 const cls=()=>p.evaluate(()=>{ const v=window.__cls, s=window.__shifts.slice(); window.__cls=0; window.__shifts=[]; return {v:+v.toFixed(4), s}; });
 // 1) page-to-page navigation via the real nav (client-side)
 const routes = mobile ? [['Market','/marketplace'],['Community','/community'],['Profile','/profile'],['Home','/']] : [['Food Combiner','/combiner'],['AI Chef','/chef'],['Discover','/discover'],['Recipe Marketplace','/marketplace'],['Ingredient Shop','/shop'],['Community','/community'],['My Cookbook','/cookbook'],['Shopping Lists','/lists'],['Profile','/profile'],['Home','/']];
 await cls();
 for (const [label,path] of routes) {
   await startMon(); await p.locator(mobile?`nav[aria-label=Primary] >> text="${label}"`:`aside >> text="${label}"`).first().click(); await p.waitForTimeout(900); const m=await stopMon(); const c=await cls();
   rep(m.blank<=2 && c.v<0.05, `${name} nav → ${path}: blank frames ${m.blank}, layout shift ${c.v}, worst frame ${m.worst}ms ${c.s.length?JSON.stringify(c.s.slice(0,2)):''}`);
 }
 // 2) interactions
 const act=async(label,fn,wait=900)=>{ await cls(); await startMon(); await fn(); await p.waitForTimeout(wait); const m=await stopMon(); const c=await cls();
   rep(c.v<0.02 && m.over50<=2, `${name} ${label}: layout shift ${c.v}, frames>50ms ${m.over50}, p95 ${m.p95}ms ${c.s.length?JSON.stringify(c.s.slice(0,2)):''}`); };
 await p.goto(BASE+'/recipe/r2'); await p.waitForTimeout(1200);
 const btn=p.locator('button:has-text("Add to shopping list")'); const w0=(await btn.boundingBox()).width;
 await act('add recipe to shopping list', async()=>{ await btn.click(); await p.waitForTimeout(250); });
 const w1=(await p.locator('button:has-text("Added to list")').boundingBox()).width; rep(Math.abs(w1-w0)<1, `${name} "Added" button keeps its width (${w0.toFixed(1)} → ${w1.toFixed(1)})`);
 await p.waitForTimeout(1600); rep(await p.locator('button:has-text("Add to shopping list")').isVisible(), `${name} button returns to normal`);
 await act('save heart', ()=>p.locator('button[aria-label="Save recipe"], button[aria-label="Unsave recipe"]').first().click());
 await p.goto(BASE+'/lists'); await p.waitForTimeout(1200);
 const rows0=await p.locator('li.row-in').count(); rep(rows0>=6, `${name} list has the added ingredients (${rows0})`);
 await act('add item to list', async()=>{ await p.fill('input[aria-label="Add item"]','Fresh basil'); await p.press('input[aria-label="Add item"]','Enter'); });
 await act('cross item off', ()=>p.locator('li.row-in input[type=checkbox]').first().click());
 rep(await p.locator('li.row-in .strike.on').count()===1, `${name} crossed-off item shows the line`);
 const before=await p.locator('li.row-in').count();
 await act('remove item (slide out)', ()=>p.locator('li.row-in button[aria-label^="Remove"]').first().click());
 rep(await p.locator('li.row-in').count()===before-1, `${name} item removed after animation`);
 await p.goto(BASE+'/marketplace/r1'); await p.waitForTimeout(1200);
 await act('add to cart (fly to cart)', ()=>p.locator('button:has-text("Add to cart")').click(), 1200);
 rep(await p.locator('.fly-glyph').count()===0, `${name} no leftover flying icon`);
 rep(/1/.test(await p.locator('a[aria-label^="Cart"]').innerText()), `${name} cart badge shows 1`);
 await p.goto(BASE+'/community'); await p.waitForTimeout(1200);
 await act('like a post', ()=>p.locator('button[aria-label^="Like,"]').first().click());
 await act('follow from sidebar/creators', async()=>{ const f=p.locator('button:has-text("Follow")').first(); if (await f.isVisible()) await f.click(); });
 await p.goto(BASE+'/marketplace/cart'); await p.waitForTimeout(1000);
 await act('remove from cart (slide out)', ()=>p.locator('button[aria-label^="Remove"]').first().click());
 rep(await p.locator('text=/cart is empty/i').count()>0 || !(await p.locator('button[aria-label^="Remove"]').count()), `${name} cart emptied`);
 // 3) sheet open/close
 await p.goto(BASE+'/settings'); await p.waitForTimeout(900); await p.click('button:has-text("Account"), [role=tab]:has-text("Account")');
 await act('open + cancel confirm sheet', async()=>{ await p.click('button:has-text("Erase local data")'); await p.waitForTimeout(450); await p.locator('[role=dialog] button:has-text("Cancel")').click(); }, 700);
 rep(await p.locator('[role=dialog]').count()===0, `${name} sheet fully gone after closing`);
 rep(errs.length===0, `${name} no console/page errors ${errs.slice(0,3).join(' | ')}`);
 await ctx.close();
}
console.log(out.join('\n')); console.log(bad?`\n${bad} PROBLEM(S)`:'\nMOTION PASS'); if (bad) process.exitCode = 1; await b.close();})();
