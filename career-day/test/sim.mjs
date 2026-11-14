// 하루 시뮬레이션 검사: 직업마다 고를 수 있는 모든 길을 끝까지 돌려 본다.
// 치킨집에서 배운 것 — 함정 선택, 결과와 어긋난 문구, 한 번도 안 나오는 글을 미리 잡는다.
import { readdirSync } from 'node:fs';
import { JOBS } from '../src/jobs/index.js';
import { toMin, newDay, sceneOf, enter, optionsOf, choose, finishTasks, finishOrder, finishPick, finishHands, thanksLine, leave, next, payslip, mood, RIASEC, TIRED } from '../src/engine.js';
import { CAREERNET } from '../src/data/careernet.js';
import { MIN_WAGE } from '../src/pay.js';
import { HANDS } from '../src/hands/index.js';
const MOOD_NAMES = ['다 쓰고 돌아가는 퇴근길', '이것저것 챙기느라 바빴던 하루', '사람 곁을 지킨 하루', '팀과 호흡을 맞춘 하루', '내 속도를 지킨 하루'];

let fail = 0;
const allMoods = new Set();
const bad = (msg) => { fail++; console.log('  ✗ ' + msg); };
const clone = (s) => structuredClone(s);

// 1. 폴더의 직업 파일이 모두 목록에 올라 있는가
const files = readdirSync(new URL('../src/jobs/', import.meta.url)).filter((f) => f.endsWith('.js') && !f.startsWith('_') && f !== 'index.js');
for (const f of files) if (!JOBS.some((j) => j.id + '.js' === f)) bad(`jobs/${f} 가 jobs/index.js 에 없음`);

function combos(n, k) { const out = []; const rec = (start, acc) => { if (acc.length === k) { out.push(acc.slice()); return; } for (let i = start; i < n; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); } }; rec(0, []); return out; }

