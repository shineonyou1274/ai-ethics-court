// 화면과 흐름: 직업 고르기 → 하루(장면 열한 개 + 직업마다 손으로 하는 장면) → 일당 명세서 → 퇴근길 돌아보기 → 출근 기록
import '../../shared/design.css'; // 공통 디자인 토큰 (shared/DESIGN.md)
import './style.css';
import { JOBS, jobById } from './jobs/index.js';
import { PLACES } from './places/index.js';
import { createWorld } from './world/world.js';
import { HANDS } from './hands/index.js';
import { sendView, teacherView } from './collect.js';
import { CAREERNET } from './data/careernet.js';
import { sfx, startMusic, toggleSound, soundOn } from './audio.js';
import { MIN_WAGE, earnedSoFar, hourlyOf, won, manwon } from './pay.js';
import { PAY_NOTE, makeRecord, checkRecord, loadRecords, loadMine, saveRecordSafe, walletSummary, needsWhoCheck, keepSession, startNewSession, RECORDS_KEY } from '../../shared/workday.js';
import {
  GAUGES, RIASEC, newDay, sceneOf, enter, optionsOf, choose, finishTasks, finishOrder, finishPick, finishHands, thanksLine, leave, next,
  payslip, mood, clockOf, shiftMin, toMin, toHHMM,
} from './engine.js';

const $ = (q) => document.querySelector(q);
const panel = $('#panel'), hud = $('#hud');
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const on = (q, fn) => panel.querySelectorAll(q).forEach((b) => b.addEventListener('click', () => fn(b)));
function view(html) {
  panel.innerHTML = `<div class="view">${html}</div>`; panel.scrollTop = 0;
  const h = panel.querySelector('h1, h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
}

// ── 저장: 이 기기에만. 진행 중인 하루와 지난 출근 기록 ──
const KEY = 'career-day-v1';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
  set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* 저장이 막힌 기기에서도 체험은 된다 */ } },
};
let saved = store.get();
// 출근 기록은 모든 직업체험 앱이 함께 쓰는 곳(shared/workday.js)에 둔다. 예전 칸에 있던 기록은 한 번 옮긴다.
if (saved.records?.length) {
  try {
    const old = saved.records.map((r) => ({ v: 1, app: 'career-day', date: r.date, job: { id: r.job, name: r.name, careernet: String(jobById(r.job)?.careernet || '') }, place: 'hospital', shift: null, pay: { total: r.pay }, ending: { name: r.mood, icon: null }, like: { label: r.like, type: r.likeType || null }, hard: { label: r.hard, type: null }, extra: { moved: true } }));
    localStorage.setItem(RECORDS_KEY, JSON.stringify([...old, ...loadRecords()]));
  } catch { /* 옮기지 못해도 체험은 된다 */ }
  delete saved.records; store.set(saved);
}
let diary = loadMine(); // 지금 이 기기에서 출근하는 사람의 기록만 (기기를 함께 쓸 때 앞사람 기록은 숨김)
const save = () => { saved.current = S && !S.closed ? S : null; store.set(saved); };

// ── 3D 일터 ──
let world = null, worldPlace = null;
function ensureWorld(placeId) {
  if (worldPlace === placeId) return world;
  world?.destroy(); world = null;
  const old = $('#gl'), canvas = old.cloneNode(false); old.replaceWith(canvas);
  worldPlace = placeId; $('.fallback')?.remove();
  try { world = createWorld(canvas, $('#stage'), PLACES[placeId]); } catch (e) { console.warn('3D 일터를 띄우지 못해 글과 버튼으로 진행해요.', e); world = null; }
  if (!world) { canvas.classList.add('off'); $('#stage').insertAdjacentHTML('afterbegin', `<div class="fallback"><div><b>${PLACES[placeId].icon}</b>이 기기에서는 3D 일터 대신<br>글과 버튼으로 하루를 보내요.</div></div>`); }
  return world;
}

// ── 지금 하는 하루 ──
let S = null, J = null;
// 첫 화면에서 보고 있는 일터. 주소 끝에 #fire-station 처럼 일터 이름이 오면 그 일터부터 보여 준다 (사이트 첫 화면의 단추가 쓴다).
let focusPlace = PLACES[location.hash.slice(1)] ? location.hash.slice(1) : PLACES[saved.place] ? saved.place : 'hospital';
// 함께 올린 사이트(/career-day/) 안에서 열렸으면 첫 화면으로 돌아가는 길을 보여 준다. 파일 하나로 열면 숨긴다.
const inSite = /\/career-day\/(index\.html)?$/.test(location.pathname);
const wageOf = (job) => CAREERNET[job.careernet];
const annual = () => wageOf(J)?.wage || 0;
const idxOf = (pred) => J.scenes.findIndex(pred);

function workedSoFar() {
  const sc = sceneOf(S, J), br = idxOf((x) => x.isBreak);
  const m = toMin(sc.at) - toMin(J.shift.start) - (S.i > br ? J.shift.breakMin : 0);
  return Math.max(0, Math.min(shiftMin(J), m));
}

