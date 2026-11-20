// 의사(5층 외과)·환경미화 직원(1층 로비)의 하루(카페 방식)를 실제 포인터 조작으로 첫 화면부터 끝까지 해 보며 녹화한다 (shared/CHECKLIST.md A3~A7, A10, A14, A17).
// e2e-nurse.cjs 와 같은 방법: 걸어가기는 3D 바닥·노란 장소 표시·'걸어가기' 단추를 번갈아 누르고, 손 장면은 실제로 끌고 문지른다.
//
//   1) node workday-site/build.mjs && python3 -m http.server 8123 --directory workday-site/public
//   2) node career-day/test/e2e-hosp.cjs <결과 폴더> <doctor|cleaner> <iphone|se|tiny|pc> <clean|messy> [reduced]
//        clean: (의사) 하늘 님께 약속하고 지킨다 / messy: 약속하고 못 지키며, 손 장면마다 한 번씩 틀리고, 다른 방 바닥도 눌러 보고, 남아서 마친다
//        SHOTS=0 은 스크린샷 없이, VIDEO=0 은 영상 없이. PORT 로 포트를 바꾼다
//   3) node shared/tools/flicker.cjs <결과 폴더>/video-*/*.webm
const { chromium, devices } = require('playwright');
const [, , out, JOB = 'doctor', size = 'iphone', mode = 'clean', rm = ''] = process.argv; const url = `http://localhost:${process.env.PORT || 8123}/`; const OLD = process.env.OLD==='1';
const phone = { iphone: devices['iPhone 13'], se: devices['iPhone 8'], tiny: devices['iPhone SE'] }[size];
const opt = phone ? { ...phone, deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } }; delete opt.defaultBrowserType;
(async () => {
  const tag0 = `${JOB}-${size}-${mode}${rm}`;
  const shot = (o) => (process.env.SHOTS === '0' ? null : p.screenshot(o));
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...opt, reducedMotion: rm === 'reduced' ? 'reduce' : 'no-preference', ...(process.env.VIDEO === '0' ? {} : { recordVideo: { dir: out + '/video-' + tag0, size: opt.viewport } }) });
  const p = await ctx.newPage(); const cdp = phone ? await ctx.newCDPSession(p) : null;
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
  await p.goto(url); await p.waitForTimeout(1200);
  await press('a.place[href*="hospital"]'); await p.waitForTimeout(2200);
  await shot({ path: `${out}/${tag0}-home.png` }); await press(`.job[data-id="${JOB}"]`); await p.waitForTimeout(600);
  // 사람처럼 누르기: 폰은 손가락(touch), PC는 마우스
  const tapAt = async (x, y) => { if (phone) await p.touchscreen.tap(x, y); else { await p.mouse.move(x, y, { steps: 4 }); await p.mouse.down(); await p.mouse.up(); } };
  const P = (x, y, z) => p.evaluate(([x, y, z]) => window.__cd.world().closeProject(x, y, z), [x, y, z]);
  const W = (x, y, z) => p.evaluate(([x, y, z]) => window.__cd.world().project(x, y, z), [x, y, z]);
  const dragTo = async (from, to, snap) => { const a = await P(...from), c = await P(...to); mv.last=null; await dn(a.x, a.y); mv.last={x:a.x,y:a.y}; await mv((a.x + c.x) / 2, (a.y + c.y) / 2, 6); await mv(c.x, c.y, 6); await p.waitForTimeout(60); if (snap) await shot({ path: snap }); await up(); await p.waitForTimeout(250); };
  // 문지르기: [x, z, rx, rz] 네모 안을 지그재그로 (rz 를 빼면 rx 와 같음)
  const rub = async (blobs, y) => { for (const [x, z, rx, rz0] of blobs) { const rz = rz0 ?? rx; let first = true; for (let dz = -rz; dz <= rz + 0.01; dz += Math.min(0.12, Math.max(0.05, rz))) { for (const dx of (Math.round((dz + rz) / 0.12) % 2 ? [rx, -rx] : [-rx, rx])) { const q = await P(x + dx, y, z + dz); if (first) { mv.last=null; await dn(q.x, q.y); mv.last={x:q.x,y:q.y}; first = false; } else await mv(q.x, q.y, 5); } } await up(); await p.waitForTimeout(150); } };
  const line = async (x, y, z0, z1) => { const a = await P(x, y, z0); mv.last=null; await dn(a.x, a.y); mv.last={x:a.x,y:a.y}; for (let k = 1; k <= 6; k++) { const q = await P(x, y, z0 + (z1 - z0) * k / 6); await mv(q.x, q.y, 3); } await up(); await p.waitForTimeout(150); };
  const S = (n) => `${out}/${tag0}-${n}.png`;
  const ME = [0.1, 0.82, -0.55];
  const stages = {
    // ── 의사 ──
    '병실에 들어가기 전, 손부터': async () => {
      await shot({ path: S('wash-start3d') });
      if (mode === 'messy') await dragTo([1.85, 1.13, 1.0], [0.38, 1.12, -1.5]); // 다 문지르기 전에 수도꼭지부터 (막힘, 서두름)
      if (mode === 'messy') await rub([[0.85, 0.18, 0.2]], 0.965); // 손바닥보다 손등 먼저 (막힘, 안내만)
      for (const b of [[-0.85, 0.12, 0.22], [0.85, 0.18, 0.22], [-0.85, -0.45, 0.25, 0.16], [0.85, -0.27, 0.3, 0.09], [-0.4, 0.02, 0.1], [0.85, -0.7, 0.3, 0.09]]) await rub([b], 0.965);
      await shot({ path: S('wash-rubbed') });
      await dragTo([1.85, 1.13, 1.0], [0.38, 1.12, -1.5], S('wash-towel')); await p.waitForTimeout(300);
      await shot({ path: S('wash-done3d') });
    },
    '이분이 하늘 님이 맞나요?': async () => {
      await shot({ path: S('band-start3d') });
      if (mode === 'messy') await dragTo([0.35, 0.76, 1.55], [0, 0.9, -0.15], S('band-wrongdrag')); // 이름만 같은 2번 침대 (틀림)
      await dragTo([0.35, 0.76, 1.55], [1.9, 0.9, -0.15], S('band-dragging')); await p.waitForTimeout(300);
      await shot({ path: S('band-done3d') });
    },
    '수술실, 나를 먼저 준비해요': async () => {
      await shot({ path: S('gown-start3d') });
      if (mode === 'messy') await dragTo([-1.4, 0.82, 1.2], ME); // 가운부터 (막힘)
      await dragTo([-2.25, 0.82, 1.2], ME, S('gown-capdrag'));
      await rub([[1.62, 0.45, 0.26, 0.3], [2.28, 0.45, 0.26, 0.3]], 0.965);
      await dragTo([-1.4, 0.82, 1.2], ME);
      await dragTo([-0.55, 0.82, 1.2], ME); await p.waitForTimeout(300);
      await shot({ path: S('gown-done3d') });
    },
    '연습 패드로 다섯 땀': async () => {
      await shot({ path: S('suture-start3d') });
      if (mode === 'messy') await dragTo([2.1, 0.84, 1.0], [1.2, 0.84, 0.45]); // 다 꿰매기 전에 가위 (막힘)
      for (const x of [-1.2, -0.6, 0, 0.6, 1.2]) await line(x, 0.905, -0.4, 0.32);
      await shot({ path: S('suture-sewn') });
      await dragTo([2.1, 0.84, 1.0], [1.2, 0.84, 0.45]); await p.waitForTimeout(300);
      await shot({ path: S('suture-done3d') });
    },
    // ── 환경미화 직원 ──
    '손이 많이 닿는 곳부터': async () => {
      await shot({ path: S('wipe-start3d') });
      if (mode === 'messy') { await rub([[1.62, -1.83, 0.16, 0.06]], 0.905); await dragTo([-2.1, 0.73, 1.3], [2.2, 0.75, 1.2]); } // 손잡이부터(막힘), 티슈부터 버리기(틀림)
      await rub([[-2.3, -1.2, 0.3, 0.27]], 0.905);
      await rub([[-0.42, 0.0, 0.8, 0.05]], 0.905);
      await rub([[1.62, -1.83, 0.18, 0.08]], 0.905);
      await shot({ path: S('wipe-rubbed') });
      await dragTo([-2.1, 0.73, 1.3], [2.2, 0.75, 1.2], S('wipe-bagdrag')); await p.waitForTimeout(300);
      await shot({ path: S('wipe-done3d') });
    },
    '수거차가 오기 전에': async () => {
      await shot({ path: S('waste-start3d') });
      if (mode === 'messy') await dragTo([-0.65, 0.72, 1.35], [-2.1, 0.95, -0.85], S('waste-wrongdrag')); // 페트병을 일반에 (틀림)
      await dragTo([-1.9, 0.72, 1.35], [2.1, 0.95, -0.85], S('waste-dragging'));
      await dragTo([-0.65, 0.72, 1.35], [-0.7, 0.95, -0.85]);
      await dragTo([0.65, 0.72, 1.35], [-2.1, 0.95, -0.85]);
      await dragTo([1.9, 0.72, 1.35], [0.7, 0.95, -0.85]); await p.waitForTimeout(300);
      await shot({ path: S('waste-done3d') });
    },
    '로비 바닥이 젖었어요': async () => {
      await shot({ path: S('mop-start3d') });
      if (mode === 'messy') await rub([[1.45, 0.95, 0.22]], 0.03); // 안내판 없이 닦기 시작 (위험)
      await dragTo([-2.1, 0, 1.35], [-1.05, 0, 0.15], S('mop-signdrag'));
      await rub([[0.4, 0.05, 0.9, 0.66], [-0.7, 0.55, 0.42], [1.45, 0.95, 0.24], [1.85, 1.4, 0.22]], 0.03);
      await shot({ path: S('mop-done3d') });
    },
  };
  // 걸어가기: 세 가지 방법을 돌아가며 쓴다. ① 3D의 노란 장소 표시 누르기 ② 갈 곳의 바닥 누르기 ③ 아래 '걸어가기' 단추. messy 에서는 한 번 다른 방 바닥을 먼저 눌러 본다
  let walks = 0, strayed = false;
  async function walk(tag, h) {
    const goal = await p.evaluate(() => window.__cd.goal());
    const how = walks % 3; walks++;
    if (!goal) { await shot({ path: `${out}/${tag0}-${tag}-go.png` }); console.log(`   ${tag} 걸음 없음 → 단추: ${await p.locator('#walkGo').textContent()}`); await press('#walkGo'); return; }
    await shot({ path: `${out}/${tag0}-${tag}-walk.png` });
    if (mode === 'messy' && !strayed && goal.id !== 'lounge') { // 다른 방(대기실) 바닥을 눌러 본다
      strayed = true; const q = await W(1.7, 0, 3.3); await tapAt(q.x, q.y);
      for (let k = 0; k < 60 && !(await p.evaluate(() => document.querySelector('#walkMsg')?.classList.contains('note'))); k++) await p.waitForTimeout(250); // 그 방에 닿아 안내가 바뀔 때까지
      console.log('   다른 방을 눌렀을 때:', await p.evaluate(() => document.querySelector('#walkMsg')?.textContent || '(안내 없음: ' + document.querySelector('#panel h2')?.textContent + ')')); await shot({ path: `${out}/${tag0}-${tag}-stray.png` });
    }
    const before = await p.evaluate(() => window.__cd.world().where());
    if (how === 0) { const bb = await p.locator('.mark.goal').boundingBox(); await tapAt(bb.x + bb.width / 2, bb.y + bb.height / 2); }
    else if (how === 1) { const q = await W(goal.x + 0.3, 0, goal.z + 0.2); await tapAt(q.x, q.y); }
    else await press('#walkGo');
    await p.waitForTimeout(700); await shot({ path: `${out}/${tag0}-${tag}-walking.png` });
    const mid = await p.evaluate(() => window.__cd.world()?.where?.());
    for (let k = 0; k < 40 && await p.locator('#walkGo').count(); k++) await p.waitForTimeout(250);
    console.log(`   ${tag} 걸어감(${['장소 표시', '바닥', '단추'][how]}) → ${goal.id} (${before.x.toFixed(1)},${before.z.toFixed(1)}) → 중간 (${mid ? mid.x.toFixed(1) + ',' + mid.z.toFixed(1) : '-'})`);
    if (await p.locator('#walkGo').count()) throw new Error('걸어서 닿지 못함: ' + h);
  }
  const seen = [];
  for (let step = 0; step < 120; step++) {
    await p.waitForTimeout(350); over = Math.max(over, await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    const h = (await p.evaluate(() => document.querySelector('#panel h2, #panel h1')?.textContent || '')).trim(); // 기다리지 않고 지금 있는 제목만 읽는다 (가는 길 화면에는 제목이 없다)
    const tag = `${String(step).padStart(2, '0')}`;
    const travel = await p.evaluate(() => document.querySelector('.travelCard b')?.textContent);
    if (travel) { await shot({ path: `${out}/${tag0}-${tag}-travel.png` }); console.log(tag, '가는 길:', travel); await p.waitForTimeout(2000); continue; }
    if (await p.locator('#walkGo').count()) {
      console.log(tag, '[걷기]', h, '|', await p.locator('#clock').textContent(), '| 알림:', (await p.locator('.notice').textContent().catch(() => '')) || '-', '| 받은 일:', (await p.locator('.inbox li').allTextContents()).join(' / '));
      await measure('[walk] '+h); await walk(tag, h); continue;
    }
    if (!seen.includes(h)) { seen.push(h); await measure(h); await shot({ path: `${out}/${tag0}-${tag}.png` }); console.log(tag, h, '|', (await p.locator('#clock').textContent().catch(() => '')), (await p.locator('#money').textContent().catch(() => ''))); }
    if (await p.locator('#go').count() && !(await p.locator('#stay').count())) { await press('#go'); continue; }
    if (await p.locator('#hands').count() && !(await p.locator('#nx').count())) {
      if (await p.locator('.handsDone').count()) continue;
      await p.waitForTimeout(1900); // 폰에서 손 놀이 자리로 내려가는 걸 기다린다
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
      const n = await ch.count(), isChoice = await p.locator('#opts').count();
      // 판단: clean 은 시장에서 "오후에 다시 오겠다"(약속)를 고르고, 불을 끈 뒤 약속을 지키러 간다. messy 는 약속하고 지키지 않는다
      let k = isChoice ? (mode === 'messy' ? Math.min(n - 1, 2) : 0) : step % n;
      if (isChoice) { const labels = await ch.allTextContents(); const want = labels.findIndex((t) => (mode === 'clean' ? /약속대로 내가|마저 듣겠다고 약속/ : /마저 듣겠다고 약속/).test(t)); if (want >= 0) k = want; }
      if (phone) await ch.nth(k).tap(); else await ch.nth(k).click(); continue;
    }
  }
  const rec = await p.evaluate(() => JSON.parse(localStorage.getItem('workday-records-v1') || '[]'));
  console.log('기록', JSON.stringify(rec.map((r) => ({ app: r.app, place: r.place, job: r.job, pay: r.pay?.total, ending: r.ending, like: r.like, hard: r.hard }))));
  console.log('가로 밀림(최대 px)', over); await p.goto(url); await p.waitForTimeout(900); console.log('첫 화면으로 돌아옴: 도장', await p.evaluate((n) => !!document.querySelector(`[aria-label="${n} 출근 완료"]`), { doctor: '의사', cleaner: '환경미화 직원' }[JOB]));
  console.log('errors', errs); require('fs').writeFileSync(`${out}/${tag0}-metrics.json`, JSON.stringify(metrics,null,1));
  const v = p.video(); await ctx.close(); if (v) console.log('영상', await v.path()); await b.close();
})().catch((e) => { console.error('실패', e); process.exit(1); });
