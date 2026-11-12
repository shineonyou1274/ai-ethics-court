// 흐름 지휘: 걷기 → 질문 카드 → 답 저장 → 다음 걸음.
import './style.css';
import { createWorld } from './world.js';
import { build, ACTS, STEP, VALUES, partyAt, orbsAt, scenesOf, answerText, planOf, dotsAt, linksOf, forksOf, constelOf, flightInto, riversOf, tunnelsOf, summitOf, WISHES } from './story.js';
import { drawConstel, constelImage } from './constel.js';
import * as store from './store.js';
import { createMovie } from './movie.js';
import { audio } from './audio.js';

const $ = (id) => document.getElementById(id);
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style') e.style.cssText = v;
    else if (k in e && k !== 'list') e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c);
  return e;
}

const COLORS = ['#ff9f8a', '#ffc857', '#8fd3a8', '#7fc8e8', '#9aa8f0', '#c9a4ee', '#f59ac0', '#f4f1ea'];
const HAIRS = ['짧은 머리', '단발', '묶은 머리', '양갈래'];

let S = store.load() || store.fresh();
let beats = build(S);
let idx = 0;
let busy = false;

const world = createWorld($('gl'));
world.cruise(2.4);
world.setInset($('title').querySelector('.title-box').offsetHeight + 130, 0);
world.state.ageOverride = S.now || 16;
world.setLook(S.look);

let toastTimer = 0;
function toast(msg) {
  $('toast').textContent = msg; $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3600);
}
function save() { if (!store.save(S)) toast('이 브라우저는 자동 저장이 막혀 있어. 메뉴에서 파일로 저장해 줘.'); }

// ── 세계를 지금 카드에 맞춘다 ──
function stops() {
  const out = [];
  for (const b of beats) {
    if (b.back) continue;
    const last = out[out.length - 1];
    if (last && last.dist === b.dist) { if (b.final) last.final = true; continue; }
    out.push({ dist: b.dist, age: b.age, label: b.age >= 1 && !b.final && !b.noArch ? b.age + '살' : '', final: !!b.final });
  }
  return out;
}
function stage(i, { instant = false, depart = false } = {}) {
  const b = beats[i];
  world.state.lifespan = S.life || 85;
  world.setTimeline(stops());
  world.setLook(S.look);
  world.setParty(partyAt(S, beats, i), { instant, depart });
  world.setOrbs(orbsAt(S, beats, i));
  lights(i);
  world.state.ageOverride = b.act === 0 ? (S.now || 16) : null;
}

// 갈림길, 길 위의 점, 점을 잇는 빛줄기
function lights(i) {
  const b = beats[i];
  const upto = b.back ? Infinity : b.dist;
  world.setRivers(riversOf(beats));
  world.setTunnels(tunnelsOf(beats));
  world.setSummit(summitOf(beats));
  world.setForks(forksOf(S, beats).map((f) => (f.dist > upto ? { ...f, done: false, dir: 0, chosen: '' } : f)));
  world.setDots(dotsAt(S, beats, b.back ? beats.length : i));
  world.setLinks(linksOf(S, beats).filter((l) => l.toDist <= upto));
}

function hud(b) {
  document.body.dataset.act = b.act;
  document.body.dataset.turning = b.turning ? '1' : '0';
  $('barFill').style.width = Math.round((idx / (beats.length - 1)) * 100) + '%';
  const act = b.act === 0 ? '여는 장' : `${b.act}막 · ${ACTS[b.act]}`;
  $('chip').textContent = b.act === 0 ? act : `${act} · ${b.age}살`;
  audio.setMood(b.age / (S.life || 85));
}

async function go(i, { instant = false } = {}) {
  if (busy) return;
  busy = true;
  idx = i;
  const b = beats[i];
  S.at = b.id; save();
  hideCard();
  constelShow(false);
  $('hud').hidden = false;
  const prev = beats[i - 1];
  const departing = !!(prev && prev.fx === 'depart' && S.a[prev.id] && !S.a[prev.id].skip);
  stage(i, { instant, depart: departing });
  hud(b);
  world.setWeather(b.weather);
  if (b.fx !== 'finale') world.setFinale(false);
  if (instant) world.jump(b.dist);
  else if (b.fx === 'rewind') { world.setCamera('high'); await world.walkTo(b.dist, 5.5); }
  else {
    const gap = Math.abs(b.dist - world.state.dist);
    if (gap > 0.5 && flightInto(S, beats, i)) { world.setCamera('fly'); toast('비행기를 타고 날아가는 중 ✈'); await world.walkTo(b.dist, 6.5, { fly: true }); }
    else if (gap > 0.5) { world.setCamera('walk'); await world.walkTo(b.dist, Math.min(4.6, Math.max(1.4, (gap / STEP) * 4.2))); }
  }
  world.setCamera(b.cam || (b.fork ? 'fork' : 'card'));
  if (b.fx === 'finale') world.setFinale(true);
  constelShow(b.type === 'constel');
  $('hud').hidden = b.type === 'constel';
  busy = false;
  showCard(b);
}