let shown = {};
function drawHud() {
  hud.hidden = false;
  const sc = sceneOf(S, J);
  $('#clock').innerHTML = S.closed ? `${esc(J.name)} · 퇴근 ${toHHMM(toMin(J.shift.end) + (S.stayed ? S.delay : 0))}`
    : `${esc(J.name)} · ${toHHMM(clockOf(S, J, sc))}${S.delay > 0 && sc.kind !== 'reveal' ? `<small>${S.delay}분 밀림</small>` : ''}`;
  const box = $('#gauges');
  if (!box.children.length) box.innerHTML = GAUGES.map((g) => `<div class="gauge" data-k="${g.k}"><small>${g.icon}<span class="nm"> ${g.name}</span></small><b></b><i><u style="background:${g.color}"></u></i></div>`).join('');
  for (const g of GAUGES) {
    const el = box.querySelector(`[data-k="${g.k}"]`), v = S.g[g.k];
    el.querySelector('b').textContent = v; el.querySelector('u').style.width = v + '%';
    if (shown[g.k] !== undefined && shown[g.k] !== v) {
      const d = v - shown[g.k], f = document.createElement('span');
      f.className = 'float ' + (d > 0 ? 'up' : 'down'); f.textContent = (d > 0 ? '+' : '−') + Math.abs(d);
      el.append(f); setTimeout(() => f.remove(), 1700);
    }
    shown[g.k] = v;
  }
  $('#money').textContent = `🪙 ${won(S.closed ? payslip(S, J, annual()).total : earnedSoFar(annual(), workedSoFar(), shiftMin(J)))}`;
}

// 밀린 일만큼 기다리는 사람. 쉬는 곳, 탈의실처럼 일터가 정한 조용한 곳(quiet)과 퇴근 뒤에는 따라오지 않는다.
const waiting = () => (S.closed || PLACES[J.place].quiet.includes(sceneOf(S, J).place) ? 0 : Math.ceil(S.delay / 8));

// 바뀐 값 꼬리표와 3D 반응
function chips(d = {}) {
  const out = GAUGES.filter((g) => d[g.k]).map((g) => `<span class="chip ${d[g.k] > 0 ? 'up' : 'down'}">${g.icon} ${g.name} ${d[g.k] > 0 ? '+' : '−'}${Math.abs(d[g.k])}</span>`);
  if (d.delay) out.push(`<span class="chip time">⏱ ${d.delay > 0 ? `${d.delay}분 밀림` : `${-d.delay}분 따라잡음`}</span>`);
  return out.length ? `<div class="chips">${out.join('')}</div>` : '';
}
function react(d = {}) {
  drawHud();
  if (world) {
    if (d.care > 0) world.burst('care', Math.min(6, 1 + Math.round(d.care / 3)));
    if (d.team > 0) world.burst('team', Math.min(5, 1 + Math.round(d.team / 3)));
    if (d.energy > 6) world.burst('energy', 3);
    if (d.energy < -5) world.burst('tired', 2);
    world.crowd(waiting());
  }
  const sum = (d.care || 0) + (d.team || 0) + (d.energy || 0) / 2 - (d.delay || 0) / 3;
  setTimeout(() => sfx(sum < 0 ? 'bad' : 'good'), 100);
}

