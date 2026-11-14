// 직업체험 앱들이 함께 쓰는 약속: 일당 계산, 흥미 유형, 출근 기록.
// 이 파일은 화면과 3D를 모른다. 숫자와 기록만 다룬다. 고칠 때는 shared/README.md 의 '고치는 순서'를 따른다.
// 어디서든 그대로 import 할 수 있도록 바깥 의존성이 없다 (브라우저 ES 모듈, Node 둘 다 동작).

export const WORKDAY_VERSION = 1;

// ── 일당 ──────────────────────────────────────────────
// 커리어넷 연봉(만 원, 중앙값) → 시급 → 하루 기본급 + 연장 수당. 모두 세금과 보험료를 떼기 전(세전).
export const MONTH_HOURS = 209; // 주 40시간 + 주휴 8시간 기준의 한 달 시간 (근로기준법 계산 관행)
export const MIN_WAGE = { year: 2026, hourly: 10320 }; // 2026년 최저임금 (최저임금위원회 고시)
export const OVERTIME_RATE = 1.5; // 하루 8시간을 넘긴 시간은 시급의 1.5배 (상시 5명 이상 사업장)
export const OVERTIME_CAP_MIN = 120; // 체험에서 연장 근무는 2시간을 넘기지 않는다

const r10 = (n) => Math.round(n / 10) * 10;

export function hourlyFromAnnual(annualMan) {
  return r10(annualMan * 10000 / 12 / MONTH_HOURS);
}

// 실제로 주는 시급. 자료가 몇 년 전 조사라 올해 최저시급보다 낮으면 최저시급을 준다(최저임금보다 적게 주는 것은 법으로 막혀 있다).
export function hourlyOf(annualMan) {
  const raw = hourlyFromAnnual(annualMan);
  return { raw, hourly: Math.max(raw, MIN_WAGE.hourly), floored: raw < MIN_WAGE.hourly };
}

// workedMin: 오늘 실제로 일한 시간(분, 쉬는 시간 빼고. 쉬는 시간에 일했다면 그 시간은 넣는다)
// shiftMin: 약속된 근무 시간(분, 보통 480)
export function salaryDay(annualMan, workedMin, shiftMin = 480) {
  const { hourly, raw, floored } = hourlyOf(annualMan);
  const baseMin = Math.min(workedMin, shiftMin);
  const overMin = Math.max(0, workedMin - shiftMin);
  const base = r10(hourly * baseMin / 60);
  const overtime = r10(hourly * OVERTIME_RATE * overMin / 60);
  return { hourly, raw, floored, base, overtime, overMin, total: base + overtime };
}

export const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;
export function manwon(n) { // 1234567 → "123만 4,567원"
  n = Math.round(n); const man = Math.floor(n / 10000), rest = n % 10000;
  return man ? `${man.toLocaleString('ko-KR')}만${rest ? ' ' + rest.toLocaleString('ko-KR') : ''}원` : won(n);
}

// ── 흥미 유형 (돌아보기) ───────────────────────────────
// 판정이 아니라 '그 순간의 일이 어느 쪽 일인지'를 알려 주는 데만 쓴다.
export const RIASEC = {
  R: { name: '현실형', what: '손과 몸, 도구로 직접 해내는 일' },
  I: { name: '탐구형', what: '까닭을 따지고 원인을 찾는 일' },
  A: { name: '예술형', what: '새롭게 꾸미고 표현하는 일' },
  S: { name: '사회형', what: '사람을 돕고 마음을 살피는 일' },
  E: { name: '진취형', what: '앞장서서 이끌고 설득하는 일' },
  C: { name: '관습형', what: '정확하게 확인하고 정리하는 일' },
};

// ── 출근 기록 ─────────────────────────────────────────
// 모든 앱이 하루를 마치면 이 모양의 기록 하나를 남긴다. 이름·학번 등 학생을 알아볼 정보는 넣지 않는다.
export const RECORDS_KEY = 'workday-records-v1'; // 같은 주소(origin)에 올린 앱끼리 지갑을 함께 쓴다