// ── 질문 카드 ──
const sheet = $('sheet'), card = $('card');
const wide = window.matchMedia('(min-width: 900px)');
function reportInset() {
  if (sheet.hidden) { world.setInset(0, 0); return; }
  if (wide.matches) world.setInset(0, card.offsetWidth + 40); else world.setInset(card.offsetHeight + 10, 0);
}
new ResizeObserver(reportInset).observe(card);
wide.addEventListener('change', reportInset);
function hideCard() { sheet.hidden = true; reportInset(); }

function chip(label, pressed, onclick, cls = '') {
  return h('button', { class: 'chip ' + cls, type: 'button', 'aria-pressed': String(!!pressed), onclick }, label);
}

function showCard(b) {
  const a = S.a[b.id] || {};
  const d = { picks: [...(a.picks || [])], custom: a.custom || '', text: a.text || '', prep: a.prep || '' };
  const body = [];
  let valid = () => true;
  let collect = () => ({ ...d });
  let primary;
  const refresh = () => { if (primary) primary.disabled = !valid(); };

  if (b.type === 'name') {
    const inp = h('input', { type: 'text', maxLength: 10, value: S.name, placeholder: '예: 하늘, 달리는 고래', autocomplete: 'off', enterKeyHint: 'done', oninput: refresh });
    const sw = h('div', { class: 'swatches', role: 'group', 'aria-label': '옷 색' });
    const hair = h('div', { class: 'chips', role: 'group', 'aria-label': '머리 모양' });
    const draw = () => {
      sw.replaceChildren(...COLORS.map((c) => h('button', { class: 'swatch', type: 'button', style: `--c:${c}`, 'aria-label': '옷 색 ' + c, 'aria-pressed': String(S.look.color === c), onclick: () => { S.look.color = c; world.setLook(S.look); draw(); } })));
      hair.replaceChildren(...HAIRS.map((n, k) => chip(n, S.look.hair === k, () => { S.look.hair = k; world.setLook(S.look); draw(); })));
    };
    draw();
    world.setCamera('front');
    body.push(h('label', { class: 'field' }, h('span', {}, '이름 또는 별명'), inp), h('div', { class: 'field' }, h('span', {}, '옷 색'), sw), h('div', { class: 'field' }, h('span', {}, '머리 모양'), hair));
    collect = () => ({ text: inp.value.trim() || '나' });
  } else if (b.type === 'age') {
    let v = S.now || 15;
    const out = h('output', {}, String(v));
    const set = (n) => { v = Math.min(80, Math.max(8, n)); out.textContent = v; world.state.ageOverride = v; };
    body.push(h('div', { class: 'stepper' }, h('button', { type: 'button', 'aria-label': '한 살 줄이기', onclick: () => set(v - 1) }, '−'), out, h('small', {}, '살'), h('button', { type: 'button', 'aria-label': '한 살 늘리기', onclick: () => set(v + 1) }, '+')));
    const basis = h('select', { 'aria-label': '나이 기준', onchange: () => { S.ageBasis = basis.value; save(); } },
      ...[['man', '만 나이 · 생일 기준'], ['korean', '세는나이 · 태어나면 1살'], ['unspecified', '기존 기록의 기준 유지']].map(([v2, label]) => h('option', { value: v2, selected: (S.ageBasis || 'unspecified') === v2 }, label)));
    body.push(h('label', { class: 'field' }, h('span', {}, '나이 기준'), basis));
    collect = () => ({ value: v });
  } else if (b.type === 'slider') {
    let v = Math.max(b.min, Math.min(b.max, S.life || b.def));
    const out = h('output', {}, String(v));
    const rng = h('input', { type: 'range', min: b.min, max: b.max, step: 1, value: v, 'aria-label': b.q, oninput: () => { v = +rng.value; out.textContent = v; } });
    body.push(h('div', { class: 'stepper' }, out, h('small', {}, b.unit || '살')), rng);
    collect = () => ({ value: v });
  } else if (b.type === 'title') {
    const inp = h('input', { type: 'text', maxLength: 30, value: S.title || `${S.name}의 인생 드라마`, autocomplete: 'off', enterKeyHint: 'done' });
    body.push(h('label', { class: 'field' }, h('span', {}, '드라마 제목'), inp));
    collect = () => ({ text: inp.value.trim() || `${S.name}의 인생 드라마` });
  } else if (b.type === 'plan') {
    const rows = planOf(S);
    const LABELS = { yes: '계획함', maybe: '미정', no: '안 함' };
    const box = h('div', { class: 'plan' });
    const draw = () => box.replaceChildren(...rows.map((r) => {
      const note = h('small', { class: 'note' }, '');
      const feedback = () => {
        note.textContent = r.on && (!Number.isInteger(r.age) || (r.extra && !r.title.trim()))
          ? (r.extra ? '나이와 제목을' : '나이를') + ' 정하면 장면이 생겨. 지금은 비워 두고 출발해도 돼.'
          : r.on && Number.isInteger(r.age) && r.age <= S.now ? '지나온 나이 · 미래 장면 없음' : '';
      };
      const age = h('input', { type: 'number', min: 1, max: 100, step: 1, value: r.age ?? '', inputMode: 'numeric', 'aria-label': r.label + ' 나이', placeholder: '미정',
        oninput: () => { const v = Number(age.value); r.age = age.value.trim() && Number.isInteger(v) && v >= 1 && v <= 100 ? v : null; feedback(); } });
      const title = r.extra ? h('input', { type: 'text', maxLength: 24, value: r.title, 'aria-label': '이루고 싶은 일', placeholder: '예: 첫 여행, 책 출간', oninput: () => { r.title = r.label = title.value; feedback(); } }) : null;
      feedback();
      const bump = (dv) => { r.age = Number.isInteger(r.age) ? Math.min(100, Math.max(1, r.age + dv)) : Math.min(100, (S.now || 15) + 1); draw(); };
      return h('div', { class: 'plan-row' + (r.status === 'no' ? ' off' : '') },
        h('button', { class: 'tog', type: 'button', 'aria-pressed': r.status === 'yes' ? 'true' : r.status === 'maybe' ? 'mixed' : 'false', 'aria-label': r.label + ' ' + LABELS[r.status] + ' · 누르면 바뀜',
          onclick: () => { r.status = r.status === 'maybe' ? 'yes' : r.status === 'yes' ? 'no' : 'maybe'; r.on = r.status === 'yes'; draw(); } },
          h('i', {}, r.status === 'yes' ? '✓' : r.status === 'maybe' ? '?' : '−'), h('span', {}, r.extra ? (r.fly ? '✈ 하고 싶은 일' : '하고 싶은 일') : r.label, h('small', { style: 'display:block;font-weight:400' }, LABELS[r.status]))),
        h('div', { class: 'mini' },
          h('button', { type: 'button', 'aria-label': r.label + ' 한 살 앞으로', onclick: () => bump(-1) }, '−'), age, h('small', {}, '살'),
          h('button', { type: 'button', 'aria-label': r.label + ' 한 살 뒤로', onclick: () => bump(1) }, '+')),
        title ? h('div', { style: 'flex-basis:100%;display:flex;gap:6px;margin:2px 4px 6px' }, title, h('button', { class: 'link', type: 'button', 'aria-label': r.label + ' 지우기', style: 'flex:none', onclick: () => { rows.splice(rows.indexOf(r), 1); draw(); drawWish(); } }, '지우기')) : null,
        note);
    }));
    draw();
    // 이루고 싶은 일 더하기: 고르면 계획표에 줄이 생긴다
    const wish = h('div', { class: 'chips' });
    const wishInput = h('input', { type: 'text', maxLength: 24, placeholder: '직접 쓰기 (예: 내 가게 열기)', autocomplete: 'off' });
    const addWish = (title, age, fly) => {
      if (rows.filter((r) => r.extra).length >= 8) { toast('여덟 개까지 더할 수 있어.'); return; }
      const id = Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
      rows.push({ k: 'x' + id, id, extra: true, label: title, title, status: 'yes', on: true, age: Math.min(100, Math.max((S.now || 15) + 1, age)), fly: !!fly });
      draw(); drawWish();
    };
    const drawWish = () => wish.replaceChildren(...WISHES.filter(([t]) => !rows.some((r) => r.extra && r.title === t)).map(([t, age, fly]) => chip((fly ? '✈ ' : '+ ') + t, false, () => addWish(t, age, fly), 'starter')));
    drawWish();
    body.push(h('p', { class: 'hint' }, '나이 기준: ' + (S.ageBasis === 'man' ? '만 나이' : S.ageBasis === 'korean' ? '세는나이' : '기존 기록 기준') + ' · 왼쪽 단추를 누르면 계획함 → 안 함 → 미정으로 바뀌어. 계획함이고 나이를 정했을 때만 장면이 생겨.'), box,
      h('div', { class: 'field' }, h('span', {}, '이루고 싶은 일 더하기 · ✈는 비행기를 타고 가는 일'), wish),
      h('div', { style: 'display:flex;gap:6px;margin-top:8px' }, wishInput, h('button', { class: 'chip', type: 'button', style: 'flex:none', onclick: () => { const t = wishInput.value.trim(); if (!t) return; addWish(t, (S.now || 15) + 10, /여행|유학|해외|세계/.test(t)); wishInput.value = ''; } }, '더하기')));
    collect = () => {
      const plan = { ...(S.plan || {}), ...Object.fromEntries(rows.filter((r) => !r.extra).map((r) => [r.k, { on: r.on, status: r.status, age: r.age }])) };
      delete plan.customEvent;
      plan.extras = rows.filter((r) => r.extra).map((r) => ({ id: r.id, title: r.title.trim(), age: r.age, status: r.status, fly: r.fly }));
      return { plan };
    };
  } else if (b.type === 'constel') {
    const ls = linksOf(S, beats);
    body.push(ls.length
      ? h('ul', { class: 'links' }, ls.slice(0, 4).map((l) => h('li', {}, h('b', {}, l.fromLabel), ' → ', (beats.find((x) => x.id === l.to) || {}).title || '')))
      : h('p', { class: 'hint' }, '아직 이은 선은 없어. 대본에서 갈림길 장면을 다시 걸으면 점을 이을 수 있어.'));
  } else if (b.type === 'hub') {
    renderHub();
    return;
  }

  // 갈림길에서는 고르는 대로 길이 휘어 보인다
  const preview = () => { if (b.fork) { S.a[b.id] = { ...d }; world.setForks(forksOf(S, beats)); } };
  if (b.type === 'connect') {
    // 지금까지 남긴 점 가운데 이 길에서 힘이 될 것을 고른다. 고르면 빛줄기가 이어진다.
    const all = dotsAt(S, beats, idx);
    d.links = (a.links || []).filter((id) => all.some((x) => x.id === id));
    const box = h('div', { class: 'chips' });
    const draw = () => box.replaceChildren(...all.map((dt) => {
      const el = h('button', { class: 'chip dot dotpick', type: 'button', 'aria-pressed': String(d.links.includes(dt.id)), onclick: () => {
        if (d.links.includes(dt.id)) d.links = d.links.filter((x) => x !== dt.id);
        else if (d.links.length < 2) d.links.push(dt.id);
        else { toast('두 개까지 이을 수 있어. 하나를 빼고 다시 골라 봐.'); return; }
        S.a[b.id] = { ...d };
        world.setLinks(linksOf(S, beats).filter((l) => l.toDist <= b.dist));
        draw();
      } }, dt.label, dt.kind ? h('small', {}, `${dt.age}살 · ${dt.kind}`) : h('small', {}, `${dt.age}살 · 소중한 것`));
      el.style.setProperty('--c', dt.color);
      return el;
    }));
    draw();
    body.push(all.length ? box : h('p', { class: 'hint' }, '아직 길 위에 남긴 점이 없어. 그래도 괜찮아, 지금 쓰는 답이 첫 점이 될 거야.'));
  }
  if (b.type === 'chips') {
    const box = h('div', { class: 'chips' + (b.id === 'values' ? ' vals' : '') });
    const max = b.max || 1;
    const draw = () => {
      box.replaceChildren(...b.options.map((o) => {
        const col = b.id === 'values' ? (VALUES.find((x) => x[0] === o.k) || [])[1] : null;
        const el = chip(o.label, d.picks.includes(o.k), () => {
          if (d.picks.includes(o.k)) d.picks = d.picks.filter((k) => k !== o.k);
          else if (o.k === 'alone') { d.picks = ['alone']; d.custom = ''; if (custom) custom.value = ''; }
          else if (d.picks.includes('alone')) d.picks = [o.k];
          else if (max === 1) d.picks = [o.k];
          else if (d.picks.length + (b.people && d.custom ? 1 : 0) < max) d.picks.push(o.k);
          else { toast(`${max}개까지 고를 수 있어. 하나를 빼고 다시 골라 봐.`); return; }
          if (max === 1 && custom) { custom.value = ''; d.custom = ''; }
          if (b.fx === 'orbs') world.setOrbs(d.picks.map((v) => (VALUES.find((x) => x[0] === v) || [])[1]));
          draw(); refresh(); preview();
        }, col ? 'dot' : '');
        if (col) el.style.setProperty('--c', col);
        return el;
      }));
    };
    const custom = b.custom ? h('input', { type: 'text', maxLength: 14, value: d.custom, placeholder: b.custom, autocomplete: 'off', oninput: () => { d.custom = custom.value.trim(); if (d.custom && d.picks.includes('alone')) { d.picks = []; draw(); } if (max === 1 && d.custom) { d.picks = []; draw(); } refresh(); } }) : null;
    draw();
    body.push(box);
    if (custom) body.push(h('label', { class: 'field' }, custom));
    const min = b.min != null ? b.min : b.optional ? 0 : 1;
    valid = () => d.picks.length + (d.custom ? 1 : 0) >= min;
  }

  if (b.type === 'text' || b.type === 'connect' || (b.type === 'chips' && b.text)) {
    const limit = b.short ? 60 : 300;
    const count = h('div', { class: 'count' });
    const ta = b.short
      ? h('input', { type: 'text', maxLength: limit, value: d.text, placeholder: b.ph || '', autocomplete: 'off' })
      : h('textarea', { maxLength: limit, rows: 3, placeholder: b.ph || (b.type === 'chips' ? '더 쓰고 싶을 때만. 짧게 적어도 돼.' : '한두 문장이면 충분해.') }, d.text);
    const upd = () => { d.text = ta.value; count.textContent = `${ta.value.length} / ${limit}`; refresh(); };
    ta.addEventListener('input', upd);
    if (b.starters) {
      body.push(h('div', { class: 'chips' }, b.starters.map((s) => chip(s.trim() + (b.short ? '' : ' …'), false, () => { if (!ta.value.trim() || b.short) ta.value = s; ta.focus(); upd(); }, 'starter'))));
    }
    body.push(h('label', { class: 'field' }, b.type === 'chips' ? h('span', {}, b.text) : null, ta), count);
    upd();
  }
  if (b.prep) {
    const p = h('input', { type: 'text', maxLength: 60, value: d.prep, placeholder: '예: 매일 20분씩 해 보기', autocomplete: 'off', oninput: () => { d.prep = p.value; } });
    body.push(h('label', { class: 'field' }, h('span', {}, '🌱 ' + b.prep + ' (선택)'), p));
  }

  primary = h('button', { class: 'primary', type: 'button', onclick: () => submit(b, collect()) }, b.cta || '다음 걸음');
  const act = b.act === 0 ? '여는 장' : `${b.act}막 · ${ACTS[b.act]}`;
  card.className = b.type === 'plan' ? 'tall' : '';
  card.replaceChildren(
    h('div', { class: 'scroll' },
      h('p', { class: 'eyebrow' }, b.act === 0 || b.type === 'say' || b.type === 'constel' ? act : b.fork ? `갈림길 · ${b.age}살` : b.turning ? `새로 난 길 · ${b.age}살` : b.sudden ? `갑작스러운 일 · ${b.age}살` : b.surprise ? `뜻밖의 질문 · ${b.age}살` : `${act} · ${b.age}살`),
      h('h2', {}, b.q),
      b.hint ? h('p', { class: 'hint' }, b.hint) : null,
      body),
    h('div', { class: 'foot' }, primary, h('div', { class: 'foot-row' },
      idx > 0 ? h('button', { class: 'link', type: 'button', onclick: () => go(idx - 1, { instant: true }) }, '‹ 이전') : h('span'),
      b.optional ? h('button', { class: 'link', type: 'button', onclick: () => submit(b, { skip: true }) }, b.skipLabel || '건너뛰기 ›') : null)),
  );
  refresh();
  // 쓰는 도중에도 저장해 둔다. 실수로 닫아도 글이 남는다.
  const draft = () => {
    if (beats[idx] !== b || busy) return;
    const v = collect();
    if (b.type === 'name') S.name = v.text;
    else if (b.type === 'age') S.now = v.value;
    else if (b.type === 'slider') S.life = v.value;
    else if (b.type === 'title') S.title = v.text;
    else if (b.type === 'plan') S.plan = v.plan;
    else if (b.type !== 'say' && b.type !== 'constel') S.a[b.id] = v;
    save();
  };
  card.oninput = draft;
  card.onclick = () => queueMicrotask(draft);
  sheet.hidden = false;
  card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
  reportInset();
}