// ── 시작 화면 ──
function title() {
  S = null; J = null; hud.hidden = true; $('#gauges').innerHTML = ''; shown = {};
  const P = PLACES[focusPlace]; paintPlace(P);
  const w0 = ensureWorld(P.id); w0?.dress(null, 'casual'); w0?.stage({ overview: true, hour: 9 });
  const cur = saved.current && jobById(saved.current.job) ? saved.current : null;
  diary = loadMine();
  const been = new Set(diary.map((r) => r.job.id));
  const sum = walletSummary(diary);
  const here = JOBS.filter((j) => j.place === P.id), stamped = here.filter((j) => been.has(j.id)).length;
  const left = JOBS.filter((j) => !been.has(j.id)).length;
  const ask = needsWhoCheck();
  view(`
    ${ask ? whoCheck() : ''}
    <p class="eyebrow">직업인의 하루 · CAREER DAY</p>
    <h1>오늘,<br>출근합니다</h1>
    <p class="lead">한 직업인의 하루를 직접 판단하며 살아 봐요. 내 선택에 따라 오후가 달라지고, 퇴근하면 그날 일한 만큼 일당을 받아요.</p>
    ${diary.length ? wallet(sum) : ''}
    ${cur && !ask ? `<button class="btn dark" id="resume">${esc(jobById(cur.job).name)}의 하루 이어 하기</button>` : ''}
    <button class="btn" id="draw">오늘의 직업 뽑기</button>
    <div class="placeTabs" role="group" aria-label="일터 고르기">${Object.values(PLACES).map((p) => `<button class="placeTab ${p.id === P.id ? 'on' : ''}" data-place="${p.id}" aria-pressed="${p.id === P.id}"><span aria-hidden="true">${p.icon}</span> ${esc(p.name)}</button>`).join('')}</div>
    <h3>직업 도장 카드 · ${esc(P.name)} <span class="stampCount">${stamped} / ${here.length}</span></h3>
    <div class="jobs">${here.map((j) => `<button class="job ${been.has(j.id) ? 'been' : ''}" data-id="${j.id}"><b><i style="background:${j.color}"></i>${esc(j.name)}</b><small>${esc(j.title)}<br>${j.shift.start}–${j.shift.end}</small>${been.has(j.id) ? '<span class="stamp" aria-label="다녀옴">출근<br>완료</span>' : ''}</button>`).join('')}</div>
    <p class="fine">${left ? `아직 해 보지 않은 직업이 ${left}개 있어요. 평소라면 고르지 않았을 직업일수록 새로 알게 되는 게 많아요.` : '모든 직업의 하루를 보냈어요! 가장 끌렸던 순간을 다시 떠올려 봐요.'}</p>
    ${diary.length ? '<button class="btn ghost" id="send">선생님께 출근 기록 보내기</button>' : ''}
    <p class="fine">일당은 커리어넷 직업정보의 평균 연봉(중앙값)으로 계산한 세전 금액이에요. 등장인물과 기록은 모두 가상이에요. 진행 기록은 이 기기에만 남아요.</p>
    <button class="link" id="teacher">선생님용 · 출근 기록 모으기</button>
    ${!ask ? '<button class="link" id="newPerson">다른 사람이 쓰던 기기인가요? 새로 출근하기</button>' : ''}
    ${inSite ? '<a class="link" href="../">← 다른 일터 고르기</a>' : ''}`);
  bindWho();
  on('#send', () => openSend(title));
  on('#teacher', openTeacher);
  on('#resume', () => { S = cur; J = jobById(S.job); begin(); });
  on('#draw', () => { const pool = JOBS.filter((j) => !been.has(j.id)); const list = pool.length ? pool : JOBS; startJob(list[Math.floor(Math.random() * list.length)]); });
  on('.job', (b) => startJob(jobById(b.dataset.id)));
  on('.placeTab', (b) => { if (b.dataset.place === focusPlace) return; focusPlace = b.dataset.place; saved.place = focusPlace; store.set(saved); title(); });
}

// 일터 색: 큰 버튼과 작은 머리글에만 쓴다 (shared/DESIGN.md §1). 바탕은 칠하지 않는다.
function paintPlace(p) {
  const r = document.documentElement.style;
  r.setProperty('--coral', p.color); r.setProperty('--coral-d', p.colorD); r.setProperty('--place', p.color); r.setProperty('--place-d', p.colorD);
}

// 지갑: 다녀온 직업과 일한 시간을 앞에, 일당 합계는 작게 (금액으로 직업을 줄 세우지 않게)
function wallet(sum) {
  const h = Math.floor(sum.minutes / 60), m = sum.minutes % 60;
  return `<div class="bank"><div><b>🔖 ${sum.jobs.length}곳</b><small>다녀온 직업</small></div><div><b>⏱ ${h}시간${m ? ` ${m}분` : ''}</b><small>${sum.days}번 출근해 일한 시간</small></div><div class="coin"><span>🪙 ${manwon(sum.total)}</span><small>받은 일당 (세전)</small></div></div>`;
}

// ── 기기를 함께 쓸 때: 누구의 기록인지 묻기 (shared/workday.js 의 세션) ──
function whoCheck(step = 1) {
  if (step === 2) return `<div class="who"><b class="jua">새로 출근하는 사람이에요</b>
    <p>앞사람의 출근 기록은 어떻게 할까요?</p>
    <button class="btn" id="whoHide">앞사람 기록은 남겨 두고 숨기기</button>
    <button class="btn ghost" id="whoWipe">이 기기의 출근 기록 모두 지우기</button>
    <p class="fine">지우면 되돌릴 수 없어요. 선생님께 아직 보내지 않은 기록도 함께 사라져요.</p>
    <button class="link" id="whoBack">← 돌아가기</button></div>`;
  const n = loadMine().length;
  return `<div class="who"><b class="jua">이 기기에 출근 기록 ${n}개가 있어요</b>
    <p>누구의 기록인가요? 학교 기기를 여럿이 함께 쓰면 앞사람 기록이 남아 있을 수 있어요.</p>
    <div class="twin"><button class="btn" id="whoMine">내 기록이에요</button><button class="btn ghost" id="whoNew">새로 출근하는 사람이에요</button></div></div>`;
}
function bindWho() {
  const fresh = (wipe) => { startNewSession({ wipe }); saved.current = null; store.set(saved); diary = loadMine(); sfx('pop'); title(); };
  on('#whoMine', () => { keepSession(); title(); });
  on('#whoNew', () => { panel.querySelector('.who').outerHTML = whoCheck(2); bindWho(); });
  on('#newPerson', () => { const v = panel.querySelector('.view'); v.insertAdjacentHTML('afterbegin', whoCheck(2)); v.querySelector('#newPerson')?.remove(); bindWho(); panel.scrollTop = 0; });
  on('#whoHide', () => fresh(false));
  on('#whoWipe', () => { if (confirm('이 기기의 출근 기록을 모두 지울까요? 되돌릴 수 없어요.')) fresh(true); });
  on('#whoBack', title);
}

