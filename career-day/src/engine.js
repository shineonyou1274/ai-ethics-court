// 하루 엔진 — 화면 없이 숫자만 굴린다. 시뮬레이션(test/sim.mjs)도 이 파일을 그대로 쓴다.
// 게이지 셋: care(만나는 사람의 안심) · team(동료와의 호흡) · energy(내 에너지)
// delay: 계획보다 밀린 시간(분). 밀린 만큼 시계가 늦어지고, 퇴근 때 남아서 마치면 연장 근무가 된다.
import { salaryDay } from './pay.js';

export const GAUGES = [
  { k: 'care', icon: '🫶', name: '안심', long: '만나는 사람의 안심', color: '#f08f8f' },
  { k: 'team', icon: '🤝', name: '호흡', long: '동료와의 호흡', color: '#6fbfa3' },
  { k: 'energy', icon: '🔋', name: '에너지', long: '내 에너지', color: '#f2b84b' },
];

// 홀랜드 흥미 유형. 장면마다 "어떤 종류의 일"이었는지 꼬리표를 단다.
export { RIASEC } from '../../shared/workday.js'; // 흥미 유형은 앱끼리 함께 쓰는 약속

export const TIRED = 30; // 에너지가 이보다 낮으면 '다 쓰고 돌아가는 퇴근길'
const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
export const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const toHHMM = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const DRAIN = { tasks: 3, records: 1, choice: 3, order: 3, pick: 3, thanks: 0, leave: 0, reveal: 0, rest: 0 };

export function newDay(job) {
  return { job: job.id, i: 0, entered: -1, g: { care: 50, team: 50, energy: 75 }, delay: 0, breakWorked: 0, stayed: null, flags: {}, log: [], done: false };
}

export const sceneOf = (s, job) => job.scenes[s.i];
export function clockOf(s, job, sc = sceneOf(s, job)) { return toMin(sc.at) + (sc.kind === 'reveal' ? 0 : s.delay); }
export const shiftMin = (job) => toMin(job.shift.end) - toMin(job.shift.start) - job.shift.breakMin;

function apply(s, fx = {}) {
  const before = { ...s.g, delay: s.delay };
  for (const k of ['care', 'team', 'energy']) if (fx[k]) s.g[k] = clamp(s.g[k] + fx[k]);
  if (fx.delay) s.delay = Math.max(0, s.delay + fx.delay);
  if (fx.breakWorked) s.breakWorked += fx.breakWorked;
  const d = {}; for (const k of ['care', 'team', 'energy']) d[k] = s.g[k] - before[k]; d.delay = s.delay - before.delay;
  return d;
}
const merge = (a, b) => { const o = { ...a }; for (const k in b) o[k] = (o[k] || 0) + b[k]; return o; };

// 장면에 들어갈 때 한 번: 기본 피로가 쌓이고, 앞의 선택이 남긴 여파(ripple)가 나타난다.
export function enter(s, job) {
  if (s.entered === s.i) return [];
  s.entered = s.i;
  const sc = sceneOf(s, job), notes = [];
  apply(s, { energy: -(DRAIN[sc.kind] ?? 2) });
  for (const r of sc.ripple || []) {
    if (r.if(s)) { const d = apply(s, r.fx); notes.push({ text: r.text, d }); }
  }
  return notes;
}

const remember = (s, sc, label, type, extra = {}) => s.log.push({ i: s.i, at: sc.at, title: sc.title, label, type, ...extra });

// 선택 장면에서 지금 고를 수 있는 보기
export const optionsOf = (s, sc) => sc.options.map((o, idx) => ({ ...o, idx })).filter((o) => !o.when || o.when(s));

export function choose(s, job, idx) {
  const sc = sceneOf(s, job), o = sc.options[idx];
  const d = apply(s, o.fx);
  if (o.flag) s.flags[o.flag] = true;
  remember(s, sc, o.moment || o.label, o.type, { pick: o.label });
  return { reply: o.reply, d, fact: o.fact || sc.fact };
}

// 할 일 장면: 버튼을 모두 누르면 끝. 장면 전체에 드는 시간과 힘은 cost에 있다.
export function finishTasks(s, job) {
  const sc = sceneOf(s, job); const d = apply(s, sc.cost || {});
  if (sc.moment) remember(s, sc, sc.moment, sc.type);
  return { d };
}

