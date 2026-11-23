// 약사·원무행정 직원·소방관(그리고 다른 걷는 직업의 기록 장면)을 실제 손가락·마우스로 첫 화면부터 해 보며 녹화한다.
// e2e-department.cjs·e2e-fire.cjs 를 합쳐 고쳤다: 폰은 모두 손가락(touch, CDP)으로 누르고 끈다. PC는 한 걸음씩 움직이는 마우스.
//
//   1) node workday-site/build.mjs && python3 -m http.server 8123 --directory workday-site/public
//   2) node career-day/test/e2e-polish.cjs <결과 폴더> <직업> <iphone|se|tiny|pc> <clean|messy> [reduced]
//        iphone = iPhone 13(390×664), se = iPhone 8(375×667), tiny = iPhone SE(320×568)
//        clean: 순서대로 한다 / messy: 손 장면마다 순서를 어기고 틀린 곳에도 놓아 본다, 남아서 마친다
//        KEEP=1: messy 에서도 약사의 15시 상담 약속을 지킨다(상담 장면을 거친다)
//        UNTIL=records: 기록 장면을 재고 나면 멈춘다. SHOTS=0 은 스크린샷 없이, VIDEO=0 은 영상 없이. PORT 로 포트를 바꾼다
//   3) node shared/tools/flicker.cjs <결과 폴더>/video-*/*.webm
// 3D 좌표를 화면 좌표로 바꾸려고 검사 표시(cd-test)를 쓴다. 상태를 바꾸지는 않는다. 누르기와 끌기는 모두 실제 입력으로 한다.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const [, , out, job = 'pharmacist', size = 'iphone', mode = 'clean', rm = ''] = process.argv;
if (!out) { console.error('사용법: node test/e2e-polish.cjs <저장 폴더> <직업> <크기> <clean|messy> [reduced]'); process.exit(1); }
const url = `http://127.0.0.1:${process.env.PORT || 8123}/`; const KEEP = process.env.KEEP === '1'; const UNTIL = process.env.UNTIL || '';
const phone = { iphone: devices['iPhone 13'], se: devices['iPhone 8'], tiny: devices['iPhone SE'] }[size];
const opt = phone ? { ...phone, deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } }; delete opt.defaultBrowserType;
const FIRE = job === 'firefighter';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const tag0 = `${job}-${size}-${mode}${rm}`;
  const shot = (o) => (process.env.SHOTS === '0' ? null : p.screenshot({ ...o, timeout: 45000 }));
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...opt, reducedMotion: rm === 'reduced' ? 'reduce' : 'no-preference', ...(process.env.VIDEO === '0' ? {} : { recordVideo: { dir: `${out}/video-${tag0}`, size: opt.viewport } }) });
  const p = await ctx.newPage(); p.setDefaultTimeout(20000); const cdp = phone ? await ctx.newCDPSession(p) : null;
  const tch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: Math.round(x), y: Math.round(y), id: 1 }] });
  const dn = async (x, y) => { if (phone) await tch('touchStart', x, y); else { await p.mouse.move(x, y, { steps: 3 }); await p.mouse.down(); } };
  const mv = async (x, y, steps = 6) => { if (phone) { const s0 = mv.last || { x, y }; for (let i = 1; i <= steps; i++) await tch('touchMove', s0.x + (x - s0.x) * i / steps, s0.y + (y - s0.y) * i / steps); } else await p.mouse.move(x, y, { steps }); mv.last = { x, y }; };
  const up = async () => { if (phone) await tch('touchEnd'); else await p.mouse.up(); };
  const tl = (l) => (phone ? l.tap() : l.click());
  const press = (sel) => tl(p.locator(sel).first());
  const metrics = [];
  const measure = (h) => p.evaluate((h) => {
    const vw = innerWidth, vh = innerHeight; const cv = document.querySelector('canvas'); const cb = cv ? cv.getBoundingClientRect() : null;
    const vis = (el) => { if (!el || !el.offsetParent) return null; const r = el.getBoundingClientRect(); return r.top >= -1 && r.bottom <= vh + 1; };
    const main = [...document.querySelectorAll('#walkGo, #nx, #go, #ok, #keep, #stay')].filter((x) => x.offsetParent);
    const ps = document.querySelector('#panel'); const ck = document.querySelector('#clock');
    const name = ck?.querySelector('i');
    return {
      h, canvasH: cb ? Math.round(cb.height) : 0, canvasDvh: cb ? Math.round(cb.height / vh * 100) : 0, canvasTopHidden: cb ? Math.round(document.querySelector('#hud')?.getBoundingClientRect().bottom - cb.top) : 0,
      appCls: document.querySelector('#app')?.className, pick: document.querySelector('#app').style.getPropertyValue('--pick'),
      main: main.map((m) => ({ id: m.id, vis: vis(m), bottom: Math.round(m.getBoundingClientRect().bottom) })),
      opts: [...document.querySelectorAll('#panel .choice')].filter((c) => c.offsetParent).map((c) => vis(c)),
      panelScroll: ps ? ps.scrollHeight - ps.clientHeight : 0, panelTop: ps ? ps.scrollTop : 0, over: document.documentElement.scrollWidth - vw,
      hud: ck && !document.querySelector('#hud').hidden ? { text: ck.innerText.replace(/\n/g, '/'), clockCut: ck.scrollWidth > ck.clientWidth + 1, nameCut: name ? (name.scrollWidth > name.clientWidth + 1 || name.getBoundingClientRect().right > ck.getBoundingClientRect().right + 1 || getComputedStyle(name).display === 'none') : null, hudOverflow: document.querySelector('#hud').scrollWidth > document.querySelector('#hud').clientWidth + 1 } : null,
    };
  }, h).then((m) => { metrics.push(m); return m; });
  const errs = []; let over = 0; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  await p.addInitScript(() => { try { sessionStorage.setItem('cd-test', '1'); } catch {} });
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  await press(FIRE ? 'a.place.fire, a.place[href*="fire"]' : 'a.place[href*="hospital"]'); await p.waitForTimeout(2200);
  if (FIRE && !(await p.locator(`.job[data-id="${job}"]`).count())) { await press('.placeTab[data-place="fire-station"]'); await p.waitForTimeout(1200); }
  await shot({ path: `${out}/${tag0}-home.png` });
  await measure('home');
  await press(`.job[data-id="${job}"]`); await p.waitForTimeout(600);
  const tapAt = async (x, y) => { if (phone) await p.touchscreen.tap(x, y); else { await p.mouse.move(x, y, { steps: 4 }); await p.mouse.down(); await p.mouse.up(); } };
  const P = (x, y, z) => p.evaluate(([x, y, z]) => window.__cd.world().closeProject(x, y, z), [x, y, z]);
  const W = (x, y, z) => p.evaluate(([x, y, z]) => window.__cd.world().project(x, y, z), [x, y, z]);
  const dragTo = async (from, to, snap) => { const a = await P(...from), c = await P(...to); mv.last = null; await dn(a.x, a.y); mv.last = { x: a.x, y: a.y }; await mv((a.x + c.x) / 2, (a.y + c.y) / 2, 6); await mv(c.x, c.y, 6); await p.waitForTimeout(80); if (snap) await shot({ path: snap }); await up(); await p.waitForTimeout(300); };
  const rub = async (blobs, y) => { for (const [x, z, r] of blobs) { let first = true; for (let dz = -r; dz <= r + 0.01; dz += 0.14) { for (const dx of (Math.round((dz + r) / 0.14) % 2 ? [r, -r] : [-r, r])) { const q = await P(x + dx, y, z + dz); if (first) { mv.last = null; await dn(q.x, q.y); mv.last = { x: q.x, y: q.y }; first = false; } else await mv(q.x, q.y, 5); } } await up(); await p.waitForTimeout(150); } };
  const tap3 = async (loc, snap) => { const q = await P(...loc); await tapAt(q.x, q.y); await p.waitForTimeout(350); if (snap) await shot({ path: snap }); };
  const msg = () => p.locator('#cuMsg').innerText();
  const S = (n) => `${out}/${tag0}-${n}.png`;
  const expect = async (word, label) => { const t = await msg(); console.log(`   [${label}] ${t}`); if (!t.includes(word)) throw new Error(`${label}: "${word}" 없음 → ${t}`); await shot({ path: S(label) }); };
  const stages = {
    // ── 약사 ──
    '나가기 전에 한 번 더': async () => {
      const stamp = [-1.75, 0.82, 1.44]; const button = (name) => tl(p.getByRole('button', { name, exact: true }));
      if (mode === 'messy') { await button('봉투 인계'); await dragTo(stamp, [1.32, 0.81, -0.72]); }
      await button('다음 줄'); await dragTo(stamp, [1.32, 0.81, -0.04]); await button('다음 줄');
      await dragTo(stamp, [1.32, 0.81, 0.64]); await button('봉투 인계');
    },
    '가온 님 상담 준비': async () => {
      const NB = [-1.6, 0.9, 0.6], NAME = [0.35, 1.2, 0.43], DOSE = [0.35, 1.1, 0.78], DAYS = [0.35, 1.0, 1.14], ENV = [2.0, 0.84, 1.2], INBOX = [1.85, 0.95, -0.75], GAON = [-0.5, 0.86, -0.75];
      await shot({ path: S('counsel-start') });
      if (mode === 'messy') { await tap3(DOSE); await expect('수첩', 'counsel-early'); } // 수첩보다 봉투의 줄 먼저 (막힘)
      await tap3(NB); await p.waitForTimeout(700); await shot({ path: S('counsel-open') }); // 수첩 펼치기
      if (mode === 'messy') {
        await tap3(NAME); await expect('이름', 'counsel-wrongline'); // 이름 줄 (틀림)
        await dragTo(ENV, INBOX); await expect('질문 ①', 'counsel-envearly'); // 봉투 먼저 (막힘)
        await tap3(DAYS); await expect('보관', 'counsel-wrongline2'); // 기간 줄 (틀림)
      }
      await tap3(DOSE, S('counsel-dose'));
      if (mode === 'messy') { await dragTo(ENV, GAON, S('counsel-envdrag-wrong')); await expect('의료진', 'counsel-wrongtray'); }
      await dragTo(ENV, INBOX, S('counsel-envdrag'));
      await p.waitForTimeout(600); await shot({ path: S('counsel-done') });
    },
    // ── 원무행정 ──
    '창구를 잠깐 비우기 전에': async () => {
      const src = [-1.18, 0.78, 1.12], lock = [1.55, 1, 1.62];
      if (mode === 'messy') { await tap3(lock); await dragTo(src, [1.8, 0.81, -0.82]); }
      for (const x of [-1.8, -1.8, 0, 0, 1.8, 1.8]) await dragTo(src, [x, 0.81, -0.82]); await tap3(lock);
    },
    '바뀐 진료실 안내': async () => {
      const UP = [-1.3, 0.08, 1.6], ARR = [0, 0.08, 1.6], S2E = [-1.0, 0.14, 0.55], S2D = [0.4, 0.14, 0.55], S3E = [-1.0, 0.14, -0.9], S3D = [2.05, 0.14, -0.9];
      await shot({ path: S('route-start') });
      if (mode === 'messy') {
        await dragTo(ARR, S3D); await expect('승강기', 'route-early'); // 도착 표지 먼저 (막힘)
        await dragTo(UP, S2D, S('route-wrong-drag')); await expect('옛 진료실', 'route-wrong'); // 2층 옛 진료실 앞 (틀림)
        await dragTo(UP, S3E); await expect('3층 승강기', 'route-wrong3e'); // 3층 승강기 앞 (틀림)
      }
      await dragTo(UP, S2E, S('route-up-drag'));
      if (mode === 'messy') { await dragTo(ARR, S2D); await expect('옛 진료실', 'route-wrong2'); }
      await dragTo(ARR, S3D, S('route-arrive-drag'));
      await p.waitForTimeout(1500); await shot({ path: S('route-walking') }); await p.waitForTimeout(3500); await shot({ path: S('route-done') });
    },
    // ── 소방관 (e2e-fire.cjs 와 같은 자리) ──
    '교대 점검, 장비는 제자리에': async () => {
      if (mode === 'messy') await dragTo([1.7, 0.2, 1.25], [0, 0.66, -1.0]);
      await dragTo([1.7, 0.2, 1.25], [-1.5, 0.66, -1.0]); await dragTo([-1.6, 0.3, 1.3], [0, 0.66, -1.0]); await dragTo([0.1, 0.15, 1.4], [1.5, 0.66, -1.0]);
      await rub([[-0.5, 0.1, 0.55], [1.0, 0.3, 0.35]], 0.03);
    },
    '잘못 울린 경보일까요?': async () => {
      if (mode === 'messy') await dragTo([-0.4, 0.05, 1.35], [2.15, 1.32, -1.45]);
      await rub([[-0.35, -0.9, 0.3], [0.25, -0.72, 0.2]], 0.76);
      await dragTo([0.75, 1.0, -1.25], [-1.85, 0.75, -1.6]); await p.waitForTimeout(200);
      await dragTo([-0.4, 0.05, 1.35], [2.15, 1.32, -1.45]);
    },
    '물줄기를 표적에': async () => {
      await rub([[0.9, -0.9, 0.2]], 0.03);
      if (mode === 'messy') await dragTo([2.2, 0.06, 1.55], [-2.2, 0.03, -1.3]);
      await dragTo([0.3, 0.08, 1.55], [-1.6, 0.03, -0.75]); await dragTo([1.3, 0.12, 1.55], [-0.4, 0.03, 1.0]); await dragTo([2.2, 0.06, 1.55], [-2.2, 0.03, -1.3]);
      await rub([[0.9, -0.9, 0.5], [2.0, 0.45, 0.5]], 0.03);
    },
    '골목에 불이 났어요': async () => {
      if (mode === 'messy') await dragTo([-1.75, 0.1, -0.2], [-1.35, 0.03, 0.45]);
      await rub([[-0.15, -0.5, 0.2]], 0.31);
      await dragTo([-1.55, 0.2, 1.7], [1.95, 0.02, 0.1]); await dragTo([-1.75, 0.1, -0.2], [-1.35, 0.03, 0.45]);
      await rub([[-0.15, -0.5, 0.36], [1.15, -0.5, 0.36]], 0.31); await p.waitForTimeout(400);
      await dragTo([0.5, 0.45, -0.25], [-0.6, 0.3, 1.45]); await p.waitForTimeout(300);
      await rub([[0.5, -0.25, 0.26]], 0.31);
    },
    '돌아오면, 다음 출동 준비': async () => {
      if (mode === 'messy') await dragTo([2.3, 0.8, -0.85], [-2.25, 0.52, -0.85]);
      await rub([[-0.4, 0.15, 0.36], [0.35, 0.5, 0.34], [0.3, -0.05, 0.24], [-0.3, 0.6, 0.22]], 0.875);
      await dragTo([-2.25, 0.93, -0.85], [2.3, 0.63, 0.75]); await dragTo([2.3, 0.8, -0.85], [-2.25, 0.52, -0.85]);
    },
  };
  if (process.env.OLDST === '1') Object.assign(stages, { // 고치기 전 판(카드 끌기)의 자리: 전후 비교용
    '가온 님 상담 준비': async () => { await shot({ path: S('counsel-start') }); await dragTo([-1.3, 0.66, 1.15], [-1.25, 0.72, -0.85]); await dragTo([1.3, 0.68, 1.16], [1.25, 0.72, -0.85]); },
    '바뀐 진료실 안내': async () => { await shot({ path: S('route-start') }); for (const x of [-1.55, 1.55]) await dragTo([-x * 0.78, 0.68, 1.35], [x, 0.7, -0.08]); },
  });
  let walks = 0;
  async function walk(tag) {
    const goal = await p.evaluate(() => window.__cd.goal()); const how = walks % 3; walks++;
    if (!goal) { await press('#walkGo'); return; }
    if (how === 0 && await p.locator('.mark.goal').count()) { const bb = await p.locator('.mark.goal').boundingBox(); await tapAt(bb.x + bb.width / 2, bb.y + bb.height / 2); }
    else if (how === 1) { const q = await W(goal.x + 0.3, 0, goal.z + 0.2); await tapAt(q.x, q.y); }
    else await press('#walkGo');
    for (let k = 0; k < 60 && await p.locator('#walkGo').count(); k++) await p.waitForTimeout(250);
    if (await p.locator('#walkGo').count()) { await press('#walkGo'); for (let k = 0; k < 60 && await p.locator('#walkGo').count(); k++) await p.waitForTimeout(250); }
    if (await p.locator('#walkGo').count()) throw new Error('걸어서 닿지 못함 ' + tag);
  }
  const seen = []; let mistakesSeen = [];
  for (let step = 0; step < 140; step++) {
    await p.waitForTimeout(350); over = Math.max(over, await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    let h = (await p.evaluate(() => document.querySelector('#panel h2, #panel h1')?.textContent || '')).trim();
    const tag = String(step).padStart(2, '0');
    const travel = await p.evaluate(() => document.querySelector('.travelCard b')?.textContent);
    if (travel) { console.log(tag, '가는 길:', travel); await p.waitForTimeout(2000); continue; }
    if (await p.locator('#walkGo').count()) {
      const m = await measure('[walk] ' + h); await shot({ path: `${out}/${tag0}-${tag}-walk.png` });
      console.log(tag, '[걷기]', h, '| 단추 보임', JSON.stringify(m.main), '| 3D', m.canvasDvh + 'dvh', '| HUD', JSON.stringify(m.hud));
      await walk(tag); continue;
    }
    if (!seen.includes(h)) { seen.push(h); const m = await measure(h); await shot({ path: `${out}/${tag0}-${tag}.png` }); console.log(tag, h, '|', m.hud?.text, '| 3D', m.canvasDvh + 'dvh', '| 보기', JSON.stringify(m.opts), '| 단추', JSON.stringify(m.main), '| 스크롤', m.panelScroll, '| 이름 잘림', m.hud?.nameCut); }
    if (await p.locator('#go').count() && !(await p.locator('#stay').count())) { await press('#go'); continue; }
    if (await p.locator('#hands').count() && !(await p.locator('#nx').count())) {
      if (await p.locator('.handsDone').count()) continue;
      await p.waitForTimeout(1900);
      if (!h) { h = (await p.evaluate(() => document.querySelector('#panel h2')?.textContent || '')).trim(); seen.push(h); }
      const run = stages[h]; if (!run) throw new Error('모르는 손 장면: ' + h);
      await measure('[hands] ' + h); await shot({ path: `${out}/${tag0}-${tag}-start.png` });
      await run(); await p.waitForTimeout(1400);
      await shot({ path: `${out}/${tag0}-${tag}-end.png` });
      const reply = await p.locator('#out .reply').textContent().catch(() => '(결과 없음)');
      console.log('   손 놀이:', await msg().catch(() => ''), '→', reply, '| 할 일', await p.locator('.todo li.done').count(), '/', await p.locator('.todo li').count());
      mistakesSeen.push([h, reply]);
      await press('#nx'); continue;
    }
    if (await p.locator('#stay').count()) { const m = await measure('[leave] ' + h); console.log('   퇴근 고르기 단추', JSON.stringify(m.main)); await press(mode === 'messy' ? '#stay' : '#go'); await p.waitForTimeout(900); continue; }
    if (await p.locator('.record.closed').count()) {
      while (await p.locator('.record.closed').count()) await tl(p.locator('.record.closed').first());
      await p.waitForTimeout(400);
      const m = await measure('[records-open] ' + h); await shot({ path: `${out}/${tag0}-${tag}-records-open.png` });
      console.log('   기록 펼친 뒤 다음 단추', JSON.stringify(m.main), '| 3D', m.canvasDvh + 'dvh', '| 스크롤', m.panelScroll);
      await press('#nx');
      if (UNTIL === 'records') break;
      continue;
    }
    if (await p.locator('#ok').count() && await p.locator('#ok').isVisible()) { const c = p.locator('.choice'); for (const i of (mode === 'messy' ? [0, 1, 3] : [0, 1, 2])) await tl(c.nth(i)); await press('#ok'); await p.waitForTimeout(300); await press('#nx'); continue; }
    if (await p.locator('.moment').count()) {
      await tl(p.locator('.moment').nth(mode === 'messy' ? 3 : 1)); await tl(p.locator('.moment').nth(mode === 'messy' ? 0 : 4)); await p.waitForTimeout(200);
      await shot({ path: `${out}/${tag0}-reflect.png` });
      await press('#keep'); await p.waitForTimeout(600); await shot({ path: `${out}/${tag0}-done.png` });
      console.log('   마침:', (await p.locator('#panel h2').first().textContent()));
      break;
    }
    if (await p.locator('#nx').count() && await p.locator('#nx').isEnabled()) { const m = await measure('[result] ' + h); if (!m.main.every((x) => x.vis)) console.log('   (결과 단추가 화면 밖)', JSON.stringify(m.main)); await press('#nx'); continue; }
    const ch = p.locator('#panel .choice:not(.done):not([disabled])');
    if (await ch.count()) {
      if (await ch.first().getAttribute('data-i') !== null && !await p.locator('#opts,#ok').count()) { const ids = await ch.evaluateAll((bs) => bs.map((b) => +b.dataset.i)); await tl(ch.nth(ids.indexOf(Math.min(...ids)))); continue; }
      const n = await ch.count(), isChoice = await p.locator('#opts').count();
      let k = isChoice ? (mode === 'messy' ? Math.min(n - 1, 2) : 0) : step % n;
      if (isChoice) {
        const labels = await ch.allTextContents();
        const keep = mode === 'clean' || KEEP;
        const want = labels.findIndex((t) => (keep ? /약속대로|다시 오겠다고|다시 와서 설명하겠다고/ : /다시 오겠다고|다시 와서 설명하겠다고/).test(t)); if (want >= 0) k = want;
        if (job === 'pharmacist') { const i = labels.findIndex((t) => t.includes('오후 상담 시간을 잡아') || (keep && t.includes('약속대로 가온'))); if (i >= 0) k = i; }
      }
      await tl(ch.nth(k)); continue;
    }
  }
  const rec = await p.evaluate(() => JSON.parse(localStorage.getItem('workday-records-v1') || '[]'));
  console.log('기록', JSON.stringify(rec.map((r) => ({ job: r.job?.id, pay: r.pay?.total, ending: r.ending?.name }))));
  console.log('손 장면 결과', JSON.stringify(mistakesSeen));
  console.log('가로 밀림(최대 px)', over);
  console.log('errors', JSON.stringify(errs)); fs.writeFileSync(`${out}/${tag0}-metrics.json`, JSON.stringify(metrics, null, 1));
  const v = p.video(); await ctx.close(); if (v) console.log('영상', await v.path()); await b.close();
  if (errs.length || over || (!UNTIL && !rec.some((r) => r.job?.id === job))) { console.error('실패', JSON.stringify({ errs, over, records: rec.length })); process.exit(1); }
})().catch((e) => { console.error('실패', e); process.exit(1); });