// ── 교사 기록 모으기 (src/collect.js) ──
function openSend(back) { sendView({ view, $, esc, records: diary, back }); }
function openTeacher() {
  $('#app').classList.add('teacher'); hud.hidden = true;
  teacherView({ view, $, esc, back: () => { $('#app').classList.remove('teacher'); title(); } });
}

function startJob(job) { J = job; S = newDay(job); shown = {}; begin(); }
function begin() {
  document.documentElement.style.setProperty('--role', J.color);
  focusPlace = J.place; paintPlace(PLACES[J.place]);
  ensureWorld(J.place); $('#gauges').innerHTML = ''; shown = {};
  if (S.closed) return S.slipSeen ? reflect() : slip();
  scene();
}

// ── 장면 ──
function scene() {
  const sc = sceneOf(S, J);
  const notes = enter(S, J); if (notes.length) S.notes = notes; else if (S.notesFor !== S.i) S.notes = [];
  S.notesFor = S.i; save();
  const lockerDone = S.i > idxOf((x) => x.place === 'locker' && x.kind === 'tasks');
  const setDress = PLACES[J.place].sets[sc.place]?.dress;
  drawHud(); // 위쪽 띠를 먼저 그려 둔다. 3D 무대를 띠 아래 칸에 맞추기 때문이다
  if (world) { world.dress(setDress ? { ...J.look, ...setDress } : J.look, lockerDone ? 'work' : 'casual'); world.stage({ place: sc.place, hour: clockOf(S, J, sc) / 60, overview: false }); world.crowd(waiting()); }
  drawHud();
  const head = `<p class="eyebrow">${toHHMM(clockOf(S, J, sc))} <span>· ${S.i + 1} / ${J.scenes.length}</span></p><h2>${esc(sc.title)}</h2>`;
  const ripple = (S.notes || []).map((n) => `<div class="ripple"><b>앞선 선택이 이어져요</b>${esc(n.text)}${chips(n.d)}</div>`).join('');
  const body = `${ripple}<p class="lead">${esc(sc.body)}</p>`;
  unmount?.(); unmount = null;
  $('#app').classList.toggle('handsOn', sc.kind === 'hands' && !sc.closeup);
  $('#app').classList.toggle('closeOn', sc.kind === 'hands' && !!sc.closeup && !!world);
  world?.resize(); // 3D 칸의 크기를 먼저 정한 뒤 장면을 그린다 (작게 그렸다가 커지지 않게)
  ({ reveal, tasks, records, choice, order, pick, hands, thanks, leave: leaving })[sc.kind](sc, head, body);
}
const goNext = () => { next(S, J); save(); scene(); };

function reveal(sc, head) {
  const w = wageOf(J), { hourly } = hourlyOf(w.wage);
  view(`
    <div class="badge"><p class="eyebrow">${esc(PLACES[J.place].name)} · 오늘의 명찰</p><h2>${esc(J.name)}</h2><span class="tag">${esc(J.title)}</span>
      <p class="lead" style="margin-bottom:0">${esc(J.intro)}</p></div>
    <div class="bubble"><b class="jua">이 직업은 이런 일을 해요</b>
      <ul class="works">${(J.works || w.works).slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="fine">${J.works ? esc(J.careernetNote || '') : `자료: 커리어넷 직업정보 · ${esc(w.name)}`}</p></div>
    <div class="bubble"><b class="jua">위쪽 세 가지 눈금</b>
      ${GAUGES.map((g) => `<p>${g.icon} <b class="jua">${g.name}</b> · ${g.long}</p>`).join('')}
      <p class="fine">내 판단에 따라 오르내려요. 일이 밀리면 시계 옆에 '밀림'이 생기고, 기다리는 사람이 늘어요.</p></div>
    <div class="bubble"><b class="jua">오늘의 근무</b>
      <p>${J.shift.start}–${J.shift.end} (쉬는 시간 ${J.shift.breakMin}분) · 하루 ${shiftMin(J) / 60}시간</p>
      <p>시급 약 <b class="jua">${won(hourly)}</b> · 오늘 8시간 일하면 <b class="jua">${won(hourly * 8)}</b></p>
      <p class="fine">세금과 보험료를 떼기 전 금액이에요. 늦게까지 남아 일하면 수당이 붙어요.</p></div>
    <button class="btn" id="go">명찰 받고 출근하기</button>`);
  on('#go', () => { S.started = Date.now(); goNext(); });
}

function tasks(sc, head, body) {
  const done = new Set();
  view(`${head}${body}${sc.tasks.map((t, i) => `<button class="choice" data-i="${i}"><span class="n">${i + 1}</span><span>${esc(t.label)}</span></button><p class="why" id="r${i}" hidden>${esc(t.result)}</p>`).join('')}
    ${sc.fact ? `<div class="fact"><b>알아 두기</b>${esc(sc.fact)}</div>` : ''}<button class="btn" id="nx" disabled>다음 장면으로</button>`);
  on('.choice', (b) => {
    const i = +b.dataset.i; if (done.has(i)) return; done.add(i);
    b.classList.add('done'); b.querySelector('.n').textContent = '✓'; $(`#r${i}`).hidden = false;
    const t = sc.tasks[i]; if (world) { if (t.act === 'dress') world.dress(J.look, 'work'); world.action(t.act); }
    sfx('pop');
    if (done.size === sc.tasks.length) { const r = finishTasks(S, J); react(r.d); $('#nx').disabled = false; }
  });
  on('#nx', goNext);
}