// 순서 맞추기: 틀린 횟수만큼 시간이 더 든다.
export function finishOrder(s, job, mistakes) {
  const sc = sceneOf(s, job);
  const fx = merge(sc.cost || {}, mistakes ? { delay: 4 * mistakes, team: -2 * Math.min(mistakes, 3) } : { team: 3 });
  const d = apply(s, fx); remember(s, sc, sc.moment, sc.type, { mistakes });
  return { d };
}

// 골라 담기: 맞게 고른 것은 동료 호흡을 올리고, 잘못 고른 것은 내리고 확인 시간을 쓴다.
export function finishPick(s, job, picked) {
  const sc = sceneOf(s, job);
  const right = picked.filter((i) => sc.items[i].ok).length, wrong = picked.length - right;
  const missed = sc.items.filter((it) => it.ok).length - right;
  const d = apply(s, merge(sc.cost || {}, { team: right * 3 - wrong * 3 - missed * 2, delay: wrong * 3 }));
  s.flags[sc.id || 'pick'] = { right, wrong, missed };
  remember(s, sc, sc.moment, sc.type, { right, wrong });
  return { d, right, wrong, missed };
}

// 고마움 장면: 지금까지의 하루에 따라 다른 말을 듣는다. 위에서부터 처음 맞는 것.
export function thanksLine(s, job) {
  const sc = sceneOf(s, job); const line = sc.lines.find((l) => !l.if || l.if(s));
  return { ...line, d: apply(s, line.fx || {}) };
}

// 퇴근: 밀린 일이 있으면 남아서 마칠지(연장 근무) 다음 근무자에게 넘길지 정한다.
export function leave(s, job, stay) {
  s.stayed = !!stay && s.delay > 0;
  const fx = s.stayed ? { energy: -Math.round(s.delay / 3), care: 3 } : s.delay > 0 ? { team: s.flags.handoff?.right >= 3 ? 0 : -6 } : {};
  const d = apply(s, fx); s.done = true;
  return { d };
}

export function next(s, job) { s.i = Math.min(job.scenes.length - 1, s.i + 1); }

// 오늘 실제로 일한 시간(분): 약속된 시간 + 남아서 한 시간 + 쉬는 시간에 일한 시간
export function workedMin(s, job) {
  return shiftMin(job) + (s.stayed ? s.delay : 0) + s.breakWorked;
}
export function payslip(s, job, annual) {
  return { ...salaryDay(annual, workedMin(s, job), shiftMin(job)), worked: workedMin(s, job), shift: shiftMin(job) };
}

// 퇴근길의 나 — 판정이 아니라 오늘 하루의 모양을 보여 준다. 게이지 값과 반드시 맞아야 한다.
export function mood(s) {
  const g = s.g;
  let head;
  if (g.energy < TIRED) head = { icon: '💤', name: '다 쓰고 돌아가는 퇴근길', line: '오늘 가진 힘을 거의 다 썼어. 이런 날이 이어지면 오래 일하기 어려워. 진짜 직업인들은 이럴 때 어떻게 쉴까?' };
  else {
    const top = ['care', 'team', 'energy'].sort((a, b) => g[b] - g[a])[0];
    head = g[top] < 62 ? { icon: '🌀', name: '이것저것 챙기느라 바빴던 하루', line: '하나에 몰아주지 않고 고르게 나눴어. 그만큼 크게 빛난 순간도, 크게 어긋난 순간도 적었지.' } : {
      care: { icon: '🫶', name: '사람 곁을 지킨 하루', line: '만난 사람이 안심하도록 시간을 더 썼어. 그 시간은 어딘가에서 빌려 온 것이기도 해.' },
      team: { icon: '🤝', name: '팀과 호흡을 맞춘 하루', line: '혼자 다 하지 않고 동료와 나눠 맡았어. 일이 끊기지 않고 이어졌지.' },
      energy: { icon: '🌿', name: '내 속도를 지킨 하루', line: '무리하지 않고 힘을 남겼어. 내일도 같은 자리에 서려면 꼭 필요한 일이야.' },
    }[top];
  }
  const notes = [];
  if (g.care < 40) notes.push('만난 사람은 조금 서운했을지도 몰라.');
  if (g.team < 40) notes.push('동료가 내 몫까지 떠안은 순간이 있었어.');
  if (g.energy < 40 && g.energy >= TIRED) notes.push('몸은 꽤 지쳤어.');
  return { ...head, notes };
}
