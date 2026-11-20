// 걸어 다니기와 찾아오는 일 검사 (src/flow.js, src/world/nav.js · shared/DESIGN.md §2-3 "카페 방식")
//   1. 걸어 다니는 일터: 모든 장소 표시 자리가 막히지 않았고, 어느 자리에서 어느 자리로든 길이 있다
//   2. 걸어 다니는 직업: 장면마다 출발 자리에서 갈 자리까지 길이 있고, 일터 밖은 차로 오가며 돌아오는 길이 있다
//   3. 받은 일 목록: 무전·출동 벨로 오는 일은 그 장면 전에는 보이지 않고, 오면 '새로 옴'이다. 아침 일정은 처음부터 보인다.
//      약속(조건이 있는 일)은 조건이 맞을 때만 보이고, 지키면 '마침', 지나치면 '못 함'이 된다.
//   4. 걷지 않는 직업(병원)은 걸음이 하나도 없다 (지금처럼 장면이 차례로 열린다)
import { JOBS } from '../src/jobs/index.js';
import { PLACES } from '../src/places/index.js';
import { walkOn, stepFor, inbox, navOf, spotFor } from '../src/flow.js';
import { makeNav, pathLength } from '../src/world/nav.js';
import { newDay } from '../src/engine.js';

let fail = 0;
const bad = (msg) => { fail++; console.log('  ✗ ' + msg); };

// 0. 길 찾기 자체: 막힌 벽을 돌아간다
{
  const nav = makeNav({ bounds: [0, 10, 0, 10], blocks: [[4.8, 5.2, 0, 8]], pad: 0.3 });
  const path = nav.path({ x: 1, z: 1 }, { x: 9, z: 1 });
  if (!path) bad('길 찾기: 벽 옆으로 돌아가는 길을 못 찾음');
  else {
    const len = pathLength({ x: 1, z: 1 }, path);
    if (len < 15) bad(`길 찾기: 벽을 뚫고 지나감 (길이 ${len.toFixed(1)})`);
    for (let k = 0; k < path.length; k++) { const a = k ? path[k - 1] : { x: 1, z: 1 }, b = path[k]; for (let t = 0; t <= 1; t += 0.05) { const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t; if (nav.blocked(x, z)) { bad(`길 찾기: 길이 막힌 곳(${x.toFixed(2)}, ${z.toFixed(2)})을 지남`); k = path.length; break; } } }
  }
  if (nav.path({ x: 1, z: 1 }, { x: 1, z: 1 })?.length > 1) bad('길 찾기: 제자리인데 길이 김');
  const closed = makeNav({ bounds: [0, 10, 0, 10], blocks: [[4.8, 5.2, -1, 11]], pad: 0.3 });
  if (closed.path({ x: 1, z: 1 }, { x: 9, z: 1 })) bad('길 찾기: 완전히 막힌 곳 너머로 길을 찾음');
}

for (const [pid, place] of Object.entries(PLACES)) {
  if (!place.nav) continue;
  console.log(`\n■ 일터 ${place.name}`);
  const nav = navOf(place), spots = Object.entries(place.nav.spots);
  for (const [id, sp] of spots) if (nav.blocked(sp.x, sp.z)) bad(`자리 ${id}(${sp.name})가 막힌 곳 위에 있음`);
  for (const r of place.rooms) if (!place.nav.spots[r.id]) bad(`방 ${r.id}(${r.name})에 걸어갈 자리가 없음`);
  let longest = 0;
  for (const [a, pa] of spots) for (const [b, pb] of spots) {
    if (a === b) continue;
    const path = nav.path(pa, pb);
    if (!path) { bad(`${pa.name} → ${pb.name} 길이 없음`); continue; }
    const len = pathLength(pa, path); longest = Math.max(longest, len);
    const end = path[path.length - 1]; if (Math.hypot(end.x - pb.x, end.z - pb.z) > 0.01) bad(`${pa.name} → ${pb.name}: 길 끝이 자리에 닿지 않음`);
  }
  for (const [k, v] of Object.entries(place.nav.at || {})) if (!place.nav.spots[v]) bad(`at.${k} → 없는 자리 ${v}`);
  if (!place.nav.spots[place.nav.start] || !place.nav.spots[place.nav.depart]) bad('start·depart 자리가 없음');
  console.log(`  자리 ${spots.length}곳 · 서로 모두 이어짐 · 가장 긴 길 ${longest.toFixed(1)}`);
}