function submit(b, ans) {
  if (busy) return;
  if (b.type === 'name') { S.name = ans.text; }
  else if (b.type === 'age') { S.now = ans.value; }
  else if (b.type === 'slider') { S.life = ans.value; }
  else if (b.type === 'title') { S.title = ans.text; }
  else if (b.type === 'plan') { S.plan = ans.plan; }
  else if (b.type !== 'say' && b.type !== 'constel') {
    const empty = !ans.skip && !(ans.picks && ans.picks.length) && !(ans.links && ans.links.length) && !ans.custom && !(ans.text && ans.text.trim()) ;
    if (ans.text) ans.text = ans.text.trim();
    if (ans.prep) ans.prep = ans.prep.trim();
    S.a[b.id] = empty ? { skip: true } : ans;
  }
  beats = build(S);
  const i = beats.findIndex((x) => x.id === b.id);
  go(Math.min(beats.length - 1, i + 1));
}

// ── 완성 화면 ──
function renderHub() {
  const cast = partyAt(S, beats, beats.length - 1);
  const everyone = new Map();
  beats.forEach((b, i) => { if (!b.back) for (const p of partyAt(S, beats, i + 1)) if (p.label !== '?') everyone.set(p.id, p.label); });
  void cast;
  const rem = S.a.remember && S.a.remember.text;
  const step = S.a.step && S.a.step.text;
  const row = (t, v) => (v ? [h('dt', {}, t), h('dd', {}, v)] : []);
  card.className = 'tall';
  card.replaceChildren(h('div', { class: 'scroll' },
    h('div', { class: 'poster' },
      h('p', { class: 'eyebrow' }, '드라마 완성'),
      h('h2', {}, S.title || `${S.name}의 인생 드라마`),
      h('p', { class: 'by' }, `주연 ${S.name} · ${S.now}살에 쓰다`),
      h('dl', {},
        ...row('함께 걸은 사람들', [...everyone.values()].join(', ')),
        ...row('내게 소중한 것', ((S.a.values || {}).picks || []).join(' · ')),
        ...row('이어진 점', linksOf(S, beats).map((l) => `${l.fromLabel} → ${(beats.find((x) => x.id === l.to) || {}).title}`).join(' / ')),
        ...row('기억되고 싶은 모습', rem),
        ...row('오늘 찍는 점 하나', step))),
    h('button', { class: 'primary', type: 'button', onclick: () => movie.play() }, '▶ 처음부터 감상하기'),
    h('div', { class: 'grid2' },
      h('button', { class: 'tile', type: 'button', onclick: openConstel }, '내 별자리 보기', h('small', {}, '이어진 점들을 한 장으로')),
      h('button', { class: 'tile', type: 'button', onclick: () => recordOptions() }, '영상으로 저장', h('small', {}, '일반 · 고속 녹화 선택')),
      h('button', { class: 'tile', type: 'button', onclick: openCards }, '장면 카드 저장', h('small', {}, '슬라이드처럼 한 장씩')),
      h('button', { class: 'tile', type: 'button', onclick: openScript }, '대본 보기·고치기', h('small', {}, '언제든 다시 쓸 수 있어')),
      h('button', { class: 'tile', type: 'button', onclick: doPrint }, '인쇄하기', h('small', {}, '종이나 PDF로')))),
    h('div', { class: 'foot foot-row' },
      h('button', { class: 'link', type: 'button', onclick: () => go(idx - 1, { instant: true }) }, '‹ 이전'),
      h('button', { class: 'link', type: 'button', onclick: exportFile }, '파일로 보관 ›')),
  );
  sheet.hidden = false;
  reportInset();
}

