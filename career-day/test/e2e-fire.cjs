// 소방관의 하루를 실제 포인터 조작으로 첫 화면부터 끝까지 해 보며 녹화한다 (shared/CHECKLIST.md A3~A7, A10, A17, B6·B7).
// 카페 방식(걸어 다니기)도 사람처럼 한다: 3D 바닥을 누르거나, 노란 장소 표시를 누르거나, 아래 '걸어가기' 단추를 눌러 걸어간다.
//
//   1) 사이트를 묶어 띄운다:  node workday-site/build.mjs && python3 -m http.server 8123 --directory workday-site/public
//   2) node career-day/test/e2e-fire.cjs <결과 폴더> <iphone|se|pc> <clean|messy> [reduced]
//        clean: 순서대로 한다 / messy: 일부러 틀리고, 다른 방 바닥도 눌러 보고, 남아서 마친다 / reduced: 기기의 '동작 줄이기'를 켠다
//        SHOTS=0 을 주면 스크린샷을 찍지 않는다(깜박임을 잴 영상). PORT 로 주소의 포트를 바꾼다.
//        폰은 화면 배율 1(dsf 1)로 흉내 낸다.
//   3) node shared/tools/flicker.cjs <결과 폴더>/video-*/*.webm
//
// 콘솔 오류, 4xx·5xx 응답, 가로 밀림, 손 놀이마다 마친 할 일 수, 걸어간 길, 저장된 기록을 적어 준다.
// 3D 좌표를 화면 좌표로 바꾸려고 검사 표시(cd-test)를 쓴다. 누르기와 끌기는 모두 실제 포인터로 한다.
const { chromium, devices } = require('playwright');
const [, , out, size = 'iphone', mode = 'clean', rm = ''] = process.argv; const url = `http://localhost:${process.env.PORT || 8123}/`;
const phone = { iphone: devices['iPhone 13'], se: devices['iPhone SE'] }[size];
const opt = phone ? { ...phone, deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } }; delete opt.defaultBrowserType;
(async () => {
  const tag0 = `${size}-${mode}${rm}`;
  const shot = (o) => (process.env.SHOTS === '0' ? null : p.screenshot(o));
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...opt, reducedMotion: rm === 'reduced' ? 'reduce' : 'no-preference', ...(process.env.VIDEO === '0' ? {} : { recordVideo: { dir: out + '/video-' + tag0, size: opt.viewport } }) });
  const p = await ctx.newPage();
  const errs = []; let over = 0; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  await p.addInitScript(() => { try { sessionStorage.setItem('cd-test', '1'); } catch {} });
  await p.goto(url); await p.waitForTimeout(1200);
  await p.click('.place.fire'); await p.waitForTimeout(2200);
  await p.click('.job'); await p.waitForTimeout(600);
  // 사람처럼 누르기: 폰은 손가락(touch), PC는 마우스
  const tapAt = async (x, y) => { if (phone) await p.touchscreen.tap(x, y); else { await p.mouse.move(x, y, { steps: 4 }); await p.mouse.down(); await p.mouse.up(); } };
  const P = (x, y, z) => p.evaluate(([x, y, z]) => window.__cd.world().closeProject(x, y, z), [x, y, z]);
  const W = (x, y, z) => p.evaluate(([x, y, z]) => window.__cd.world().project(x, y, z), [x, y, z]);
  const dragTo = async (from, to) => { const a = await P(...from), c = await P(...to); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + c.x) / 2, (a.y + c.y) / 2, { steps: 6 }); await p.mouse.move(c.x, c.y, { steps: 6 }); await p.waitForTimeout(60); await p.mouse.up(); await p.waitForTimeout(250); };
  const rub = async (blobs, y) => { for (const [x, z, r] of blobs) { let first = true; for (let dz = -r; dz <= r + 0.01; dz += 0.14) { for (const dx of (Math.round((dz + r) / 0.14) % 2 ? [r, -r] : [-r, r])) { const q = await P(x + dx, y, z + dz); if (first) { await p.mouse.move(q.x, q.y); await p.mouse.down(); first = false; } else await p.mouse.move(q.x, q.y, { steps: 5 }); } } await p.mouse.up(); await p.waitForTimeout(150); } };
  const stages = {
    '교대 점검, 장비는 제자리에': async () => {
      if (mode === 'messy') await dragTo([1.7, 0.2, 1.25], [0, 0.66, -1.0]); // 헬멧을 공기호흡기 칸에 (틀림)
      await dragTo([1.7, 0.2, 1.25], [-1.5, 0.66, -1.0]); await dragTo([-1.6, 0.3, 1.3], [0, 0.66, -1.0]); await dragTo([0.1, 0.15, 1.4], [1.5, 0.66, -1.0]);
      await rub([[-0.5, 0.1, 0.55], [1.0, 0.3, 0.35]], 0.03);
    },
    '잘못 울린 경보일까요?': async () => {
      if (mode === 'messy') await dragTo([-0.4, 0.05, 1.35], [2.15, 1.32, -1.45]); // 살피기 전에 되돌리기 (틀림)
      await shot({ path: `${out}/${tag0}-alarm-mid.png` });
      await rub([[-0.35, -0.9, 0.3], [0.25, -0.72, 0.2]], 0.76);
      await dragTo([0.75, 1.0, -1.25], [-1.85, 0.75, -1.6]); await p.waitForTimeout(200);
      await shot({ path: `${out}/${tag0}-alarm-moved.png` });
      await dragTo([-0.4, 0.05, 1.35], [2.15, 1.32, -1.45]);
    },
    '물줄기를 표적에': async () => {
      await rub([[0.9, -0.9, 0.2]], 0.03); // 물이 아직 안 나온다 (막힘)
      if (mode === 'messy') await dragTo([2.2, 0.06, 1.55], [-2.2, 0.03, -1.3]); // 관창 없이 소화전부터 (틀림)
      await dragTo([0.3, 0.08, 1.55], [-1.6, 0.03, -0.75]); await dragTo([1.3, 0.12, 1.55], [-0.4, 0.03, 1.0]); await dragTo([2.2, 0.06, 1.55], [-2.2, 0.03, -1.3]);
      await shot({ path: `${out}/${tag0}-drill-mid.png` });
      const q = await P(0.9, 0.03, -0.9); await p.mouse.move(q.x, q.y); await p.mouse.down(); const q2 = await P(1.1, 0.03, -0.7); await p.mouse.move(q2.x, q2.y, { steps: 4 }); await p.waitForTimeout(200);
      await shot({ path: `${out}/${tag0}-drill-jet.png` }); await p.mouse.up();
      await rub([[0.9, -0.9, 0.5], [2.0, 0.45, 0.5]], 0.03);
    },
    '골목에 불이 났어요': async () => {
      if (mode === 'messy') await dragTo([-1.75, 0.1, -0.2], [-1.35, 0.03, 0.45]); // 안전선 없이 호스부터 (틀림)
      await rub([[-0.15, -0.5, 0.2]], 0.31); // 물이 아직 없다 (막힘)
      await dragTo([-1.55, 0.2, 1.7], [1.95, 0.02, 0.1]); await dragTo([-1.75, 0.1, -0.2], [-1.35, 0.03, 0.45]);
      const q = await P(-0.15, 0.31, -0.5); await p.mouse.move(q.x, q.y); await p.mouse.down(); const q2 = await P(0.0, 0.31, -0.45); await p.mouse.move(q2.x, q2.y, { steps: 4 }); await p.waitForTimeout(200);
      await shot({ path: `${out}/${tag0}-fire-jet.png` }); await p.mouse.up();
      await rub([[-0.15, -0.5, 0.36], [1.15, -0.5, 0.36]], 0.31); await p.waitForTimeout(400);
      await shot({ path: `${out}/${tag0}-fire-out.png` });
      await dragTo([0.5, 0.45, -0.25], [-0.6, 0.3, 1.45]); await p.waitForTimeout(300); await shot({ path: `${out}/${tag0}-fire-ember.png` });
      await rub([[0.5, -0.25, 0.26]], 0.31);
    },
    '돌아오면, 다음 출동 준비': async () => {
      if (mode === 'messy') await dragTo([2.3, 0.8, -0.85], [-2.25, 0.52, -0.85]); // 채운 통부터 (틀림)
      await rub([[-0.4, 0.15, 0.36], [0.35, 0.5, 0.34], [0.3, -0.05, 0.24], [-0.3, 0.6, 0.22]], 0.875);
      await dragTo([-2.25, 0.93, -0.85], [2.3, 0.63, 0.75]); await dragTo([2.3, 0.8, -0.85], [-2.25, 0.52, -0.85]);
    },
  };
  // 걸어가기: 세 가지 방법을 돌아가며 쓴다. ① 3D의 노란 장소 표시 누르기 ② 갈 곳의 바닥 누르기 ③ 아래 '걸어가기' 단추. messy 에서는 한 번 다른 방 바닥을 먼저 눌러 본다
  let walks = 0, strayed = false;
  async function walk(tag, h) {
    const goal = await p.evaluate(() => window.__cd.goal());
    const how = walks % 3; walks++;
    if (!goal) { await shot({ path: `${out}/${tag0}-${tag}-go.png` }); console.log(`   ${tag} 걸음 없음 → 단추: ${await p.locator('#walkGo').textContent()}`); await p.click('#walkGo'); return; }
    await shot({ path: `${out}/${tag0}-${tag}-walk.png` });
    if (mode === 'messy' && !strayed && goal.id !== 'lounge') { // 다른 방(대기실) 바닥을 눌러 본다
      strayed = true; const q = await W(1.7, 0, 3.3); await tapAt(q.x, q.y);
      for (let k = 0; k < 60 && !(await p.evaluate(() => document.querySelector('#walkMsg')?.classList.contains('note'))); k++) await p.waitForTimeout(250); // 그 방에 닿아 안내가 바뀔 때까지
      console.log('   다른 방을 눌렀을 때:', await p.evaluate(() => document.querySelector('#walkMsg')?.textContent || '(안내 없음: ' + document.querySelector('#panel h2')?.textContent + ')')); await shot({ path: `${out}/${tag0}-${tag}-stray.png` });
    }
    const before = await p.evaluate(() => window.__cd.world().where());
    if (how === 0) { const bb = await p.locator('.mark.goal').boundingBox(); await tapAt(bb.x + bb.width / 2, bb.y + bb.height / 2); }
    else if (how === 1) { const q = await W(goal.x + 0.3, 0, goal.z + 0.2); await tapAt(q.x, q.y); }
    else await p.click('#walkGo');
    await p.waitForTimeout(700); await shot({ path: `${out}/${tag0}-${tag}-walking.png` });
    const mid = await p.evaluate(() => window.__cd.world()?.where?.());
    for (let k = 0; k < 40 && await p.locator('#walkGo').count(); k++) await p.waitForTimeout(250);
    console.log(`   ${tag} 걸어감(${['장소 표시', '바닥', '단추'][how]}) → ${goal.id} (${before.x.toFixed(1)},${before.z.toFixed(1)}) → 중간 (${mid ? mid.x.toFixed(1) + ',' + mid.z.toFixed(1) : '-'})`);
    if (await p.locator('#walkGo').count()) throw new Error('걸어서 닿지 못함: ' + h);
  }
  const seen = [];
  for (let step = 0; step < 90; step++) {
    await p.waitForTimeout(350); over = Math.max(over, await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    const h = (await p.evaluate(() => document.querySelector('#panel h2, #panel h1')?.textContent || '')).trim(); // 기다리지 않고 지금 있는 제목만 읽는다 (가는 길 화면에는 제목이 없다)
    const tag = `${String(step).padStart(2, '0')}`;
    const travel = await p.evaluate(() => document.querySelector('.travelCard b')?.textContent);
    if (travel) { await shot({ path: `${out}/${tag0}-${tag}-travel.png` }); console.log(tag, '가는 길:', travel); await p.waitForTimeout(2000); continue; }
    if (await p.locator('#walkGo').count()) {
      console.log(tag, '[걷기]', h, '|', await p.locator('#clock').textContent(), '| 알림:', (await p.locator('.notice').textContent().catch(() => '')) || '-', '| 받은 일:', (await p.locator('.inbox li').allTextContents()).join(' / '));
      await walk(tag, h); continue;
    }
    if (!seen.includes(h)) { seen.push(h); await shot({ path: `${out}/${tag0}-${tag}.png` }); console.log(tag, h, '|', (await p.locator('#clock').textContent().catch(() => '')), (await p.locator('#money').textContent().catch(() => ''))); }
    if (await p.locator('#go').count() && !(await p.locator('#stay').count())) { await p.click('#go'); continue; }
    if (await p.locator('#hands').count() && !(await p.locator('#nx').count())) {
      if (await p.locator('.handsDone').count()) continue;
      await p.waitForTimeout(1900); // 폰에서 손 놀이 자리로 내려가는 걸 기다린다
      const run = stages[h]; if (!run) throw new Error('모르는 손 장면: ' + h);
      await shot({ path: `${out}/${tag0}-${tag}-start.png` });
      await run(); await p.waitForTimeout(1200);
      await shot({ path: `${out}/${tag0}-${tag}-end.png` });
      console.log('   손 놀이:', await p.locator('#cuMsg').textContent(), '→', (await p.locator('#out .reply').textContent().catch(() => '(결과 없음)')), '| 할 일', await p.locator('.todo li.done').count(), '/', await p.locator('.todo li').count());
      await p.click('#nx'); continue;
    }
    if (await p.locator('#stay').count()) { await p.click(mode === 'messy' ? '#stay' : '#go'); await p.waitForTimeout(900); continue; }
    if (await p.locator('.record.closed').count()) { while (await p.locator('.record.closed').count()) await p.locator('.record.closed').first().click(); await p.click('#nx'); continue; }
    if (await p.locator('#ok').count() && await p.locator('#ok').isVisible()) { const c = p.locator('.choice'); for (const i of (mode === 'messy' ? [0, 1, 3] : [0, 1, 2])) await c.nth(i).click(); await p.click('#ok'); await p.waitForTimeout(300); await p.click('#nx'); continue; }
    if (await p.locator('.moment').count()) {
      await p.locator('.moment').nth(mode === 'messy' ? 3 : 1).click(); await p.locator('.moment').nth(mode === 'messy' ? 0 : 4).click(); await p.waitForTimeout(200);
      await shot({ path: `${out}/${tag0}-reflect.png`, fullPage: false });
      console.log('   순간:', await p.locator('.moment').allTextContents());
      await p.click('#keep'); await p.waitForTimeout(600); await shot({ path: `${out}/${tag0}-done.png` });
      console.log('   마침:', (await p.locator('#panel h2').first().textContent()), '|', await p.locator('#panel .link').allTextContents());
      break;
    }
    if (await p.locator('#nx').count() && await p.locator('#nx').isEnabled()) { await p.click('#nx'); continue; }
    const ch = p.locator('#panel .choice:not(.done):not([disabled])');
    if (await ch.count()) {
      const n = await ch.count(), isChoice = await p.locator('#opts').count();
      // 판단: clean 은 시장에서 "오후에 다시 오겠다"(약속)를 고르고, 불을 끈 뒤 약속을 지키러 간다. messy 는 약속하고 지키지 않는다
      let k = isChoice ? (mode === 'messy' ? Math.min(n - 1, 2) : 0) : step % n;
      if (isChoice) { const labels = await ch.allTextContents(); const want = labels.findIndex((t) => (mode === 'clean' ? /약속대로|다시 오겠다고/ : /다시 오겠다고/).test(t)); if (want >= 0) k = want; }
      await ch.nth(k).click(); continue;
    }
  }
  const rec = await p.evaluate(() => JSON.parse(localStorage.getItem('workday-records-v1') || '[]'));
  console.log('기록', JSON.stringify(rec.map((r) => ({ app: r.app, place: r.place, job: r.job, pay: r.pay?.total, ending: r.ending, like: r.like, hard: r.hard }))));
  console.log('가로 밀림(최대 px)', over); await p.goto(url); await p.waitForTimeout(900); console.log('첫 화면으로 돌아옴: 소방관 도장', await p.evaluate(() => document.body.innerText.includes('소방관')));
  console.log('errors', errs);
  const v = p.video(); await ctx.close(); if (v) console.log('영상', await v.path()); await b.close();
})().catch((e) => { console.error('실패', e); process.exit(1); });