const today = () => {
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// 앱이 넘겨줄 것: app, job{id,name,careernet}, place, annual(만 원), wageYear, wageBasis,
// shift{start,end,breakMin}, workedMin, shiftMin, ending{name,icon?}, like{label,type}, hard{label,type}, extra?
export function makeRecord(o) {
  const pay = salaryDay(o.annual, o.workedMin, o.shiftMin);
  return {
    v: WORKDAY_VERSION,
    app: o.app,
    date: o.date || today(),
    job: { id: o.job.id, name: o.job.name, careernet: String(o.job.careernet) },
    place: o.place,
    shift: { start: o.shift.start, end: o.shift.end, breakMin: o.shift.breakMin },
    pay: {
      annual: o.annual, wageYear: o.wageYear ?? null, wageBasis: o.wageBasis ?? null,
      hourly: pay.hourly, floored: pay.floored,
      workedMin: o.workedMin, shiftMin: o.shiftMin, overMin: pay.overMin,
      base: pay.base, overtime: pay.overtime, total: pay.total,
    },
    ending: { name: o.ending.name, icon: o.ending.icon ?? null },
    like: { label: o.like.label, type: o.like.type },
    hard: { label: o.hard.label, type: o.hard.type },
    extra: o.extra ?? null, // 앱마다 따로 보여 줄 것 (예: 바리스타의 가게 매출). 일당에는 섞지 않는다
  };
}

// 기록이 약속을 지키는지 검사한다. 문제 목록을 돌려준다(빈 배열이면 통과).
export function checkRecord(r) {
  const errs = [];
  const need = (ok, msg) => { if (!ok) errs.push(msg); };
  need(r && r.v === WORKDAY_VERSION, `v 는 ${WORKDAY_VERSION}`);
  if (!r) return errs;
  need(typeof r.app === 'string' && r.app, 'app 이름');
  need(/^\d{4}-\d{2}-\d{2}$/.test(r.date), 'date 는 YYYY-MM-DD');
  need(r.job && r.job.id && r.job.name && r.job.careernet, 'job.id / name / careernet');
  need(typeof r.place === 'string' && r.place, 'place');
  need(r.shift && /^\d{2}:\d{2}$/.test(r.shift.start) && /^\d{2}:\d{2}$/.test(r.shift.end), 'shift.start / end 는 HH:MM');
  const p = r.pay || {};
  need(p.annual > 0, 'pay.annual (커리어넷 연봉, 만 원)');
  if (p.annual > 0 && p.workedMin >= 0) {
    const want = salaryDay(p.annual, p.workedMin, p.shiftMin);
    need(p.total === want.total && p.hourly === want.hourly, `pay 계산이 shared/workday.js 와 다름 (기대 ${want.total})`);
  }
  need(p.hourly >= MIN_WAGE.hourly, '시급이 최저시급보다 낮음');
  need(p.overMin <= OVERTIME_CAP_MIN, `연장 근무가 ${OVERTIME_CAP_MIN}분을 넘음`);
  need(r.ending && r.ending.name, 'ending.name');
  for (const k of ['like', 'hard']) need(r[k] && r[k].label && (r[k].type === null || RIASEC[r[k].type]), `${k}.label / type(R·I·A·S·E·C 또는 null)`);
  need(r.like && r.hard && r.like.label !== r.hard.label, '끌린 순간과 버거운 순간은 서로 달라야 함');
  for (const bad of ['student', 'studentName', 'name', 'email', 'phone']) need(!(bad in r), `학생 정보(${bad})를 넣지 않음`);
  return errs;
}

// ── 이 기기에 쌓기 ────────────────────────────────────
const ls = () => { try { return globalThis.localStorage; } catch { return null; } };

export function loadRecords() {
  try { const a = JSON.parse(ls()?.getItem(RECORDS_KEY)); return Array.isArray(a) ? a : []; } catch { return []; }
}
export function saveRecord(r) {
  const all = loadRecords(); all.push(r);
  try { ls()?.setItem(RECORDS_KEY, JSON.stringify(all)); } catch { /* 저장이 막힌 기기에서도 체험은 된다 */ }
  return all;
}
// 지금까지 받은 일당의 합. 직업끼리 견주거나 순위를 매기는 데 쓰지 않는다.
export const walletTotal = (records = loadRecords()) => records.reduce((a, r) => a + (r.pay?.total || 0), 0);
