// 소방관의 하루를 실제 포인터 조작으로 첫 화면부터 끝까지 해 보며 녹화한다 (shared/CHECKLIST.md A3~A7, A10, B6·B7).
//
//   1) 사이트를 묶어 띄운다:  node workday-site/build.mjs && python3 -m http.server 8123 --directory workday-site/public
//   2) node career-day/test/e2e-fire.cjs <결과 폴더> <iphone|pc> <clean|messy> [reduced]
//        clean: 순서대로 한다 / messy: 일부러 틀리고 남아서 마친다 / reduced: 기기의 '동작 줄이기'를 켠다
//        SHOTS=0 을 주면 스크린샷을 찍지 않는다. 폰 흉내에서는 스크린샷을 찍는 순간 녹화에 확대되거나 검게 잘린 프레임이 끼어들기 때문에,
//        깜박임을 잴 영상은 SHOTS=0 으로 찍는다.
//   3) node shared/tools/flicker.cjs <결과 폴더>/video-*/*.webm
//
// 콘솔 오류, 4xx·5xx 응답, 가로 밀림, 손 놀이마다 마친 할 일 수, 저장된 기록을 적어 준다. 3D 좌표를 화면 좌표로 바꾸려고 검사 표시(cd-test)를 쓴다.
const { chromium, devices } = require('playwright');
const [, , out, size = 'iphone', mode = 'clean', rm = ''] = process.argv; const url = 'http://localhost:8123/';
const opt = size === 'pc' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'] }; delete opt.defaultBrowserType;
(async () => {
  const shot = (o) => (process.env.SHOTS === '0' ? null : p.screenshot(o));
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...opt, reducedMotion: rm === 'reduced' ? 'reduce' : 'no-preference', recordVideo: { dir: out + '/video-' + size + '-' + mode + (rm ? '-' + rm : ''), size: opt.viewport } });
  const p = await ctx.newPage();
  const errs = []; let over = 0; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  await p.addInitScript(() => { try { sessionStorage.setItem('cd-test', '1'); } catch {} });
  await p.goto(url); await p.waitForTimeout(1200);
  await p.click('.place.fire'); await p.waitForTimeout(2200);
  await p.click('.job'); await p.waitForTimeout(600);
  const P = (x, y, z) => p.evaluate(([x, y, z]) => window.__cd.world().closeProject(x, y, z), [x, y, z]);
  const dragTo = async (from, to) => { const a = await P(...from), c = await P(...to); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + c.x) / 2, (a.y + c.y) / 2, { steps: 6 }); await p.mouse.move(c.x, c.y, { steps: 6 }); await p.waitForTimeout(60); await p.mouse.up(); await p.waitForTimeout(250); };
  const rub = async (blobs, y) => { for (const [x, z, r] of blobs) { let first = true; for (let dz = -r; dz <= r + 0.01; dz += 0.14) { for (const dx of (Math.round((dz + r) / 0.14) % 2 ? [r, -r] : [-r, r])) { const q = await P(x + dx, y, z + dz); if (first) { await p.mouse.move(q.x, q.y); await p.mouse.down(); first = false; } else await p.mouse.move(q.x, q.y, { steps: 5 }); } } await p.mouse.up(); await p.waitForTimeout(150); } };
  const stages = {
    '교대 점검, 장비는 제자리에': async () => {
      if (mode === 'messy') await dragTo([1.7, 0.2, 1.25], [0, 0.66, -1.0]); // 헬멧을 공기호흡기 칸에 (틀림)
      await dragTo([1.7, 0.2, 1.25], [-1.5, 0.66, -1.0]); await dragTo([-1.6, 0.3, 1.3], [0, 0.66, -1.0]); await dragTo([0.1, 0.15, 1.4], [1.5, 0.66, -1.0]);
      await rub([[-0.5, 0.1, 0.55], [1.0, 0.3, 0.35]], 0.03);
    },
    '물줄기를 표적에': async () => {
      await rub([[0.9, -0.9, 0.2]], 0.03); // 물이 아직 안 나온다 (막힘)
      if (mode === 'messy') await dragTo([2.2, 0.06, 1.55], [-2.2, 0.03, -1.3]); // 관창 없이 소화전부터 (틀림)
      await dragTo([0.3, 0.08, 1.55], [-1.6, 0.03, -0.75]); await dragTo([1.3, 0.12, 1.55], [-0.4, 0.03, 1.0]); await dragTo([2.2, 0.06, 1.55], [-2.2, 0.03, -1.3]);
      await shot({ path: `${out}/${size}-${mode}${rm}-drill-mid.png` });
      const q = await P(0.9, 0.03, -0.9); await p.mouse.move(q.x, q.y); await p.mouse.down(); const q2 = await P(1.1, 0.03, -0.7); await p.mouse.move(q2.x, q2.y, { steps: 4 }); await p.waitForTimeout(200);
      await shot({ path: `${out}/${size}-${mode}${rm}-drill-jet.png` }); await p.mouse.up();
      await rub([[0.9, -0.9, 0.5], [2.0, 0.45, 0.5]], 0.03);
    },
    '골목에 불이 났어요': async () => {
      if (mode === 'messy') await dragTo([-1.75, 0.1, -0.2], [-1.35, 0.03, 0.45]); // 안전선 없이 호스부터 (틀림)
      await rub([[-0.15, -0.5, 0.2]], 0.31); // 물이 아직 없다 (막힘)
      await dragTo([-1.55, 0.2, 1.7], [1.95, 0.02, 0.1]); await dragTo([-1.75, 0.1, -0.2], [-1.35, 0.03, 0.45]);
      const q = await P(-0.15, 0.31, -0.5); await p.mouse.move(q.x, q.y); await p.mouse.down(); const q2 = await P(0.0, 0.31, -0.45); await p.mouse.move(q2.x, q2.y, { steps: 4 }); await p.waitForTimeout(200);
      await shot({ path: `${out}/${size}-${mode}${rm}-fire-jet.png` }); await p.mouse.up();
      await rub([[-0.15, -0.5, 0.36], [1.15, -0.5, 0.36]], 0.31); await p.waitForTimeout(400);
      await shot({ path: `${out}/${size}-${mode}${rm}-fire-out.png` });
      await dragTo([0.5, 0.45, -0.25], [-0.6, 0.3, 1.45]); await p.waitForTimeout(300); await shot({ path: `${out}/${size}-${mode}${rm}-fire-ember.png` });
      await rub([[0.5, -0.25, 0.26]], 0.31);
    },
    '돌아오면, 다음 출동 준비': async () => {
      if (mode === 'messy') await dragTo([2.3, 0.8, -0.85], [-2.25, 0.52, -0.85]); // 채운 통부터 (틀림)
      await rub([[-0.4, 0.15, 0.36], [0.35, 0.5, 0.34], [0.3, -0.05, 0.24], [-0.3, 0.6, 0.22]], 0.875);
      await dragTo([-2.25, 0.93, -0.85], [2.3, 0.63, 0.75]); await dragTo([2.3, 0.8, -0.85], [-2.25, 0.52, -0.85]);
    },
  };
  const seen = [];
  for (let step = 0; step < 60; step++) {
    await p.waitForTimeout(350); over = Math.max(over, await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    const h = (await p.locator('#panel h2, #panel h1').first().textContent().catch(() => '')) || '';
    const tag = `${String(step).padStart(2, '0')}`;
    if (!seen.includes(h)) { seen.push(h); await shot({ path: `${out}/${size}-${mode}${rm}-${tag}.png` }); console.log(tag, h.trim(), '|', (await p.locator('#clock').textContent().catch(() => '')), (await p.locator('#money').textContent().catch(() => ''))); }
    if (await p.locator('#go').count() && !(await p.locator('#stay').count())) { await p.click('#go'); continue; }
    if (await p.locator('#hands').count() && !(await p.locator('#nx').count())) {
      if (await p.locator('.handsDone').count()) continue;
      await p.waitForTimeout(1900); // 폰에서 손 놀이 자리로 내려가는 걸 기다린다
      const run = stages[h.trim()]; if (!run) throw new Error('모르는 손 장면: ' + h);
      await shot({ path: `${out}/${size}-${mode}${rm}-${tag}-start.png` });
      await run(); await p.waitForTimeout(1200);
      await shot({ path: `${out}/${size}-${mode}${rm}-${tag}-end.png` });
      console.log('   손 놀이:', await p.locator('#cuMsg').textContent(), '→', (await p.locator('#out .reply').textContent().catch(() => '(결과 없음)')), '| 할 일', await p.locator('.todo li.done').count(), '/', await p.locator('.todo li').count());
      await p.click('#nx'); continue;
    }
    if (await p.locator('#stay').count()) { await p.click(mode === 'messy' ? '#stay' : '#go'); await p.waitForTimeout(900); continue; }
    if (await p.locator('.record.closed').count()) { while (await p.locator('.record.closed').count()) await p.locator('.record.closed').first().click(); await p.click('#nx'); continue; }
    if (await p.locator('#ok').count() && await p.locator('#ok').isVisible()) { const c = p.locator('.choice'); for (const i of (mode === 'messy' ? [0, 1, 3] : [0, 1, 2])) await c.nth(i).click(); await p.click('#ok'); await p.waitForTimeout(300); await p.click('#nx'); continue; }
    if (await p.locator('.moment').count()) {
      await p.locator('.moment').nth(mode === 'messy' ? 3 : 1).click(); await p.locator('.moment').nth(mode === 'messy' ? 0 : 4).click(); await p.waitForTimeout(200);
      await shot({ path: `${out}/${size}-${mode}${rm}-reflect.png`, fullPage: false });
      console.log('   순간:', await p.locator('.moment').allTextContents());
      await p.click('#keep'); await p.waitForTimeout(600); await shot({ path: `${out}/${size}-${mode}${rm}-done.png` });
      console.log('   마침:', (await p.locator('#panel h2').first().textContent()), '|', await p.locator('#panel .link').allTextContents());
      break;
    }
    if (await p.locator('#nx').count() && await p.locator('#nx').isEnabled()) { await p.click('#nx'); continue; }
    const ch = p.locator('#panel .choice:not(.done):not([disabled])');
    if (await ch.count()) { const n = await ch.count(); const isChoice = await p.locator('#opts').count(); await ch.nth(isChoice ? (mode === 'messy' ? Math.min(n - 1, 2) : 0) : step % n).click(); continue; }
  }
  const rec = await p.evaluate(() => JSON.parse(localStorage.getItem('workday-records-v1') || '[]'));
  console.log('기록', JSON.stringify(rec.map((r) => ({ app: r.app, place: r.place, job: r.job, pay: r.pay, ending: r.ending, like: r.like, hard: r.hard, shift: r.shift }))));
  console.log('가로 밀림(최대 px)', over); await p.goto(url); await p.waitForTimeout(900); console.log('첫 화면으로 돌아옴: 소방관 도장', await p.evaluate(() => document.body.innerText.includes('소방관')));
  console.log('errors', errs);
  const v = p.video(); await ctx.close(); console.log('영상', await v.path()); await b.close();
})().catch((e) => { console.error('실패', e); process.exit(1); });