// ── 감상·내보내기 ──
const movie = createMovie({
  world, $, toast,
  getData: () => ({ S, beats, scenes: scenesOf(S, beats), constel: constelOf(S, beats) }),
  audio, constelCanvas: $('constel'),
  stage,
  onOpen: () => { $('dlg').open && $('dlg').close(); constelShow(false); sheet.hidden = true; $('hud').hidden = true; reportInset(); },
  onClose: () => { $('hud').hidden = false; busy = false; go(idx, { instant: true }); },
  onVideo: (blob, ext) => {
    let vid;
    const url = URL.createObjectURL(blob);
    const name = `인생드라마_${S.name}.${ext}`;
    const file = new File([blob], name, { type: blob.type });
    const canShare = navigator.canShare && navigator.canShare({ files: [file] });
    dialog('영상이 완성됐어', [
      (vid = h('video', { src: url, controls: true, playsInline: true, onplay: () => audio.previewMute(true), onpause: () => audio.previewMute(false), onended: () => audio.previewMute(false) })),
      h('div', { class: 'chips', style: 'margin-top:10px' }, [1, 1.5, 2].map((r) => h('button', { class: 'chip', type: 'button', onclick: () => { vid.playbackRate = r; vid.play(); } }, r + '배속'))),
      h('button', { class: 'primary', type: 'button', style: 'margin-top:12px', onclick: () => store.download(name, blob) }, '내 기기에 저장'),
      canShare ? h('button', { class: 'ghost', type: 'button', style: 'border-color:var(--line)', onclick: () => navigator.share({ files: [file], title: S.title }).catch(() => {}) }, '공유하기') : null,
      h('p', { style: 'font-size:14px;color:var(--soft);margin-top:12px' }, ext === 'webm' ? '이 브라우저는 MP4 녹화를 지원하지 않아 WebM 형식으로 저장돼. 크롬과 최신 갤러리에서는 열리지만 아이폰에서는 안 열릴 수 있어. 최신 크롬이나 사파리에서 다시 녹화하면 MP4로 저장돼.' : 'MP4 형식이라 대부분의 기기와 앱에서 바로 열려. 저장한 뒤에도 재생 앱에서 배속을 바꿀 수 있어.'),
    ]);
    $('dlg').addEventListener('close', () => { vid.pause(); audio.previewMute(false); URL.revokeObjectURL(url); }, { once: true });
  },
});

