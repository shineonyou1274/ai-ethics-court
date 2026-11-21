const { chromium, devices } = require('playwright');
const [, , out, size = 'iphone', mode = 'clean', rm = ''] = process.argv; const url = `http://127.0.0.1:${process.env.PORT || 8123}/`; const OLD = process.env.OLD==='1';
const job=process.env.JOB;
const phone = { iphone: devices['iPhone 13'], se: devices['iPhone 8'], tiny: devices['iPhone SE'] }[size];
const opt = phone ? { ...phone, deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } }; delete opt.defaultBrowserType;
(async () => {
  const tag0 = `${size}-${mode}${rm}`;
  const shot = (o) => (process.env.SHOTS === '0' ? null : p.screenshot({...o,timeout:45000}));
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=metal'] });
  const ctx = await b.newContext({ ...opt, reducedMotion: rm === 'reduced' ? 'reduce' : 'no-preference', ...(process.env.VIDEO === '0' ? {} : { recordVideo: { dir: out + '/video-' + tag0, size: {width:320,height:Math.round(320*opt.viewport.height/opt.viewport.width)} } }) });
  const p = await ctx.newPage(); p.setDefaultTimeout(20000); const cdp = phone ? await ctx.newCDPSession(p) : null;
  const tch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type==='touchEnd'?[]:[{ x: Math.round(x), y: Math.round(y), id: 1 }] });
  const dn = async (x,y) => { if (phone) await tch('touchStart',x,y); else { await p.mouse.move(x,y); await p.mouse.down(); } };
  const mv = async (x,y,steps=6) => { if (phone) { const s0 = mv.last||{x,y}; for (let i=1;i<=steps;i++) await tch('touchMove', s0.x+(x-s0.x)*i/steps, s0.y+(y-s0.y)*i/steps); } else await p.mouse.move(x,y,{steps}); mv.last={x,y}; };
  const up = async () => { if (phone) await tch('touchEnd'); else await p.mouse.up(); };
  const press = async (sel) => { const l = p.locator(sel).first(); if (phone) await l.tap(); else await l.click(); };
  const metrics = []; const tl = (l) => phone ? l.tap() : l.click();
  const measure = (h) => p.evaluate((h) => { const vw=innerWidth, vh=innerHeight; const cv=document.querySelector('canvas'); const cb=cv?cv.getBoundingClientRect():null; const btns=[...document.querySelectorAll('#panel button, #panel .choice, .mark.goal')].filter(b=>b.offsetParent); const small=btns.map(b=>({t:(b.textContent||'').trim().slice(0,18),fs:parseFloat(getComputedStyle(b).fontSize)})).filter(o=>o.fs<16); const main=document.querySelector('#walkGo, #nx, #go, #ok, #keep'); let covered=null, offscreen=null; if(main){const r=main.getBoundingClientRect(); offscreen = r.bottom>vh+1||r.top<0; const el=document.elementFromPoint(r.left+r.width/2, Math.min(vh-1,r.top+r.height/2)); covered = el && !main.contains(el) && el!==main ? (el.id||el.className||el.tagName) : null;} const ps=document.querySelector('#panel'); return {h, canvasH: cb?Math.round(cb.height):0, canvasPct: cb?Math.round(cb.height/vh*100):0, appCls: document.querySelector('#app')?.className, small, mainBtn: main?main.id:null, covered, offscreen, panelScroll: ps? ps.scrollHeight-ps.clientHeight:0, over: document.documentElement.scrollWidth - vw,
 nOpts: document.querySelectorAll('#panel .choice').length, optsCut: [...document.querySelectorAll('#panel .choice')].filter(c=>{const r=c.getBoundingClientRect(); return r.bottom>vh+1;}).map(c=>c.textContent.trim().slice(0,14)),
 hud: (()=>{const hd=document.querySelector('#hud'); if(!hd||hd.hidden) return null; const kids=[...hd.children].filter(k=>k.offsetParent); const tops=new Set(kids.map(k=>Math.round(k.getBoundingClientRect().top/6))); const ck=document.querySelector('#clock'); const r=hd.getBoundingClientRect(); return {rows:tops.size, h:Math.round(r.height), bottom:Math.round(r.bottom), clock: ck.innerText.replace(/\n/g,'/'), clockCut: ck.scrollWidth>ck.clientWidth+1, smallCut: (()=>{const sm=ck.querySelector('small'); if(!sm) return null; const a=sm.getBoundingClientRect(), b=ck.getBoundingClientRect(); return a.right>b.right+1||a.bottom>b.bottom+1;})(), hudOverflow: hd.scrollWidth>hd.clientWidth+1};})(),
 walk: (()=>{const wg=document.querySelector('#walkGo'); if(!wg) return null; const hint=document.querySelector('.walkHint'); const lis=[...document.querySelectorAll('.inbox li')]; const wr=wg.getBoundingClientRect(); const nowLi=document.querySelector('.inbox li.now, .inbox li.fresh'); let nowCovered=null; if(nowLi){const r=nowLi.getBoundingClientRect(); nowCovered = r.bottom>wr.top-1 || r.bottom>vh;} const more=document.querySelector('.inbox .more, .inboxMore'); return {hintShown: hint? getComputedStyle(hint).display!=='none':null, hintText: hint?hint.textContent:null, tight: !!document.querySelector('.walkHint.tight'), lis: lis.map(l=>l.innerText.replace(/\n/g,' ')), inboxText: (document.querySelector('#inboxBox')||{}).innerText, nowCovered, walkVar: document.querySelector('#app').style.getPropertyValue('--walk'), notice: (document.querySelector('.notice')||{}).innerText||null, head: (document.querySelector('#panel h2')||{}).innerText};})(),
 me: (()=>{const m=document.querySelector('.mark.me'), g=document.querySelector('.mark.goal'); if(!m) return null; const a=m.getBoundingClientRect(); const cv=document.querySelector('canvas').getBoundingClientRect(); const vis=getComputedStyle(m).visibility!=='hidden' && m.offsetParent!==null && a.bottom<=cv.bottom+1 && a.top>=cv.top-1; let ov=false; if(g&&g.offsetParent){const b=g.getBoundingClientRect(); ov=a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;} return {vis, ov};})()
 }; }, h).then(m=>metrics.push(m));
  const errs = []; let over = 0; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  await p.addInitScript(() => { try { sessionStorage.setItem('cd-test', '1'); } catch {} });
  if(OLD) await p.route('**/career-day/', route=>route.fulfill({path:process.env.BEFORE_HTML,contentType:'text/html'}));
  await p.goto(url,{waitUntil:'load'}); await p.waitForTimeout(1200);
  await press('a.place[href*="hospital"]'); await p.waitForTimeout(2200);
  await shot({ path: `${out}/${tag0}-home.png` }); await press(' .job[data-id='+job+']'); await p.waitForTimeout(600);
  // 사람처럼 누르기: 폰은 손가락(touch), PC는 마우스
  const tapAt = async (x, y) => { if (phone) await p.touchscreen.tap(x, y); else { await p.mouse.move(x, y, { steps: 4 }); await p.mouse.down(); await p.mouse.up(); } };
  const P = (x, y, z) => p.evaluate(([x, y, z]) => window.__cd.world().closeProject(x, y, z), [x, y, z]);
  const W = (x, y, z) => p.evaluate(([x, y, z]) => window.__cd.world().project(x, y, z), [x, y, z]);
  const dragTo = async (from, to, snap) => { const a = await P(...from), c = await P(...to); mv.last=null; await dn(a.x, a.y); mv.last={x:a.x,y:a.y}; await mv((a.x + c.x) / 2, (a.y + c.y) / 2, 6); await mv(c.x, c.y, 6); await p.waitForTimeout(60); if (snap) await shot({ path: snap }); await up(); await p.waitForTimeout(250); };
  const rub = async (blobs, y) => { for (const [x, z, r] of blobs) { let first = true; for (let dz = -r; dz <= r + 0.01; dz += 0.14) { for (const dx of (Math.round((dz + r) / 0.14) % 2 ? [r, -r] : [-r, r])) { const q = await P(x + dx, y, z + dz); if (first) { mv.last=null; await dn(q.x, q.y); mv.last={x:q.x,y:q.y}; first = false; } else await mv(q.x, q.y, 5); } } await up(); await p.waitForTimeout(150); } };
  const transfer = async route => {
    const x = i => (i-(route.length-1)/2)*1.8;
    for(const [i,slot] of route.entries()) await dragTo([x(i),.78,1],[x(slot),.78,-.9],out+'/'+tag0+'-drag-'+i+'.png');
  };
  const stages = {
    '나가기 전에 한 번 더':()=>transfer([1,0]),
    '가온 님 상담 준비':()=>transfer([1,0]),
    '창구를 잠깐 비우기 전에':()=>transfer([1,2,0]),
    '바뀐 진료실 안내':()=>transfer([1,0]),
    '서우 님과 외출 경로 짚기':()=>transfer([1,0]),
    '치료를 마친 자리':async()=>{
      await rub([[-1.8,.4,.33],[-1,.25,.32],[-.5,.7,.24]],.555);
      for(const [x,z,to] of [[.6,1.25,.35],[1.4,1.35,1.3],[2.2,1.25,2.25]]) await dragTo([x,.13,z],[to,.72,-1.35]);
    },
  };
  async function walk(){
    await press('#walkGo');
    await p.waitForFunction(()=>!document.querySelector('#walkGo'),null,{timeout:15000});
  }
  const seen = [];
  for (let step = 0; step < 120; step++) {
    await p.waitForTimeout(350); over = Math.max(over, await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    const h = (await p.evaluate(() => document.querySelector('#panel h2, #panel h1')?.textContent || '')).trim(); // 기다리지 않고 지금 있는 제목만 읽는다 (가는 길 화면에는 제목이 없다)
    const tag = `${String(step).padStart(2, '0')}`;
    const travel = await p.evaluate(() => document.querySelector('.travelCard b')?.textContent);
    if (travel) { await shot({ path: `${out}/${tag0}-${tag}-travel.png` }); console.log(tag, '가는 길:', travel); await p.waitForTimeout(2000); continue; }
    if (await p.locator('#walkGo').count()) {
      console.log(tag, '[걷기]', h, '|', await p.locator('#clock').textContent(), '| 알림:', (await p.locator('.notice').allTextContents()).join(' ') || '-', '| 받은 일:', (await p.locator('.inbox li').allTextContents()).join(' / '));
      await measure('[walk] '+h); await walk(tag, h); continue;
    }
    if (!seen.includes(h)) { seen.push(h); await measure(h); await shot({ path: `${out}/${tag0}-${tag}.png` }); console.log(tag, h, '|', (await p.locator('#clock').textContent().catch(() => '')), (await p.locator('#money').textContent().catch(() => ''))); }
    if (await p.locator('#go').count() && !(await p.locator('#stay').count())) { await press('#go'); continue; }
    if (await p.locator('#hands').count() && !(await p.locator('#nx').count())) {
      if (await p.locator('.handsDone').count()) continue;
      await p.waitForTimeout(1900); // 폰에서 손 놀이 자리로 내려가는 걸 기다린다
      if(OLD){await shot({path:out+'/before.png'}); await b.close(); return;}
      const run = stages[h]; if (!run) throw new Error('모르는 손 장면: ' + h);
      await shot({ path: `${out}/${tag0}-${tag}-start.png` });
      await run(); await p.waitForTimeout(1200);
      await shot({ path: `${out}/${tag0}-${tag}-end.png` });
      console.log('   손 놀이:', await p.locator('#cuMsg').textContent(), '→', (await p.locator('#out .reply').textContent().catch(() => '(결과 없음)')), '| 할 일', await p.locator('.todo li.done').count(), '/', await p.locator('.todo li').count());
      await press('#nx'); continue;
    }
    if (await p.locator('#stay').count()) { await press(mode === 'messy' ? '#stay' : '#go'); await p.waitForTimeout(900); continue; }
    if (await p.locator('.record.closed').count()) { while (await p.locator('.record.closed').count()) await tl(p.locator('.record.closed').first()); await press('#nx'); continue; }
    if (await p.locator('#ok').count() && await p.locator('#ok').isVisible()) { const c = p.locator('.choice'); for (const i of (mode === 'messy' ? [0, 1, 3] : [0, 1, 2])) await tl(c.nth(i)); await press('#ok'); await p.waitForTimeout(300); await press('#nx'); continue; }
    if (await p.locator('.moment').count()) {
      await tl(p.locator('.moment').nth(mode === 'messy' ? 3 : 1)); await tl(p.locator('.moment').nth(mode === 'messy' ? 0 : 4)); await p.waitForTimeout(200);
      await shot({ path: `${out}/${tag0}-reflect.png`, fullPage: false });
      console.log('   순간:', await p.locator('.moment').allTextContents());
      await press('#keep'); await p.waitForTimeout(600); await shot({ path: `${out}/${tag0}-done.png` });
      console.log('   마침:', (await p.locator('#panel h2').first().textContent()), '|', await p.locator('#panel .link').allTextContents());
      break;
    }
    if (await p.locator('#nx').count() && await p.locator('#nx').isEnabled()) { await press('#nx'); continue; }
    const ch = p.locator('#panel .choice:not(.done):not([disabled])');
    if (await ch.count()) {
      if (await ch.first().getAttribute('data-i') !== null && !await p.locator('#opts,#ok').count()) { const ids=await ch.evaluateAll(bs=>bs.map(b=>+b.dataset.i)); await tl(ch.nth(ids.indexOf(Math.min(...ids)))); continue; }
      const n = await ch.count(), isChoice = await p.locator('#opts').count();
      // 판단: clean 은 시장에서 "오후에 다시 오겠다"(약속)를 고르고, 불을 끈 뒤 약속을 지키러 간다. messy 는 약속하고 지키지 않는다
      let k = isChoice ? (mode === 'messy' ? Math.min(n - 1, 2) : 0) : step % n;
      if (isChoice) { const labels = await ch.allTextContents(); const want = labels.findIndex((t) => (mode === 'clean' ? /약속대로|다시 와서 설명하겠다고/ : /다시 와서 설명하겠다고/).test(t)); if (want >= 0) k = want; }
      if (phone) await ch.nth(k).tap(); else await ch.nth(k).click(); continue;
    }
  }
  const rec = await p.evaluate(() => JSON.parse(localStorage.getItem('workday-records-v1') || '[]'));
  console.log('기록', JSON.stringify(rec.map((r) => ({ app: r.app, place: r.place, job: r.job, pay: r.pay?.total, ending: r.ending, like: r.like, hard: r.hard }))));
  console.log('가로 밀림(최대 px)', over); 
  console.log('errors', errs); require('fs').writeFileSync(`${out}/${tag0}-metrics.json`, JSON.stringify(metrics,null,1));
  if(!rec.length || errs.length || over) throw Error(JSON.stringify({errs,over,records:rec.length}));
  const v = p.video(); await ctx.close(); if (v) console.log('영상', await v.path()); await b.close();
})().catch((e) => { console.error('실패', e); process.exit(1); });
