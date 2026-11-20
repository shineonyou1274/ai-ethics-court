// 걸어 다니며 일하기 — "카페 방식"(shared/DESIGN.md §2-3)을 하루 엔진 위에 얹는다. 화면 없이 계산만 한다(test/walk.mjs 가 그대로 쓴다).
//
// 켜는 법: 일터(place)가 nav 를 적고, 직업(job)이 walk: true 를 적는다. 둘 중 하나라도 없으면 지금처럼 장면이 차례로 열린다(병원 직업들).
//
// place.nav = {
//   bounds, blocks,                  // 걸을 수 있는 바닥과 막힌 곳 (src/world/nav.js)
//   spots: { garage: { x, z, name }, … },   // 걸어갈 자리. name 은 화면에 보이는 장소 이름
//   at: { locker: 'gear', … },       // 장면의 place → 걸어갈 자리 (방 이름과 같으면 적지 않아도 된다)
//   start: 'door',                   // 출근해서 처음 서 있는 자리
//   remote: { market: { name: '나루 시장', go: '…', back: '…' }, … },  // 일터 밖. 걸어가지 않고 차를 타고 오간다
//   depart: 'garage',                // 일터 밖으로 나갈 때 타러 가는 자리이자, 돌아와 내리는 자리
// }
//
// 장면에는 이렇게 적을 수 있다.
//   notice: { via: '무전', text: '…' }    일이 찾아오는 알림 (무전·출동 벨·전화·동료). 그 장면에 가기 전에 먼저 보인다
//   todo: { label, via, known, done, missed } 또는 그 목록   할 일 목록(받은 일)에 올라갈 일
//     known: true 면 아침부터 알고 있는 일(일정). 함수면 그 조건이 맞을 때만 보인다(예: 약속한 날). 없으면 그 장면이 될 때 새로 들어온다.
//     done(s) · missed(s): 마쳤는지, 놓쳤는지 (없으면 그 장면을 지나면 마친 것). at: 목록에 보일 시각 (없으면 장면 시각)
//     now(s, i): 지금 하는 일인지 (없으면 그 장면일 때. 예: 약속을 지키러 가는 다음 장면까지 '지금')
//   goal: '옷 갈아입기'   할 일 목록에 올리지 않는 장면의 짧은 이름 (3D 장소 표시의 둘째 줄)
//   skip: (s) => …        이 조건이 맞으면 건너뛰는 장면 (예: 약속을 지키러 가기로 했을 때만 여는 장면, engine.js 의 next)
//
// 병원처럼 한 일터 안에서 한 직업만 다른 층을 걸을 때는, 직업이 floor 를 적고 그 층을 places/index.js 의 FLOORS 에 둔다(placeOf).
import { makeNav } from './world/nav.js';
import { skipped } from './engine.js';

export const walkOn = (job, place) => !!(job?.walk && place?.nav);

const navCache = new WeakMap();
export function navOf(place) { if (!navCache.has(place)) navCache.set(place, makeNav(place.nav)); return navCache.get(place); }

// 장면의 place 가 일터 안 어느 자리인지 (일터 밖이면 null)
export function spotFor(place, pid) {
  const n = place.nav; if (!pid || n.remote?.[pid]) return null;
  if (pid === 'outside') return n.start;
  const id = n.at?.[pid] || pid; return n.spots[id] ? id : null;
}
const remoteOf = (place, pid) => place.nav.remote?.[pid] || null;

// i 번째 장면에 들어가기 전의 걸음: 어디서 출발해(from) 어디로 걸어가고(walk), 차로 어디를 오가는지(travel).
//   from     내 캐릭터가 지금 서 있는 자리 (앞 장면의 자리. 일터 밖에서 돌아왔으면 차를 내리는 자리)
//   walk     걸어가야 할 자리 (이미 그 자리에 있거나, 일터 밖에서 일터 밖으로 옮길 때는 null)
//   back     일터 밖에서 돌아오는 길의 한 줄 (걷기 전에 보여 준다)
//   travel   일터 밖으로 나가는 길의 한 줄 (걸어간 뒤에 보여 준다)
//   s 를 주면 건너뛴 장면(skip)은 앞 장면으로 치지 않는다 (그 자리에 가지 않았으니까)
export function stepFor(job, place, i, s = null) {
  let k = i - 1; while (s && k > 0 && skipped(s, job, k)) k--;
  const n = place.nav, sc = job.scenes[i], prev = k >= 0 ? job.scenes[k] : null;
  const prevRemote = prev ? remoteOf(place, prev.place) : null, nowRemote = remoteOf(place, sc.place);
  const from = !prev ? n.start : prevRemote ? n.depart : spotFor(place, prev.place) || n.start;
  // away: 일터 밖에서 일터 밖으로 곧장 옮길 때, 지금 있는 바깥 자리 (3D는 그곳을 그대로 보여 준다)
  const out = { i, from, walk: null, back: null, travel: null, notice: sc.notice || null, remote: !!nowRemote, away: prevRemote && nowRemote ? prev.place : null };
  if (prevRemote && !nowRemote) out.back = prevRemote.back || '일터로 돌아왔어요.';
  if (nowRemote) {
    if (!prevRemote) { out.walk = from === n.depart ? null : n.depart; out.travel = nowRemote.go; }
    else if (prev.place !== sc.place) out.travel = nowRemote.go;
  } else {
    const to = spotFor(place, sc.place);
    if (to && to !== from) out.walk = to;
  }
  return out;
}
// 걸음이 있는 장면인지 (알림만 있어도 알림을 먼저 보여 준다)
export const hasStep = (st) => !!(st.walk || st.travel || st.back || st.notice);

// 받은 일 목록: 아침부터 아는 일(일정)과, 하루 동안 새로 들어온 일(무전, 출동 벨, 약속…).
//   state: done(마침) · now(지금) · next(곧) · missed(놓침). fresh: 방금 들어온 일
export function inbox(s, job) {
  const out = [];
  job.scenes.forEach((sc, i) => {
    if (skipped(s, job, i)) return; // 건너뛰는 장면의 일은 목록에 오르지 않는다
    for (const t of [].concat(sc.todo || [])) {
      if (typeof t.known === 'function' && !t.known(s)) continue; // 조건이 있는 일(약속)은 조건이 맞을 때만 목록에 오른다
      const known = !!t.known, arrived = i <= s.i;
      if (!known && !arrived) continue;
      const missed = t.missed ? t.missed(s, i) : false;
      const done = !missed && (t.done ? t.done(s, i) : i < s.i);
      out.push({ i, label: t.label, via: t.via || '일정', at: t.at || sc.at, state: missed ? 'missed' : done ? 'done' : (t.now ? t.now(s, i) : i === s.i) ? 'now' : 'next', fresh: !known && i === s.i });
    }
  });
  return out;
}