function recordOptions() {
  dialog('영상 저장 속도', [
    h('p', {}, '일반 녹화는 영상 길이만큼 기다려야 해. 고속은 기다림도 줄지만 저장한 영상의 움직임과 글자도 빨라져.'),
    ...[1, 2, 4].map((speed) => h('button', { class: speed === 1 ? 'primary' : 'ghost', type: 'button', style: 'border-color:var(--line);margin-top:10px', onclick: () => movie.play({ record: true, speed }) },
      speed === 1 ? '일반 녹화 · 결과 1배속' : speed + '배 고속 녹화 · 결과도 ' + speed + '배속')),
    h('button', { class: 'ghost', type: 'button', style: 'border-color:var(--line);margin-top:10px', onclick: () => movie.play({ record: true, speed: 1, test: true }) }, '8초 테스트 영상 만들기'),
    h('p', { style: 'font-size:14px;margin-top:12px' }, '배경음은 말소리가 없는 생성 음악이야. 메뉴에서 켜거나 끌 수 있어. 녹화 중 다른 탭으로 이동하지 말아 줘. MP4 지원 브라우저에서는 MP4, 그 외는 WebM으로 저장돼. 완성본 미리보기의 배속 버튼은 파일 자체를 바꾸지 않아.'),
  ]);
}

