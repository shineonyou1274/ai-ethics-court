// 화면과 흐름: 딜레마 카드 → 결과 → 한 달 장사 → 손익표 → (가게 키우기) → 다음 달 … → 결말
import './style.css';
import { createShop } from './shop.js';
import { sfx, startMusic, toggleSound, soundOn } from './audio.js';
import { newGame, cardFor, choose, runMonth, actions, act, ending, fmt, MONTHS } from './engine.js';

const $ = (q) => document.querySelector(q);
const panel = $('#panel'), hud = $('#hud');
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SAVE = 'teen-startup-chicken-v1';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch { return null; } },
  set(s) { try { localStorage.setItem(SAVE, JSON.stringify(s)); } catch { /* 저장이 막힌 기기에서도 게임은 돌아간다 */ } },
  clear() { try { localStorage.removeItem(SAVE); } catch { /* 위와 같다 */ } },
};

const shop = createShop($('#gl'));
let S = null;

const STATS = [
  ['cash', '💰', '통장', null], ['trust', '⭐', '손님 신뢰', '#ffc23d'], ['team', '👥', '팀 행복', '#6fc7a8'], ['impact', '💖', '동네 나눔', '#ff8fb0'],
];
let shown = {}, chipMonth = 0;
function drawHud() {
  hud.hidden = false;
  $('#monthChip').textContent = `${Math.min(MONTHS, chipMonth || S.month)}개월 차 / ${MONTHS}`;
  const box = $('#stats');
  if (!box.children.length) {
    box.innerHTML = STATS.map(([k, ic, name, col]) => `<div class="stat" data-k="${k}"><small>${ic} ${name}</small><b></b>${col ? `<i><u style="background:${col}"></u></i>` : ''}</div>`).join('');
  }
  for (const [k] of STATS) {
    const el = box.querySelector(`[data-k="${k}"]`), v = S[k];
    el.querySelector('b').textContent = k === 'cash' ? fmt(v) : v;
    const bar = el.querySelector('u'); if (bar) bar.style.width = v + '%';
    if (shown[k] !== undefined && shown[k] !== v) {
      const d = v - shown[k], f = document.createElement('span');
      f.className = 'float ' + (d > 0 ? 'up' : 'down'); f.textContent = (d > 0 ? '+' : '−') + Math.abs(d).toLocaleString('ko-KR');
      el.append(f); setTimeout(() => f.remove(), 1700);
    }
    shown[k] = v;
  }
}
function sync() { shop.update(S); drawHud(); }
function view(html) {
  panel.innerHTML = `<div class="view">${html}</div>`; panel.scrollTop = 0;
  const h = panel.querySelector('h1, h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
}
const on = (q, fn) => panel.querySelectorAll(q).forEach((b) => b.addEventListener('click', () => fn(b)));

// ── 시작 ──
function title() {
  const saved = store.get();
  const can = saved && !saved.over && saved.month > 1;
  view(`
    <p class="eyebrow">틴 스타트업 · 첫 번째 가게</p>
    <h1>오늘부터 내가<br>치킨집 사장님</h1>
    <p class="lead">골목의 작은 가게에서 시작해. 열두 달 동안 달마다 한 번씩 어려운 결정을 내려야 해. 네 선택에 따라 가게 모습이 달라져.</p>
    <label for="nm">가게 이름을 지어 줘</label>
    <input id="nm" type="text" maxlength="10" value="${esc(can ? saved.name : '')}" placeholder="우리 치킨" autocomplete="off">
    <button class="btn" id="go">가게 문 열기</button>
    ${can ? `<button class="btn ghost" id="resume">이어서 하기 (${saved.month}개월 차)</button>` : ''}
    <p class="fine">진행 상황은 이 기기에만 저장되고, 어디로도 보내지 않아.</p>`);
  const nm = $('#nm');
  nm.addEventListener('input', () => shop.setName(nm.value.trim()));
  nm.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#go').click(); });
  on('#go', () => { start(newGame(nm.value.trim())); });
  on('#resume', () => start(saved));
}
function start(state) {
  S = state; shown = {}; shop.setName(S.name); shop.update(S, true); drawHud(); store.set(S); card();
}

// ── 딜레마 카드 ──
function card() {
  chipMonth = 0; drawHud();
  const c = cardFor(S);
  view(`
    <p class="eyebrow">${S.month}개월 차 · 이달의 고민</p>
    <h2>${esc(c.title)}</h2>
    <div class="bubble">${esc(c.text)}</div>
    ${c.choices.map((ch, i) => `<button class="choice" data-i="${i}"><span class="n">${i + 1}</span><span>${esc(ch.label)}</span></button>`).join('')}`);
  on('.choice', (b) => result(choose(S, +b.dataset.i)));
}

const NAMES = { cash: '💰 통장', trust: '⭐ 신뢰', team: '👥 팀 행복', impact: '💖 나눔' };
function result(r) {
  sync();
  const d = r.deltas;
  const sum = d.trust + d.team + d.impact + d.cash / 20;
  setTimeout(() => sfx(r.luck === 'bad' || sum < 0 ? 'bad' : 'good'), 120);
  if (d.cash > 0) shop.burst('coin', 6);
  if (d.trust > 0) shop.burst('star', Math.min(8, 2 + d.trust / 2));
  if (d.team > 0) shop.burst('smile', 4);
  if (d.team < -5) shop.burst('sad', 3);
  if (d.impact > 0) shop.burst('heart', Math.min(10, 3 + d.impact / 3));
  const chips = Object.keys(NAMES).filter((k) => d[k]).map((k) => {
    const v = d[k], t = k === 'cash' ? fmt(Math.abs(v)) : Math.abs(v);
    return `<span class="chip ${v > 0 ? 'up' : 'down'}">${NAMES[k]} ${v > 0 ? '+' : '−'}${t}</span>`;
  }).join('') + r.tags.map((t) => `<span class="chip tag">${esc(t)}</span>`).join('');
  view(`
    <p class="picked">내 선택 · ${esc(r.label)}</p>
    <h2>${r.luck === 'bad' ? '이런…' : '그래서 어떻게 됐냐면'}</h2>
    <div class="bubble">${esc(r.text)}</div>
    <div class="chips">${chips || '<span class="chip tag">당장 바뀐 것은 없어</span>'}</div>
    <div class="concept"><b>💡 오늘의 경제 한 줄</b>${esc(r.concept)}</div>
    <button class="btn" id="sell">이번 달 장사 시작!</button>`);
  on('#sell', selling);
}

function selling() {
  shop.setBusy(true);
  view(`<div class="selling"><h2>${S.month}개월 차 장사 중</h2><div class="dots"><span></span><span></span><span></span></div><p class="lead">치킨이 튀겨지고 있어…</p></div>`);
  const rep = runMonth(S);
  setTimeout(() => { shop.setBusy(false); store.set(S); report(rep); }, 2400);
}

// ── 손익표 ──
function report(r, quiet) {
  chipMonth = r.month; sync();
  if (!quiet) sfx(r.profit >= 0 ? 'coin' : 'loss');
  const grow = S.over ? [] : actions(S);
  view(`
    <p class="eyebrow">${r.month}개월 차 가계부</p>
    <h2>${r.profit >= 0 ? `${fmt(r.profit)} 남았어!` : `${fmt(-r.profit)} 손해 봤어`}</h2>
    <div class="bubble">
      <table class="pl">
        <tr><td>매출 <small>${r.qty.toLocaleString('ko-KR')}마리 × ${r.price.toLocaleString('ko-KR')}원</small></td><td class="up">+${fmt(r.revenue)}</td></tr>
        ${r.rows.filter((x) => x[1]).map(([n, v, sub]) => `<tr><td>${n}${sub ? ` <small>${sub}</small>` : ''}</td><td>−${fmt(v)}</td></tr>`).join('')}
        <tr class="sum"><td>이번 달 이익</td><td class="${r.profit >= 0 ? 'up' : 'down'}">${r.profit >= 0 ? '+' : '−'}${fmt(Math.abs(r.profit))}</td></tr>
      </table>
    </div>
    ${r.loanTaken ? `<div class="concept" style="background:#fff0ee"><b style="color:#d9534f">🏦 통장이 바닥났어</b>은행에서 500만 원을 급하게 빌렸어. 이제 매달 이자 10만 원이 나가. 한 번 더 바닥나면 가게 문을 닫아야 해.</div>` : ''}
    ${r.notes.length ? `<ul class="notes">${r.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
    ${grow.length ? `<h3>가게 키우기 <small>(하고 싶을 때만)</small></h3>` + grow.map((a) => `<button class="grow" data-id="${a.id}" ${a.ok ? '' : 'disabled'}><span class="ic">${a.icon}</span><span><b>${a.label}</b><small>${a.desc}${a.ok ? '' : ' · 돈이 모자라'}</small></span><span class="cost">${a.cost ? fmt(a.cost) : ''}</span></button>`).join('') : ''}
    <button class="btn" id="next" style="margin-top:16px">${S.over === 'bankrupt' ? '가게 문을 닫으며…' : S.over ? '1년 결산 보기' : '다음 달로'}</button>`);
  on('.grow', (b) => { if (act(S, b.dataset.id)) { store.set(S); setTimeout(() => sfx('pop'), 80); report(r, true); } });
  on('#next', () => (S.over ? finale() : card()));
}

// ── 결말 ──
function chart(hist) {
  const W = 520, H = 190, pad = 26, max = Math.max(50, ...hist.map((h) => Math.abs(h.profit)));
  const bw = (W - pad * 2) / MONTHS, mid = H / 2;
  const bars = hist.map((h, i) => {
    const hh = Math.max(2, Math.abs(h.profit) / max * (mid - 26)), x = pad + i * bw + 5, y = h.profit >= 0 ? mid - hh : mid;
    return `<rect x="${x}" y="${y}" width="${bw - 10}" height="${hh}" rx="5" fill="${h.profit >= 0 ? '#6fc7a8' : '#f08a7b'}"><title>${h.month}개월 차: ${fmt(h.profit)}</title></rect>
      <text x="${x + (bw - 10) / 2}" y="${H - 4}" text-anchor="middle" font-size="12" fill="#8a7d94">${h.month}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="달마다 남긴 이익 막대그래프">
    <line x1="${pad}" x2="${W - pad}" y1="${mid}" y2="${mid}" stroke="#d9cbbb" stroke-width="2"/>${bars}
    <text x="${pad}" y="13" font-size="12" fill="#2f9e77">▲ 남은 달</text><text x="${pad}" y="${H - 22}" font-size="12" fill="#d9534f">▼ 손해 본 달</text></svg>`;
}
function radar(skills) {
  const W = 380, H = 330, cx = W / 2, cy = H / 2 + 6, R = 108, n = skills.length;
  const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const poly = (r) => skills.map((_, i) => pt(i, r).map((v) => v.toFixed(1)).join(',')).join(' ');
  const grid = [5, 4, 3, 2, 1].map((k) => `<polygon points="${poly(R * k / 5)}" fill="${k === 5 ? '#fffaf2' : 'none'}" stroke="#eadccb" stroke-width="1.5"/>`).join('');
  const nums = [1, 2, 3, 4, 5].map((k) => `<text x="${cx + 4}" y="${cy - R * k / 5 + 4}" font-size="10" fill="#b3a595">${k}</text>`).join('');
  const spokes = skills.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#eadccb" stroke-width="1.5"/>`; }).join('');
  const shape = skills.map((k, i) => pt(i, R * k.v / 5).map((v) => v.toFixed(1)).join(',')).join(' ');
  const dots = skills.map((k, i) => { const [x, y] = pt(i, R * k.v / 5); return `<circle cx="${x}" cy="${y}" r="5" fill="#ff8f7a" stroke="#fff" stroke-width="2"/>`; }).join('');
  const labels = skills.map((k, i) => { const [x, y] = pt(i, R + 30); return `<text x="${x}" y="${y}" text-anchor="middle" font-size="14" fill="#4b3f57" font-family="Jua, sans-serif">${k.name}<tspan x="${x}" dy="15" font-size="13" fill="#e9735e">${k.v}</tspan></text>`; }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="창업가 역량 도형(5점 만점): ${skills.map((k) => `${k.name} ${k.v}`).join(', ')}">${grid}${spokes}${nums}<polygon points="${shape}" fill="rgba(255,143,122,.35)" stroke="#ff8f7a" stroke-width="3" stroke-linejoin="round"/>${dots}${labels}</svg>`;
}
function finale() {
  const e = ending(S); store.clear(); sync();
  setTimeout(() => sfx('fanfare'), 150);
  shop.burst(S.over === 'bankrupt' ? 'heart' : 'star', 14);
  const sorted = [...e.skills].sort((x, y) => y.v - x.v), hi = sorted[0], lo = sorted[sorted.length - 1];
  const best = S.history.reduce((a, h) => (h.profit > a.profit ? h : a), S.history[0]);
  view(`
    <div class="badge"><div class="big">${e.type.icon}</div><p class="eyebrow">${esc(S.name)} · ${S.history.length}개월의 기록</p><h2>${e.type.name}</h2><p>${e.type.line}</p></div>
    <div class="chips">
      <span class="chip">💰 가게의 값어치 ${fmt(e.net)}</span><span class="chip">⭐ 신뢰 ${S.trust}</span><span class="chip">👥 팀 행복 ${S.team}</span><span class="chip">💖 나눔 ${S.impact}</span>
    </div>
    <div class="bubble"><b class="jua">나의 창업가 역량 도형</b>${radar(e.skills)}
      <p style="font-size:15px"><b class="jua up">가장 빛난 힘 · ${hi.name}</b><br>${hi.tip}</p>
      <p style="font-size:15px;margin-top:6px"><b class="jua" style="color:var(--coral-d)">다음에 길러 볼 힘 · ${lo.name}</b><br>${lo.tip}</p>
      <p style="font-size:13.5px;color:var(--soft);margin-top:8px">5점이 가장 높아. 이 도형은 시험 점수가 아니라 이번 판에서 내가 내린 선택의 흔적이야. 활동지에 옮겨 그려 봐.</p></div>
    <div class="bubble"><b class="jua">달마다 남긴 이익</b>${chart(S.history)}
      <p style="font-size:15px;color:var(--soft)">열두 달 동안 모두 ${fmt(e.total)}을 남겼고, 가장 잘된 달은 ${best.month}개월 차(${fmt(best.profit)})였어.${S.loan ? ' 은행 빚 500만 원이 남아 있어.' : ''}</p></div>
    <div class="concept"><b>🗣 친구들과 이야기해 봐</b>
      <ul class="ask"><li>가장 오래 고민한 선택은 무엇이고, 왜 그렇게 골랐어?</li><li>돈이 가장 많이 남는 선택과 내가 옳다고 생각한 선택이 달랐던 때가 있었어?</li><li>진짜 사장님이 된다면 꼭 지키고 싶은 원칙 한 가지는?</li></ul></div>
    <details class="bubble"><summary class="jua">내가 내린 결정 ${S.picks.length}가지</summary><ol class="log">${S.picks.map((p) => `<li>${esc(p.title)} <span>→ ${esc(p.label)}</span></li>`).join('')}</ol></details>
    <button class="btn" id="again">처음부터 다시 해 보기</button>`);
  on('#again', () => { hud.hidden = true; $('#stats').innerHTML = ''; S = null; shop.update(newGame(''), true); title(); });
}

// ── 소리 ──
const sb = $('#soundBtn');
const paintSound = () => { sb.textContent = soundOn() ? '♪' : '×'; sb.setAttribute('aria-label', soundOn() ? '소리 끄기' : '소리 켜기'); sb.classList.toggle('off', !soundOn()); };
sb.addEventListener('click', () => { toggleSound(); paintSound(); startMusic(); });
paintSound();
panel.addEventListener('click', (e) => { if (e.target.closest('button')) { startMusic(); sfx('tap'); } });

title();