for (const job of JOBS) {
  const place = PLACES[job.place];
  if (!walkOn(job, place)) {
    // 걷지 않는 직업: 장면 목록에 걸음 표시가 있어도 쓰이지 않는다 (병원 직업은 지금 그대로)
    if (job.scenes.some((sc) => sc.notice)) bad(`${job.name}: 걷지 않는 직업에 notice 가 있음 (쓰이지 않음)`);
    continue;
  }
  console.log(`\n■ ${job.name} (걸어 다니기)`);
  const N = place.nav, nav = navOf(place);
  let walks = 0, travels = 0, departs = 0, backs = 0, total = 0;
  job.scenes.forEach((sc, i) => {
    const st = stepFor(job, place, i);
    if (!N.spots[st.from]) bad(`${i} "${sc.title}": 출발 자리 ${st.from} 없음`);
    if (!N.remote?.[sc.place] && sc.place !== 'outside' && !spotFor(place, sc.place)) bad(`${i} "${sc.title}": 장면 자리 ${sc.place} 가 일터 안 자리에도, 일터 밖에도 없음`);
    if (st.walk) {
      walks++;
      const a = N.spots[st.from], b = N.spots[st.walk], path = nav.path(a, b);
      if (!path) bad(`${i} "${sc.title}": ${a.name} → ${b.name} 길이 없음`); else total += pathLength(a, path);
    }
    if (st.remote && !st.travel && !st.away) bad(`${i} "${sc.title}": 일터 밖인데 가는 길이 없음`);
    if (st.travel) { travels++; if (!st.away) departs++; }
    if (st.back) backs++;
    if (st.remote && st.walk && st.walk !== N.depart) bad(`${i} "${sc.title}": 일터 밖으로 나가려면 ${N.depart} 로 가야 함`);
    if (sc.notice && !sc.todo) bad(`${i} "${sc.title}": 알림(${sc.notice.via})이 온 일이 받은 일 목록에 없음`);
    if (sc.notice && [].concat(sc.todo || []).some((t) => t.known)) bad(`${i} "${sc.title}": 찾아오는 일인데 아침부터 보임(known)`);
  });
  if (!walks) bad('걸어가는 장면이 하나도 없음');
  const dispatches = job.scenes.filter((sc) => sc.notice);
  if (dispatches.length < 2) bad(`찾아오는 일(무전·출동 벨)이 ${dispatches.length}개뿐`);
  if (departs !== backs) bad(`일터 밖으로 ${departs}번 나갔는데 ${backs}번 돌아옴`);
  console.log(`  걷기 ${walks}번 · 차로 나가기 ${travels}번 · 돌아오기 ${backs}번 · 걷는 길 모두 ${total.toFixed(0)} · 찾아오는 일 ${dispatches.map((sc) => `${sc.at} ${sc.notice.via}`).join(', ')}`);

  // 받은 일 목록을 하루 따라 넘겨 본다: 약속한 날과 하지 않은 날, 약속을 지킨 날
  const ids = (list) => list.map((x) => `${x.i}:${x.label}`);
  for (const [name, flagsAt] of [['약속 없음', {}], ['약속하고 지킴', { promise: true, kept: true }], ['약속하고 못 지킴', { promise: true }]]) {
    const s = newDay(job); let promiseSeen = false;
    for (s.i = 0; s.i < job.scenes.length; s.i++) {
      const sc = job.scenes[s.i], list = inbox(s, job);
      for (const it of list) {
        const src = job.scenes[it.i];
        const t = [].concat(src.todo).find((x) => x.label === it.label);
        if (!t.known && it.i > s.i) bad(`${name}: "${it.label}" 이 오기 전(${sc.at})에 보임`);
        if (it.fresh && it.i !== s.i) bad(`${name}: "${it.label}" 이 지금 온 일이 아닌데 '새로 옴'`);
        if (t.via === '약속') promiseSeen = true;
      }
      const nowItems = list.filter((x) => x.state === 'now');
      if (sc.todo && !nowItems.length) bad(`${name}: ${sc.at} "${sc.title}" 의 일이 목록에서 '지금'이 아님`);
      if (new Set(ids(list)).size !== list.length) bad(`${name}: 목록에 같은 일이 두 번`);
      // 이 장면에서 세워지는 표시
      if (flagsAt.promise && sc.options?.some((o) => o.flag === 'promise')) s.flags.promise = true;
      if (flagsAt.kept && sc.options?.some((o) => o.flag === 'kept')) s.flags.kept = true;
    }
    s.i = job.scenes.length - 1;
    if (!flagsAt.promise && promiseSeen) bad(`${name}: 약속하지 않았는데 약속이 목록에 보임`);
    if (flagsAt.promise && !promiseSeen) bad(`${name}: 약속했는데 목록에 없음`);
    const end = inbox({ ...s, i: job.scenes.length }, job).find((x) => x.via === '약속');
    if (flagsAt.kept && end?.state !== 'done') bad(`${name}: 약속을 지켰는데 '${end?.state}'`);
    if (flagsAt.promise && !flagsAt.kept && end?.state !== 'missed') bad(`${name}: 약속을 못 지켰는데 '${end?.state}'`);
    console.log(`  ${name}: 마지막 목록 ${inbox({ ...s, i: job.scenes.length }, job).map((x) => `${x.label}(${x.state})`).join(', ')}`);
  }
  // 하루가 "이야기 하나"로 이어지는가: 아침 시장 점검의 약속이 오후 출동 현장의 보기로 돌아온다
  const keptOpt = job.scenes.flatMap((sc) => sc.options || []).find((o) => o.flag === 'kept');
  if (keptOpt && keptOpt.when({ flags: {} })) bad('약속을 지키러 가는 보기가 약속하지 않은 날에도 보임');
  if (keptOpt && !keptOpt.when({ flags: { promise: true } })) bad('약속을 지키러 가는 보기가 약속한 날에 안 보임');
}

// 걷지 않는 직업이 하나라도 있으면, 그 직업은 걸음 계산을 아예 타지 않는다 (병원)
const still = JOBS.filter((j) => !walkOn(j, PLACES[j.place]));
console.log(`\n걷지 않는 직업 ${still.length}개: ${still.map((j) => j.name).join(', ')}`);
for (const j of still) if (PLACES[j.place].nav && j.walk) bad(`${j.name}: walk 인데 걷지 않음`);
console.log(fail ? `\n✗ 문제 ${fail}개` : '\n✓ 걸어 다니기 검사 통과');
process.exit(fail ? 1 : 0);