// ── 별자리 ──
let constelRaf = 0;
function constelShow(on) {
  const c = $('constel');
  cancelAnimationFrame(constelRaf);
  c.hidden = !on;
  if (!on) return;
  const data = constelOf(S, beats);
  const t0 = performance.now();
  const tick = (now) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(c.clientWidth * dpr), H = Math.round(c.clientHeight * dpr);
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    // 카드가 가리는 아래쪽(넓은 화면에서는 오른쪽)을 비우고 그린다
    const cut = wide.matches ? 0 : Math.round((card.offsetHeight + 16) * dpr);
    const w = wide.matches ? W - Math.round((card.offsetWidth + 50) * dpr) : W;
    drawConstel(ctx, w, H - cut, data, Math.min(1, (now - t0) / 6500));
    constelRaf = requestAnimationFrame(tick);
  };
  constelRaf = requestAnimationFrame(tick);
}
function openConstel() {
  const img = constelImage(constelOf(S, beats));
  img.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const name = `인생드라마_${S.name}_별자리.jpg`;
    dialog('내 별자리', [
      h('img', { src: url, alt: '걸어온 점들이 이어진 별자리', style: 'width:100%;border-radius:14px;display:block' }),
      h('button', { class: 'primary', type: 'button', style: 'margin-top:12px', onclick: () => store.download(name, blob) }, '그림으로 저장'),
      h('p', { style: 'font-size:14px;color:var(--soft);margin-top:10px' }, '별은 네가 쓴 장면, 금빛 선은 네가 이은 점, 흐린 가지는 가지 않은 길이야.'),
    ]);
    $('dlg').addEventListener('close', () => URL.revokeObjectURL(url), { once: true });
  }, 'image/jpeg', 0.92);
}