function records(sc, head, body) {
  const open = new Set();
  view(`${head}${body}${sc.records.map(([k, v], i) => `<button class="record closed" data-i="${i}"><b>${esc(k)}</b><span>${esc(v)}</span></button>`).join('')}
    <p class="fine">카드를 눌러 하나씩 펼쳐 보세요.</p><button class="btn" id="nx" disabled>다음 장면으로</button>`);
  on('.record', (b) => {
    open.add(b.dataset.i); b.classList.replace('closed', 'open'); world?.action('inspect');
    if (open.size === sc.records.length) { finishTasks(S, J); drawHud(); $('#nx').disabled = false; }
  });
  on('#nx', goNext);
}

function choice(sc, head, body) {
  const opts = optionsOf(S, sc);
  view(`${head}${body}<div class="speech"><small>${esc(sc.speaker)}</small>${esc(sc.speech)}</div>
    <div id="opts">${opts.map((o, n) => `<button class="choice" data-i="${o.idx}"><span class="n">${n + 1}</span><span>${esc(o.label)}</span></button>`).join('')}</div>
    <div id="out"></div>`);
  on('.choice', (b) => {
    const r = choose(S, J, +b.dataset.i);
    panel.querySelectorAll('.choice').forEach((x) => { x.disabled = true; if (x !== b) x.style.display = 'none'; });
    b.classList.add('on'); world?.action(sc.isBreak ? 'rest' : 'talk');
    $('#out').innerHTML = `<div class="reply">${esc(r.reply)}</div>${chips(r.d)}${r.fact ? `<div class="fact"><b>알아 두기</b>${esc(r.fact)}</div>` : ''}<button class="btn" id="nx">다음 장면으로</button>`;
    react(r.d); save();
    $('#nx').addEventListener('click', goNext); $('#nx').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

// 순서 맞추기: 정답 순서와 다르게 섞어 보여 준다
function order(sc, head, body) {
  const n = sc.steps.length, shuffled = sc.steps.map((_, i) => i);
  for (let k = n - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [shuffled[k], shuffled[j]] = [shuffled[j], shuffled[k]]; }
  if (shuffled.every((v, i) => v === i)) shuffled.reverse();
  let pos = 0, mistakes = 0;
  view(`${head}${body}<p class="fine">먼저 할 일부터 차례로 눌러 보세요.</p>
    ${shuffled.map((i) => `<button class="choice" data-i="${i}"><span class="n">?</span><span>${esc(sc.steps[i])}</span></button>`).join('')}<div id="out"></div>`);
  on('.choice', (b) => {
    const i = +b.dataset.i; if (b.classList.contains('done')) return;
    if (i !== pos) { mistakes++; b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); sfx('bad'); return; }
    pos++; b.classList.add('done'); b.querySelector('.n').textContent = pos; world?.action('work'); sfx('pop');
    if (pos === n) {
      const r = finishOrder(S, J, mistakes); react(r.d); save();
      $('#out').innerHTML = `<div class="reply">${mistakes ? `순서를 ${mistakes}번 다시 생각했어요. 그만큼 시간이 조금 더 들었어요.` : '한 번에 맞췄어요!'} ${esc(sc.why)}</div>${chips(r.d)}<button class="btn" id="nx">다음 장면으로</button>`;
      $('#nx').addEventListener('click', goNext); $('#nx').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

// 손으로 하는 장면: 놀이(src/hands/)를 붙이고, 끝나면 등급에 따른 결과를 보여 준다.
// 마친 결과는 S.handsDone 에 남겨서, 새로 고쳐도 다시 하거나 두 번 반영되지 않게 한다.
// 실기 검사에서만 쓰는 손잡이. 주소 끝 #test 또는 검사 도구가 넣어 둔 표시(cd-test)가 있을 때만 연다.
let testing = location.hash === '#test'; try { testing ||= !!sessionStorage.getItem('cd-test'); } catch { /* 저장이 막힌 기기 */ }
if (testing) window.__cd = { world: () => world };
let unmount = null; // 지금 붙어 있는 손 놀이를 떼어 내는 함수 (3D 가까이 보기를 끝낸다)
function hands(sc, head, body) {
  // 손으로 하는 장면에서는 3D와 할 일이 먼저 보이게, 장면 설명은 "상황 다시 보기"로 접어 둔다 (shared/DESIGN.md §2-1)
  const wide = typeof matchMedia === 'function' && matchMedia('(min-aspect-ratio: 11/10)').matches; // PC에서는 자리가 넉넉해 펼쳐 둔다
  const again = `<details class="again"${wide ? ' open' : ''}><summary>상황 다시 보기</summary><p class="lead">${esc(sc.body)}</p></details>`;
  const ripples = (S.notes || []).map((n) => `<div class="ripple"><b>앞선 선택이 이어져요</b>${esc(n.text)}${chips(n.d)}</div>`).join('');
  view(`${head}${ripples}${again}<div class="hands" id="hands"></div><div id="out"></div>`);
  const show = (r) => {
    $('#out').innerHTML = `<div class="reply">${esc(r.text)}</div>${chips(r.d)}${r.fact ? `<div class="fact"><b>알아 두기</b>${esc(r.fact)}</div>` : ''}<button class="btn" id="nx">다음 장면으로</button>`;
    $('#nx').addEventListener('click', goNext);
    setTimeout(() => $('#nx')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 250);
  };
  const before = S.handsDone?.[S.i];
  if (before) { $('#app').classList.remove('closeOn'); $('#hands').innerHTML = `<div class="handsDone">✓ ${esc(sc.grades[before.grade]?.moment || sc.moment)}</div>`; show(before); return; }
  // 폰에서는 안내를 읽을 틈을 준 뒤, 손으로 하는 곳이 화면 위쪽에 오게 내려 준다
  setTimeout(() => { const h = $('#hands'); if (h && h.getBoundingClientRect().bottom > window.innerHeight + 24) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 1600);
  unmount = HANDS[sc.game]($('#hands'), sc, {
    sfx, act: (k) => world?.action(k), world,
    done: (grade, detail) => {
      const r = finishHands(S, J, grade, detail);
      S.handsDone = { ...S.handsDone, [S.i]: { grade, text: r.text, d: r.d, fact: r.fact } };
      save(); setTimeout(() => { react(r.d); show(r); }, 700);
    },
  });
}

function pick(sc, head, body) {
  const sel = new Set();
  view(`${head}${body}${sc.items.map((it, i) => `<button class="choice" data-i="${i}"><span class="n">${i + 1}</span><span>${esc(it.label)}</span></button><p class="why" id="w${i}" hidden></p>`).join('')}
    <button class="btn" id="ok" disabled>${sc.need}개 골라 주세요</button><div id="out"></div>`);
  const okBtn = $('#ok');
  on('.choice', (b) => {
    if (okBtn.dataset.done) return; const i = +b.dataset.i;
    if (sel.has(i)) { sel.delete(i); b.classList.remove('on'); } else if (sel.size < sc.need) { sel.add(i); b.classList.add('on'); }
    okBtn.disabled = sel.size !== sc.need; okBtn.textContent = sel.size === sc.need ? '이대로 적기' : `${sc.need}개 골라 주세요 (${sel.size}/${sc.need})`;
  });
  okBtn.addEventListener('click', () => {
    okBtn.dataset.done = 1; okBtn.style.display = 'none'; world?.action('write');
    const r = finishPick(S, J, [...sel]);
    sc.items.forEach((it, i) => {
      const b = panel.querySelector(`.choice[data-i="${i}"]`), w = $(`#w${i}`); b.disabled = true;
      if (it.ok) { b.classList.add('done'); b.querySelector('.n').textContent = '✓'; if (!sel.has(i)) { w.hidden = false; w.textContent = '꼭 필요한 내용이었어요.'; } }
      else if (sel.has(i)) { b.classList.add('bad'); b.querySelector('.n').textContent = '✗'; w.hidden = false; w.textContent = it.why; }
    });
    react(r.d); save();
    $('#out').innerHTML = `<div class="reply">${r.right === sc.need ? '필요한 것만 정확히 골랐어요.' : `${r.right}개를 맞게 골랐어요.`} 사실과 짐작을 나누고, 필요한 사람에게 필요한 만큼만 전하는 것도 일의 실력이에요.</div>${chips(r.d)}<button class="btn" id="nx">다음 장면으로</button>`;
    $('#nx').addEventListener('click', goNext); $('#nx').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

function thanks(sc, head, body) {
  if (!S.thanks) { S.thanks = thanksLine(S, J); save(); react(S.thanks.d); }
  view(`${head}${body}<div class="speech"><small>${esc(sc.speaker)}</small>${esc(S.thanks.text)}</div>${chips(S.thanks.d)}<button class="btn" id="nx">다음 장면으로</button>`);
  on('#nx', goNext);
}

function leaving(sc, head, body) {
  const late = S.delay;
  if (late > 0) {
    view(`${head}${body}<div class="bubble">오늘 일이 계획보다 <b class="jua">${late}분</b> 밀렸어요. 아직 마치지 못한 기록과 일이 남아 있어요.</div>
      <button class="choice" id="stay"><span class="n">1</span><span>남아서 마무리하고 퇴근한다<br><small class="fine">연장 근무 ${late}분 · 시급의 1.5배를 받아요 · 에너지가 줄어요</small></span></button>
      <button class="choice" id="go"><span class="n">2</span><span>확인한 것만 다음 근무자에게 넘기고 정시에 퇴근한다<br><small class="fine">인계가 정확했다면 동료가 이어받기 쉬워요</small></span></button>`);
  } else {
    view(`${head}${body}<div class="bubble">오늘 일은 제시간에 끝났어요. 남은 기록을 다음 근무자에게 넘겨요.</div><button class="btn" id="go">사복으로 갈아입고 퇴근하기</button>`);
  }
  const done = (stay) => { const r = leave(S, J, stay); S.closed = true; world?.dress(J.look, 'casual'); react(r.d); save(); setTimeout(slip, 500); };
  on('#stay', () => done(true)); on('#go', () => done(false));
}

// ── 일당 명세서 ──
function slip() {
  const w = wageOf(J), p = payslip(S, J, w.wage);
  if (world) { world.stage({ place: 'outside', hour: 18 }); world.crowd(0); world.burst('coin', 6); }
  drawHud(); sfx('coin');
  view(`
    <p class="eyebrow">퇴근 · ${toHHMM(toMin(J.shift.end) + (S.stayed ? S.delay : 0))}</p>
    <h2>오늘의 일당 명세서</h2>
    <p class="payBig">🪙 ${won(p.total)}<small>세금·보험료 떼기 전</small></p>
    <p class="payNote">${esc(PAY_NOTE)}</p>
    <div class="bubble"><table class="slip">
      <tr><td>기본급<small>시급 ${won(p.hourly)} × ${Math.min(p.worked, p.shift) / 60}시간</small></td><td>${won(p.base)}</td></tr>
      ${p.overMin ? `<tr><td>연장 근무 수당<small>시급 × 1.5 × ${p.overMin}분${S.breakWorked ? ` (쉬는 시간에 일한 ${S.breakWorked}분 포함)` : ''}</small></td><td class="up">+${won(p.overtime)}</td></tr>` : ''}
      <tr class="sum"><td>오늘 번 돈 <small>세금·보험료 떼기 전</small></td><td>${won(p.total)}</td></tr>
    </table></div>
    <div class="fact"><b>이 일당은 어떻게 나왔을까?</b>
      커리어넷에 실린 ${esc(w.basis || w.name)}의 평균 연봉(중앙값) <b>${manwon(w.wage * 10000)}</b>을 한 달 209시간으로 나눠 시급을 냈어요.
      ${p.floored ? `이렇게 계산하면 시급이 ${won(p.raw)}인데, ${MIN_WAGE.year}년 최저 시급 ${won(MIN_WAGE.hourly)}보다 낮아요. 최저임금보다 적게 주는 것은 법으로 막혀 있어서, 오늘 일당은 최저 시급으로 계산했어요. 자료가 조사된 뒤로 최저임금이 올랐기 때문이에요.`
        : `${MIN_WAGE.year}년 최저 시급 ${won(MIN_WAGE.hourly)}의 ${(p.hourly / MIN_WAGE.hourly).toFixed(1)}배예요.`}
      ${p.floored ? '' : '처음 일을 시작하면 이보다 적고, '}경력과 일터에 따라 달라져요.</div>
    <p class="fine">자료: 커리어넷 직업정보(${esc(w.from || '출처 표기 없음')}${w.year ? `, ${w.year}년 기준` : ''}). ${esc(J.careernetNote || '')} 직업마다 조사한 사람 수가 적어서, 직업끼리 순위를 매기는 데 쓰면 안 돼요.</p>
    <button class="btn" id="nx">퇴근길, 오늘을 돌아보기</button>`);
  on('#nx', () => { S.slipSeen = true; save(); reflect(); });
}

// ── 퇴근길 돌아보기 ──
function reflect() {
  const m = mood(S), p = payslip(S, J, annual());
  const moments = S.log.filter((l) => l.type);
  let like = null, hard = null;
  const paint = () => {
    const box = $('#mom'); if (!box) return;
    box.innerHTML = moments.map((l, k) => `<button class="moment ${k === like ? 'like' : k === hard ? 'hard' : ''}" data-k="${k}">${k === like ? '💛 ' : k === hard ? '🪨 ' : ''}${esc(l.label)}</button>`).join('');
    box.querySelectorAll('.moment').forEach((b) => b.addEventListener('click', () => {
      const k = +b.dataset.k;
      if (like === null || (hard !== null && k !== hard)) { like = k === hard ? like : k; if (k === hard) hard = null; }
      else if (k === like) like = null; else hard = k;
      paint();
    }));
    $('#ask').textContent = like === null ? '먼저, 오늘 가장 끌렸던 순간을 눌러 보세요. 💛' : hard === null ? '이번엔 가장 버거웠던 순간을 눌러 보세요. 🪨' : '다른 순간을 눌러 바꿀 수도 있어요.';
    const out = $('#meaning');
    if (like !== null && hard !== null) {
      const a = RIASEC[moments[like].type], b = RIASEC[moments[hard].type];
      out.innerHTML = `<div class="fact"><b>내 마음이 가리키는 쪽</b>
        끌린 순간은 <b>${a.what}</b>이었어요. 흥미 유형으로 치면 <b>${a.name}</b> 쪽의 일이에요.<br>
        버거웠던 순간은 <b>${b.what}</b>이었어요(${b.name} 쪽).<br>
        ${moments[like].type === moments[hard].type ? '같은 종류의 일이 끌리기도, 버겁기도 했네요. 어떤 조건에서 달랐는지 떠올려 봐요.' : '이 직업의 하루에는 둘 다 들어 있어요. 끌림이 버거움보다 클지 생각해 봐요.'}
        <span class="fine" style="display:block">순간 하나로 나를 정할 수는 없어요. 여러 직업의 하루를 보내 보고, 흥미검사 결과와도 견주어 보세요.</span></div>
        <button class="btn" id="keep">출근 기록에 남기기</button>`;
      $('#keep').onclick = () => {
        const w = wageOf(J);
        const rec = makeRecord({
          app: 'career-day', place: J.place, job: { id: J.id, name: J.name, careernet: J.careernet },
          annual: w.wage, wageYear: w.year, wageBasis: w.basis || w.name,
          shift: J.shift, workedMin: p.worked, shiftMin: p.shift,
          ending: { name: m.name, icon: m.icon },
          like: { label: moments[like].label, type: moments[like].type }, hard: { label: moments[hard].label, type: moments[hard].type },
        });
        const errs = checkRecord(rec); if (errs.length) console.warn('출근 기록 약속 어긋남', errs);
        const res = saveRecordSafe(rec); diary = loadMine(); lastSaveFailed = !res.ok;
        saved.current = null; store.set(saved); sfx('fanfare'); world?.burst('star', 8); done();
      };
    } else out.innerHTML = '';
  };
  view(`
    <div class="badge"><div class="big">${m.icon}</div><p class="eyebrow">${esc(J.name)}의 하루 · 퇴근길의 나</p><h2>${esc(m.name)}</h2><p>${esc(m.line)}</p>
      ${m.notes.length ? `<p class="fine">${m.notes.map(esc).join(' ')}</p>` : ''}</div>
    <div class="bubble"><div class="bars">${GAUGES.map((g) => `<div class="bar"><span>${g.icon} ${g.name}</span><i><u style="width:${S.g[g.k]}%;background:${g.color}"></u></i><b>${S.g[g.k]}</b></div>`).join('')}</div>
      <p class="fine">🪙 오늘 번 돈 ${won(p.total)} · ${S.stayed ? `${S.delay}분 더 남아 일했어요.` : S.delay ? `${S.delay}분어치 일을 다음 근무자에게 넘겼어요.` : '제시간에 마쳤어요.'}</p></div>
    <div class="bubble"><b class="jua">오늘 내가 고른 길</b><ol class="path">${S.log.filter((l) => l.pick).map((l) => `<li>${esc(l.title)} <span>→ ${esc(l.pick)}</span></li>`).join('')}</ol>
      <p class="fine">다른 보기를 골랐다면 오후가 어떻게 달라졌을까요? 같은 직업으로 다시 출근해서 확인해 볼 수 있어요.</p></div>
    <h3 class="jua" id="ask"></h3><div class="moments" id="mom"></div><div id="meaning"></div>`);
  paint();
}

let lastSaveFailed = false;
function done() {
  view(`<div class="badge"><div class="big">📒</div><h2>${lastSaveFailed ? '이 기기에 저장하지 못했어요' : '출근 기록에 남겼어요'}</h2>${lastSaveFailed ? '<p class="fine">저장 공간이 막혀 있거나 개인 정보 보호 모드일 수 있어요. 일당과 돌아보기는 화면에 남아 있어요.</p>' : ''}<p>${esc(J.name)}의 하루 · 🪙 ${won(payslip(S, J, annual()).total)}</p></div>
    <div class="bubble"><b class="jua">지금까지의 출근 기록</b><ol class="path">${diary.map((r) => `<li>${esc(r.job.name)} <span>· ${esc(r.ending.name)} · ${won(r.pay.total)} · 💛 ${esc(r.like.label)}</span></li>`).join('')}</ol></div>
    <button class="btn" id="again">같은 직업으로 다른 하루 보내기</button><button class="btn ghost" id="home">다른 직업 고르러 가기</button><button class="btn ghost" id="send">선생님께 출근 기록 보내기</button>${inSite ? '<a class="link" href="../">← 다른 일터 고르기</a>' : ''}`);
  on('#again', () => startJob(J)); on('#home', title); on('#send', () => openSend(done));
}

// ── 버튼들 ──
const zb = $('#zoomBtn');
zb.addEventListener('click', () => { const big = $('#app').classList.toggle('big'); zb.textContent = big ? '⤡' : '⤢'; zb.setAttribute('aria-label', big ? '일터 작게 보기' : '일터 크게 보기'); });
const sb = $('#soundBtn');
const paintSound = () => { sb.textContent = soundOn() ? '♪' : '×'; sb.setAttribute('aria-label', soundOn() ? '소리 끄기' : '소리 켜기'); sb.classList.toggle('off', !soundOn()); };
sb.addEventListener('click', () => { toggleSound(); paintSound(); startMusic(); });
paintSound();
panel.addEventListener('click', (e) => { if (e.target.closest('button')) { startMusic(); sfx('tap'); } });

// 주소 끝으로 바로 들어오기: #teacher 는 교사 기록 모으기, #send 는 선생님께 보내기, #fire-station 같은 일터 이름은 그 일터의 첫 화면 (사이트 첫 화면의 단추가 쓴다)
title();
if (location.hash === '#teacher') openTeacher();
else if (location.hash === '#send') openSend(title);
