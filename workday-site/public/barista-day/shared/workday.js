// 직업체험 앱들이 함께 쓰는 약속: 일당 계산, 흥미 유형, 출근 기록.
// 이 파일은 화면과 3D를 모른다. 숫자와 기록만 다룬다. 고칠 때는 shared/README.md 의 '고치는 순서'를 따른다.
// 어디서든 그대로 import 할 수 있도록 바깥 의존성이 없다 (브라우저 ES 모듈, Node 둘 다 동작).

export const WORKDAY_VERSION = 1;

// ── 일당 ──────────────────────────────────────────────
// 커리어넷 연봉(만 원, 중앙값) → 시급 → 하루 기본급 + 연장 수당. 모두 세금과 보험료를 떼기 전(세전).
export const MONTH_HOURS = 209; // 주 40시간 + 주휴 8시간 기준의 한 달 시간 (근로기준법 계산 관행)
// 일당 명세서에 늘 보이는 한 줄 (모든 앱 같은 문장). 직업끼리 일당을 견주어 순위로 읽지 않게 한다
export const PAY_NOTE = '일당은 오늘 한 일의 양이 아니라, 그 직업 사람들의 평균 연봉에서 나와요. 하루가 쉬워 보여도 많을 수 있고, 힘들어 보여도 적을 수 있어요.';
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

// 커리어넷 직업정보 화면 주소 (명세서의 출처 링크로 쓴다)
export const careernetUrl = (code) => `https://www.career.go.kr/cloud/w/job/view?seq=${encodeURIComponent(code)}`;

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
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function makeRecord(o) {
  const pay = salaryDay(o.annual, o.workedMin, o.shiftMin);
  return {
    v: WORKDAY_VERSION,
    id: o.id || newId(), // 기록 하나의 이름표. 같은 기록을 두 번 저장하지 않는 데 쓴다
    session: o.session || currentSession().id, // 이 기기에서 지금 출근하는 사람 (기기를 함께 쓸 때 기록을 나눈다)
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
  need(r.id === undefined || (typeof r.id === 'string' && r.id), 'id 는 글자');
  need(r.session === undefined || (typeof r.session === 'string' && r.session), 'session 은 글자');
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
// (v1 처음 모양) 저장한 뒤 목록을 돌려준다. 성공 여부가 필요하면 saveRecordSafe 를 쓴다.
export function saveRecord(r) {
  const all = loadRecords(); all.push(r);
  try { ls()?.setItem(RECORDS_KEY, JSON.stringify(all)); } catch { /* 저장이 막힌 기기에서도 체험은 된다 */ }
  return all;
}
// 저장하고 결과를 알려 준다. { ok, duplicate, error, records }
// - 같은 id 의 기록이 이미 있으면 다시 넣지 않는다 (두 번 누르기, 화면 다시 열기)
// - 쓰기 직전에 다시 읽어서, 다른 탭이 그사이 저장한 기록을 지우지 않는다
// - 쓴 뒤 다시 읽어 정말 들어갔는지 확인한다 (저장이 막힌 기기에서는 ok: false)
export function saveRecordSafe(r) {
  const store = ls();
  if (!store) return { ok: false, duplicate: false, error: 'no-storage', records: [] };
  try {
    const all = loadRecords();
    if (r.id && all.some((x) => x.id === r.id)) return { ok: true, duplicate: true, error: null, records: all };
    all.push(r);
    store.setItem(RECORDS_KEY, JSON.stringify(all));
    const back = loadRecords();
    const ok = r.id ? back.some((x) => x.id === r.id) : back.length === all.length;
    return { ok, duplicate: false, error: ok ? null : 'not-saved', records: back };
  } catch (e) {
    return { ok: false, duplicate: false, error: String(e?.name || e), records: loadRecords() };
  }
}

// 지금까지 받은 일당의 합. 직업끼리 견주거나 순위를 매기는 데 쓰지 않는다.
// 기본은 이 기기의 모든 기록(v1 처음 약속 그대로). 기기를 함께 쓰는 화면에서는 walletTotal(loadMine()) 또는 walletSummary() 를 쓴다.
export const walletTotal = (records = loadRecords()) => records.reduce((a, r) => a + (r.pay?.total || 0), 0);

// ── 기기를 함께 쓸 때: 지금 출근하는 사람(세션) ─────────────────
// 학교 태블릿처럼 여러 학생이 한 기기를 쓰면, 앞사람의 기록이 섞이지 않게 사람마다 세션을 나눈다.
// - 기록은 저장할 때 지금 세션의 id 를 단다(makeRecord).
// - 지갑, 도장, 선생님께 보내기는 지금 세션의 기록(loadMine)만 쓴다.
// - 앞사람 기록은 지우지 않고 숨긴다. 원하면 이 기기의 기록을 모두 지울 수 있다.
export const SESSION_KEY = 'workday-session-v1';

export function currentSession() {
  const store = ls();
  try { const s = JSON.parse(store?.getItem(SESSION_KEY)); if (s?.id) return s; } catch { /* 아래에서 새로 만든다 */ }
  // 처음: 세션을 만들고, 세션 표시가 없던 예전 기록은 이 사람의 것으로 본다
  const s = { id: newId(), since: today(), checked: null };
  try {
    store?.setItem(SESSION_KEY, JSON.stringify(s));
    const all = loadRecords();
    if (all.some((r) => !r.session)) store?.setItem(RECORDS_KEY, JSON.stringify(all.map((r) => (r.session ? r : { ...r, session: s.id }))));
  } catch { /* 저장이 막혀도 체험은 된다 */ }
  return s;
}

// 지금 출근하는 사람의 기록만
export const loadMine = () => { const id = currentSession().id; return loadRecords().filter((r) => r.session === id); };

// 오늘 이 기기에서 "누구의 기록인지" 아직 묻지 않았으면 true (앞사람 기록이 남아 있을 때만 묻는다)
export function needsWhoCheck() {
  const s = currentSession();
  return s.checked !== today() && loadMine().length > 0;
}
// "내 기록이에요, 이어서 할게요"
export function keepSession() {
  const s = { ...currentSession(), checked: today() };
  try { ls()?.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* 무시 */ }
  return s;
}
// "새로 출근하는 사람이에요". wipe 가 true 면 이 기기의 출근 기록을 모두 지운다.
export function startNewSession({ wipe = false } = {}) {
  const s = { id: newId(), since: today(), checked: today() };
  try {
    ls()?.setItem(SESSION_KEY, JSON.stringify(s));
    if (wipe) ls()?.setItem(RECORDS_KEY, '[]');
  } catch { /* 무시 */ }
  return s;
}

// 도장 카드와 지갑에 쓰는 요약: 다녀온 직업, 일한 시간, 받은 일당
export function walletSummary(records = loadMine()) {
  const jobs = [...new Set(records.map((r) => r.job?.id).filter(Boolean))];
  const minutes = records.reduce((a, r) => a + (r.pay?.workedMin || 0), 0);
  return { days: records.length, jobs, minutes, total: walletTotal(records) };
}
