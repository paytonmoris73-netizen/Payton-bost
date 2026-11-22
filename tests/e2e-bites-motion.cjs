// Bites motion: opening, swiping (4x CPU throttle), leaving: no blank frames, no layout shift, one Bite on screen, scroll unlocked after.
const { chromium } = require('playwright'); const BASE=process.env.BASE||'http://127.0.0.1:5199';
(async()=>{const b=await chromium.launch(); const res=[]; const ok=(c,m)=>res.push((c?'PASS ':'FAIL ')+m);
for (const [n,vp,m] of [['phone',{width:390,height:844},true],['pc',{width:1440,height:900},false]]) {
 const ctx=await b.newContext({viewport:vp,isMobile:m,hasTouch:m}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{ window.__cls=0; new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput) window.__cls+=e.value;}).observe({type:'layout-shift',buffered:true}); });
 await p.goto(BASE+'/auth'); await p.click('text=Create account'); await p.fill('#n','Swipe'); await p.fill('#e',n+Date.now()+'@x.com'); await p.fill('#p','password123'); await p.fill('#y','1990'); await p.check('input[type=checkbox]'); await p.click('button:has-text("Create account")'); await p.waitForTimeout(3000);
 const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const mon=async(fn,ms)=>{ await p.evaluate(()=>{window.__cls=0; window.__m={f:[],l:performance.now(),r:true,blank:0}; const t=(x)=>{const M=window.__m; M.f.push(x-M.l); M.l=x; const s=document.querySelector('.bites'); const mn=document.querySelector('main'); if(!s && (!mn || mn.innerText.trim().length<5)) M.blank++; if(M.r) requestAnimationFrame(t);}; requestAnimationFrame(t);}); await fn(); await p.waitForTimeout(ms);
   return p.evaluate(()=>{const M=window.__m; M.r=false; const f=M.f.slice(1).sort((a,b)=>a-b); return {cls:+window.__cls.toFixed(4), over50:f.filter(x=>x>50).length, p95:+f[Math.floor(f.length*.95)].toFixed(1), blank:M.blank};}); };
 // enter Bites from Community
 await p.goto(BASE+'/community'); await p.waitForTimeout(1200);
 let r=await mon(()=>p.click('a:has-text("Watch Bites")'),1200); ok(r.cls<0.02 && r.blank<=2, `${n} open Bites: layout shift ${r.cls}, blank frames ${r.blank}`);
 for (let i=0;i<4;i++){ r=await mon(()=> m ? p.evaluate(()=>document.querySelector('.bites .snap-y').scrollBy({top:innerHeight,behavior:'smooth'})) : p.keyboard.press('ArrowDown'), 900);
   ok(r.cls<0.02 && r.over50<=3, `${n} swipe ${i+1}: layout shift ${r.cls}, slow frames ${r.over50}, p95 ${r.p95}ms`); }
 const vis=await p.evaluate(()=>[...document.querySelectorAll('.bite-slide')].filter(s=>{const b=s.getBoundingClientRect(); return b.top<innerHeight*0.5 && b.bottom>innerHeight*0.5;}).length); ok(vis===1, `${n} exactly one Bite on screen after swiping`);
 const mounted=await p.evaluate(()=>document.querySelectorAll('.bite-slide img, .bite-slide video').length); ok(mounted<=3, `${n} only nearby media kept in memory (${mounted})`);
 // leave Bites
 r=await mon(async()=>{ if (m) await p.click('nav[aria-label=Primary] >> text="Home"'); else await p.click('aside >> text="Home"'); },1200);
 ok(r.cls<0.05, `${n} leave Bites: layout shift ${r.cls}`); ok(await p.evaluate(()=>!document.querySelector('.bites') && getComputedStyle(document.documentElement).overflow!=='hidden'), `${n} Bites fully removed and page scroll unlocked`);
 ok(errs.length===0, `${n} no errors ${errs.join('|')}`); await ctx.close(); }
console.log(res.join('\n')); if (res.some(r=>r.startsWith('FAIL'))) process.exitCode=1; await b.close();})();