for (const job of JOBS) {
  console.log(`\n■ ${job.name}`);
  const wage = CAREERNET[job.careernet];
  if (!wage?.wage) bad('커리어넷 임금 자료 없음');
  const used = { thanks: new Set(), ripple: new Set(), moods: {}, types: new Set() };
  const ends = [];

  // 2. 한 장면 안에서 다른 보기보다 모든 면에서 못한 보기(함정)가 있는가
  job.scenes.forEach((sc, i) => {
    if (sc.kind !== 'choice') return;
    const v = sc.options.map((o) => [o.fx.care || 0, o.fx.team || 0, o.fx.energy || 0, -(o.fx.delay || 0)]);
    v.forEach((a, x) => v.forEach((b, y) => {
      if (x !== y && b.every((n, k) => n >= a[k]) && b.some((n, k) => n > a[k])) bad(`${i}번 장면 "${sc.title}": "${sc.options[x].label}" 가 "${sc.options[y].label}" 보다 모든 면에서 못함`);
    }));
  });

  // 손으로 하는 장면: 놀이가 있고, 등급이 둘 이상이며, 시각이 앞뒤 장면과 어긋나지 않는가
  job.scenes.forEach((sc, i) => {
    if (i && toMin(sc.at) < toMin(job.scenes[i - 1].at)) bad(`${i}번 장면 "${sc.title}" 시각 ${sc.at} 이 앞 장면보다 이름`);
    if (sc.kind !== 'hands') return;
    if (!HANDS[sc.game]) bad(`${i}번 장면 "${sc.title}": 없는 놀이 ${sc.game}`);
    if (Object.keys(sc.grades || {}).length < 2) bad(`${i}번 장면 "${sc.title}": 등급이 둘 이상이어야 함`);
    if (!sc.type || !sc.moment) bad(`${i}번 장면 "${sc.title}": moment 와 type 필요`);
  });

  function walk(s) {
    const sc = sceneOf(s, job);
    const notes = enter(s, job);
    (sc.ripple || []).forEach((r, k) => { if (notes.some((n) => n.text === r.text)) used.ripple.add(k); });
    const go = (fn) => { const c = clone(s); fn(c); if (c.done) return end(c); next(c, job); walk(c); };
    if (sc.kind === 'choice') for (const o of optionsOf(s, sc)) go((c) => choose(c, job, o.idx));
    else if (sc.kind === 'order') for (const m of [0, 2]) go((c) => finishOrder(c, job, m));
    else if (sc.kind === 'hands') for (const g of Object.keys(sc.grades)) go((c) => finishHands(c, job, g));
    else if (sc.kind === 'pick') {
      const ok = sc.items.map((it, i) => (it.ok ? i : -1)).filter((i) => i >= 0), no = sc.items.map((it, i) => (it.ok ? -1 : i)).filter((i) => i >= 0);
      for (const set of [ok, [ok[0], ok[1], no[0]], [ok[0], no[0], no[1]]]) go((c) => finishPick(c, job, set));
    } else if (sc.kind === 'thanks') go((c) => { const l = thanksLine(c, job); used.thanks.add(l.text); });
    else if (sc.kind === 'leave') { go((c) => leave(c, job, true)); if (s.delay > 0) go((c) => leave(c, job, false)); }
    else if (sc.kind === 'tasks') go((c) => finishTasks(c, job));
    else go(() => {});
  }
  function end(s) {
    const p = payslip(s, job, wage?.wage || 3000), m = mood(s);
    ends.push({ s, p, m });
    used.moods[m.name] = (used.moods[m.name] || 0) + 1;
    s.log.forEach((l) => l.type && used.types.add(l.type));
    for (const k of ['care', 'team', 'energy']) if (s.g[k] < 0 || s.g[k] > 100) bad(`게이지 범위 밖 ${k}=${s.g[k]}`);
    // 결말 이름과 게이지가 맞는가
    const g = s.g, top = ['care', 'team', 'energy'].sort((a, b) => g[b] - g[a])[0];
    if (m.name.includes('사람 곁') && (top !== 'care' || g.energy < TIRED)) bad('"사람 곁" 결말인데 안심이 가장 높지 않음');
    if (m.name.includes('다 쓰고') && g.energy >= TIRED) bad('"다 쓰고" 결말인데 에너지가 남음');
    if (p.overMin > 120) bad(`연장 근무가 너무 김: ${p.overMin}분`);
  }
  walk(newDay(job));

  // 3. 쓰지 않는 글이 있는가
  const th = job.scenes.find((sc) => sc.kind === 'thanks');
  th.lines.forEach((l) => { if (!used.thanks.has(l.text)) bad(`한 번도 안 나오는 고마움 말: ${l.text}`); });
  job.scenes.forEach((sc) => (sc.ripple || []).forEach((r, k) => { if (!used.ripple.has(k)) bad(`한 번도 안 일어나는 여파: ${r.text}`); }));
  if (Object.keys(used.moods).length < 3) bad(`퇴근길 결말이 ${Object.keys(used.moods).length}가지뿐`);
  if (used.types.size < 4) bad(`흥미 유형이 ${used.types.size}가지뿐`);
  const unknown = [...used.types].filter((t) => !RIASEC[t]); if (unknown.length) bad('알 수 없는 흥미 유형 ' + unknown);

  const pays = ends.map((e) => e.p.total), overs = ends.map((e) => e.p.overMin);
  const hourly = ends[0].p.hourly;
  if (hourly < MIN_WAGE.hourly) bad(`시급 ${hourly}원이 최저임금보다 낮음`);
  console.log(`  길 ${ends.length.toLocaleString()}가지 · 시급 ${hourly.toLocaleString()}원${ends[0].p.floored ? ` (자료 시급 ${ends[0].p.raw.toLocaleString()}원 → 최저시급 적용)` : ''} · 일당 ${Math.min(...pays).toLocaleString()}~${Math.max(...pays).toLocaleString()}원 · 연장 0~${Math.max(...overs)}분`);
  for (const [k, v] of Object.entries(used.moods).sort((a, b) => b[1] - a[1])) console.log(`  ${(v / ends.length * 100).toFixed(1).padStart(5)}%  ${k}`);
  console.log(`  흥미 유형 ${[...used.types].sort().join('')}`);
  for (const k of ['care', 'team', 'energy']) { const v = ends.map((e) => e.s.g[k]); console.log(`  ${k} ${Math.min(...v)}~${Math.max(...v)}`); }
  for (const m of Object.keys(used.moods)) allMoods.add(m);
}
// 4. 어느 직업에서도 한 번도 안 나오는 퇴근길 결말이 있는가
for (const name of MOOD_NAMES) if (!allMoods.has(name)) bad(`어느 직업에서도 안 나오는 결말: ${name}`);
console.log(fail ? `\n✗ 문제 ${fail}개` : '\n✓ 모든 검사 통과');
process.exit(fail ? 1 : 0);