async function openCards() {
  if (!scenesOf(S, beats).length) { toast('아직 쓴 장면이 없어.'); return; }
  busy = true; sheet.hidden = true; $('hud').hidden = true;
  toast('장면을 한 장씩 찍는 중…');
  const shots = await movie.cards((n, total) => { $('toast').textContent = `장면을 찍는 중… ${n} / ${total}`; $('toast').hidden = false; });
  $('toast').hidden = true; $('hud').hidden = false; busy = false;
  go(idx, { instant: true });
  dialog('장면 카드', [
    h('p', {}, '사진을 길게 누르거나 "저장"을 눌러 한 장씩 간직해. 발표 자료에 넣어도 좋아.'),
    h('button', { class: 'primary', type: 'button', style: 'margin-bottom:14px', onclick: async () => { for (const s of shots) { store.download(s.name, s.blob); await new Promise((r) => setTimeout(r, 350)); } } }, `${shots.length}장 모두 저장`),
    h('div', { class: 'shots' }, shots.map((s) => h('figure', {}, h('img', { src: s.url, alt: s.name }), h('a', { href: s.url, download: s.name }, '저장')))),
  ]);
}

function doPrint() {
  const scenes = scenesOf(S, beats);
  $('print').replaceChildren(...[
    h('h1', {}, S.title || `${S.name || '나'}의 인생 드라마`),
    h('p', { class: 'by' }, `주연 ${S.name} · ${S.now}살에 쓰다 · 예측이 아니라, 내가 고르고 다시 쓸 수 있는 이야기`),
    ...scenes.map((s) => h('article', {}, h('small', {}, `${s.age}살 · ${s.title}`), h('p', {}, s.text), s.linked.length ? h('p', { class: 'prep' }, '이어진 점: ' + s.linked.join(', ')) : null, s.prep ? h('p', { class: 'prep' }, '지금 준비할 것: ' + s.prep) : null)),
    S.a.step && S.a.step.text ? h('article', {}, h('small', {}, '오늘 찍는 점 하나'), h('p', {}, S.a.step.text)) : null,
  ].filter(Boolean));
  window.print();
}

function exportFile() {
  store.download(`인생드라마_${S.name || '나'}.json`, new Blob([JSON.stringify({ ...S, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }));
  toast('파일로 저장했어. 메뉴의 "파일 불러오기"로 다시 열 수 있어.');
}
function importFile() {
  const inp = h('input', { type: 'file', accept: 'application/json,.json' });
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    try {
      const x = JSON.parse(await f.text());
      if (!store.valid(x)) throw new Error('bad');
      S = x; beats = build(S); save();
      $('dlg').close();
      const i = Math.max(0, beats.findIndex((b) => b.id === S.at));
      begin(i);
      toast('이야기를 불러왔어.');
    } catch (e) { toast('인생 드라마에서 저장한 파일이 아니야.'); }
  };
  inp.click();
}

// ── 대화 상자 ──
function dialog(title, kids, cls = '') {
  const dlg = $('dlg');
  dlg.replaceChildren(
    h('div', { class: 'dlg-head' }, h('h3', {}, title), h('button', { class: 'pill', type: 'button', style: 'background:#f4eee6', onclick: () => dlg.close() }, '닫기')),
    h('div', { class: 'dlg-body ' + cls }, kids),
  );
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}
$('dlg').addEventListener('click', (e) => { if (e.target === $('dlg')) $('dlg').close(); });

function openScript() {
  const items = [];
  beats.forEach((b, i) => {
    if (!b.scene && b.id !== 'step') return;
    const a = S.a[b.id];
    const linked = linksOf(S, beats).filter((l) => l.to === b.id).map((l) => l.fromLabel);
    const text = [answerText(b, a), linked.length ? '이어진 점: ' + linked.join(', ') : ''].filter(Boolean).join('\n');
    const reached = i <= beats.findIndex((x) => x.id === S.at) || !!a;
    if (!reached) return;
    items.push(h('div', { class: 'script-item' },
      h('p', { class: 'eyebrow' }, `${b.age}살 · ${b.title}`),
      h('p', { class: 'q' }, b.q),
      h('p', { class: 'ans' + (text ? '' : ' empty') }, text || '아직 쓰지 않은 장면'),
      a && a.prep ? h('p', { class: 'q' }, '🌱 지금 준비할 것: ' + a.prep) : null,
      h('button', { class: 'chip', type: 'button', onclick: () => { $('dlg').close(); go(i, { instant: true }); } }, text ? '이 장면 고치기' : '이 장면 쓰기')));
  });
  dialog('나의 대본', items.length ? items : [h('p', {}, '아직 쓴 장면이 없어. 길을 걸으며 질문에 답하면 여기에 대본이 쌓여.')]);
}

function openMenu() {
  const item = (label, sub, fn) => h('button', { type: 'button', onclick: fn }, label, sub ? h('small', {}, sub) : null);
  dialog('메뉴', [
    h('a', { class: 'manual-link menu-manual', href: 'https://m.blog.naver.com/shineonyou4ever/224474221343', target: '_blank', rel: 'noopener noreferrer' }, '사용 설명서 보기'),
    item(audio.on ? '♪ 배경 소리 끄기' : '♪ 배경 소리 켜기', '잔잔한 소리가 길을 따라 바뀌어', () => { S.sound = audio.toggle(); save(); $('dlg').close(); }),
    item(audio.trackName ? '♪ 내 음악 바꾸기' : '♪ 내 음악 넣기', audio.trackName ? '지금: ' + audio.trackName : '가진 음악 파일(mp3 등)을 배경으로', () => {
      const inp = h('input', { type: 'file', accept: 'audio/*' });
      inp.onchange = () => { const f = inp.files[0]; if (!f) return; audio.useFile(f); S.sound = audio.toggle(true); save(); $('dlg').close(); toast('내 음악을 틀었어. 이 기기를 새로 고치면 다시 골라야 해.'); };
      inp.click();
    }),
    audio.trackName ? item('♪ 기본 소리로 돌아가기', '', () => { audio.useFile(null); $('dlg').close(); }) : null,
    item('대본 보기·고치기', '지금까지 쓴 장면을 한눈에', openScript),
    S.plan ? item('인생 계획표 고치기', '입학·취업·결혼·은퇴와 이루고 싶은 일을 다시 정해', () => { $('dlg').close(); go(beats.findIndex((x) => x.id === 'plan'), { instant: true }); }) : null,
    item('처음부터 감상하기', '쓴 장면이 영상처럼 이어져', () => { $('dlg').close(); movie.play(); }),
    item('내 별자리 보기', '이어진 점들을 한 장으로', openConstel),
    item('영상으로 저장', '일반 · 2배 · 4배 녹화 선택', recordOptions),
    item('장면 카드 저장', '장면마다 이미지 한 장', () => { $('dlg').close(); openCards(); }),
    item('인쇄하기', '', () => { $('dlg').close(); doPrint(); }),
    item('파일로 보관', '다른 기기로 옮기거나 나중에 다시 열기', exportFile),
    item('파일 불러오기', '', importFile),
    item('처음부터 다시 쓰기', '지금 이야기는 지워져', () => {
      if (!confirm('지금까지 쓴 이야기를 지우고 처음부터 다시 쓸까? 간직하고 싶으면 먼저 파일로 보관해 줘.')) return;
      store.clear(); location.reload();
    }),
    item('도움말·개인정보', '', () => dialog('도움말', [
      h('p', {}, '길을 걷다가 질문을 만나면 답을 적어. 적은 답이 장면이 되고, 고른 사람들이 곁에서 함께 걸어.'),
      h('p', {}, '여기 적는 글은 지금 쓰는 이 기기의 브라우저에만 저장되고, 서버로 보내지 않아. 함께 쓰는 기기라면 끝난 뒤 메뉴에서 "처음부터 다시 쓰기"를 눌러 지워 줘.'),
      h('p', {}, '길 위에서 계획이 막히거나 갈라지는 순간을 만나. 어느 쪽을 골라도 길은 이어지고, 예전에 남긴 점을 골라 새 길과 이을 수 있어.'),
      h('p', {}, '이 드라마는 예측이 아니야. 언제든 대본에서 다시 고를 수 있어.'),
      h('p', {}, '쓰다가 마음이 많이 무거워지면 혼자 두지 말고 선생님이나 믿을 수 있는 어른에게 이야기해 줘. 청소년 상담 전화 1388은 24시간 열려 있어.'),
    ])),
  ], 'menu');
}
$('menuBtn').onclick = openMenu;

audio.probe();

// ── 시작 ──
function begin(i) {
  $('title').classList.add('out');
  setTimeout(() => { $('title').hidden = true; }, 800);
  $('hud').hidden = false;
  if (S.sound) audio.toggle(true);
  busy = false;
  if (i > 0) go(i, { instant: true });
  else { world.jump(-16); world.state.ageOverride = S.now || 16; go(0); }
}
const resumeAt = (() => {
  const found = beats.findIndex((b) => b.id === S.at);
  // 예전 기록에 지금은 없는 장면이 적혀 있으면 계획표부터 이어 간다
  return found >= 0 ? found : S.at ? Math.max(1, beats.findIndex((b) => b.id === 'plan')) : 0;
})();
if (resumeAt > 0) {
  $('resumeBtn').hidden = false;
  $('resumeBtn').textContent = `이어서 걷기 (${S.name || '나'})`;
  $('startBtn').textContent = '처음부터 새로 쓰기';
  $('startBtn').className = 'ghost';
  $('resumeBtn').className = 'primary';
  $('resumeBtn').parentNode.insertBefore($('resumeBtn'), $('startBtn'));
  $('resumeBtn').onclick = () => begin(resumeAt);
  $('startBtn').onclick = () => {
    if (!confirm('지금까지 쓴 이야기를 지우고 새로 시작할까?')) return;
    store.clear(); S = store.fresh(); beats = build(S); begin(0);
  };
} else {
  $('startBtn').onclick = () => begin(0);
}

// 화면 키보드가 올라오면 카드가 가려지지 않게 한다
if (window.visualViewport) {
  const fit = () => {
    const vv = window.visualViewport;
    const kb = window.innerHeight - vv.height > 120;
    sheet.style.bottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + 'px';
    card.style.maxHeight = kb ? vv.height - 60 + 'px' : '';
    if (kb && document.activeElement && card.contains(document.activeElement)) document.activeElement.scrollIntoView({ block: 'center' });
  };
  window.visualViewport.addEventListener('resize', fit);
  window.visualViewport.addEventListener('scroll', fit);
}
