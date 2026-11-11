// 흐름 지휘: 걷기 → 질문 카드 → 답 저장 → 다음 걸음.
import './style.css';
import { createWorld } from './world.js';
import { build, ACTS, STEP, VALUES, partyAt, orbsAt, scenesOf, answerText } from './story.js';
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
    out.push({ dist: b.dist, age: b.age, label: b.age >= 1 && !b.final ? b.age + '살' : '', final: !!b.final });
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
  world.state.ageOverride = b.act === 0 ? (S.now || 16) : null;
}

function hud(b) {
  document.body.dataset.act = b.act;
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
    if (gap > 0.5) { world.setCamera('walk'); await world.walkTo(b.dist, Math.min(4.6, Math.max(1.4, (gap / STEP) * 4.2))); }
  }
  world.setCamera(b.cam || 'card');
  if (b.fx === 'finale') world.setFinale(true);
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
    valid = () => inp.value.trim().length > 0;
    collect = () => ({ text: inp.value.trim() });
  } else if (b.type === 'age') {
    let v = S.now || 15;
    const out = h('output', {}, String(v));
    const set = (n) => { v = Math.min(80, Math.max(8, n)); out.textContent = v; world.state.ageOverride = v; };
    body.push(h('div', { class: 'stepper' }, h('button', { type: 'button', 'aria-label': '한 살 줄이기', onclick: () => set(v - 1) }, '−'), out, h('small', {}, '살'), h('button', { type: 'button', 'aria-label': '한 살 늘리기', onclick: () => set(v + 1) }, '+')));
    collect = () => ({ value: v });
  } else if (b.type === 'slider') {
    let v = S.life || b.def;
    const out = h('output', {}, String(v));
    const rng = h('input', { type: 'range', min: b.min, max: b.max, step: 1, value: v, 'aria-label': b.q, oninput: () => { v = +rng.value; out.textContent = v; } });
    body.push(h('div', { class: 'stepper' }, out, h('small', {}, b.unit || '살')), rng);
    collect = () => ({ value: v });
  } else if (b.type === 'title') {
    const inp = h('input', { type: 'text', maxLength: 30, value: S.title || `${S.name}의 인생 드라마`, autocomplete: 'off', enterKeyHint: 'done' });
    body.push(h('label', { class: 'field' }, h('span', {}, '드라마 제목'), inp));
    collect = () => ({ text: inp.value.trim() || `${S.name}의 인생 드라마` });
  } else if (b.type === 'hub') {
    renderHub();
    return;
  }

  if (b.type === 'chips') {
    const box = h('div', { class: 'chips' + (b.id === 'values' ? ' vals' : '') });
    const max = b.max || 1;
    const draw = () => {
      box.replaceChildren(...b.options.map((o) => {
        const col = b.id === 'values' ? (VALUES.find((x) => x[0] === o.k) || [])[1] : null;
        const el = chip(o.label, d.picks.includes(o.k), () => {
          if (d.picks.includes(o.k)) d.picks = d.picks.filter((k) => k !== o.k);
          else if (max === 1) d.picks = [o.k];
          else if (d.picks.length + (b.people && d.custom ? 1 : 0) < max) d.picks.push(o.k);
          else { toast(`${max}개까지 고를 수 있어. 하나를 빼고 다시 골라 봐.`); return; }
          if (max === 1 && custom) { custom.value = ''; d.custom = ''; }
          if (b.fx === 'orbs') world.setOrbs(d.picks.map((v) => (VALUES.find((x) => x[0] === v) || [])[1]));
          draw(); refresh();
        }, col ? 'dot' : '');
        if (col) el.style.setProperty('--c', col);
        return el;
      }));
    };
    const custom = b.custom ? h('input', { type: 'text', maxLength: 14, value: d.custom, placeholder: b.custom, autocomplete: 'off', oninput: () => { d.custom = custom.value.trim(); if (max === 1 && d.custom) { d.picks = []; draw(); } refresh(); } }) : null;
    draw();
    body.push(box);
    if (custom) body.push(h('label', { class: 'field' }, custom));
    const min = b.min != null ? b.min : b.optional ? 0 : 1;
    valid = () => d.picks.length + (d.custom ? 1 : 0) >= min;
  }

  if (b.type === 'text' || (b.type === 'chips' && b.text)) {
    const limit = b.short ? 60 : 300;
    const count = h('div', { class: 'count' });
    const ta = b.short
      ? h('input', { type: 'text', maxLength: limit, value: d.text, placeholder: b.ph || '', autocomplete: 'off' })
      : h('textarea', { maxLength: limit, rows: 3, placeholder: b.type === 'chips' ? '' : b.ph || '한두 문장이면 충분해.' }, d.text);
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
  card.className = '';
  card.replaceChildren(
    h('div', { class: 'scroll' },
      h('p', { class: 'eyebrow' }, b.act === 0 || b.type === 'say' ? act : `${act} · ${b.age}살`),
      h('h2', {}, b.q),
      b.hint ? h('p', { class: 'hint' }, b.hint) : null,
      body),
    h('div', { class: 'foot' }, primary, h('div', { class: 'foot-row' },
      idx > 0 ? h('button', { class: 'link', type: 'button', onclick: () => go(idx - 1, { instant: true }) }, '‹ 이전') : h('span'),
      b.optional ? h('button', { class: 'link', type: 'button', onclick: () => submit(b, { skip: true }) }, b.skipLabel || '건너뛰기 ›') : null)),
  );
  refresh();
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
  else if (b.type !== 'say') {
    const empty = !ans.skip && !(ans.picks && ans.picks.length) && !ans.custom && !(ans.text && ans.text.trim()) ;
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
        ...row('기억되고 싶은 모습', rem),
        ...row('이번 주의 한 걸음', step))),
    h('button', { class: 'primary', type: 'button', onclick: () => movie.play() }, '▶ 처음부터 감상하기'),
    h('div', { class: 'grid2' },
      h('button', { class: 'tile', type: 'button', onclick: () => movie.play({ record: true }) }, '영상으로 저장', h('small', {}, '감상하는 동안 녹화돼')),
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
  getData: () => ({ S, beats, scenes: scenesOf(S, beats) }),
  stage,
  onOpen: () => { $('dlg').open && $('dlg').close(); sheet.hidden = true; $('hud').hidden = true; reportInset(); },
  onClose: () => { $('hud').hidden = false; busy = false; go(idx, { instant: true }); },
  onVideo: (blob, ext) => {
    let vid;
    const url = URL.createObjectURL(blob);
    const name = `인생드라마_${S.name}.${ext}`;
    const file = new File([blob], name, { type: blob.type });
    const canShare = navigator.canShare && navigator.canShare({ files: [file] });
    dialog('영상이 완성됐어', [
      (vid = h('video', { src: url, controls: true, playsInline: true })),
      h('div', { class: 'chips', style: 'margin-top:10px' }, [1, 1.5, 2].map((r) => h('button', { class: 'chip', type: 'button', onclick: () => { vid.playbackRate = r; vid.play(); } }, r + '배속'))),
      h('button', { class: 'primary', type: 'button', style: 'margin-top:12px', onclick: () => store.download(name, blob) }, '내 기기에 저장'),
      canShare ? h('button', { class: 'ghost', type: 'button', style: 'border-color:var(--line)', onclick: () => navigator.share({ files: [file], title: S.title }).catch(() => {}) }, '공유하기') : null,
      h('p', { style: 'font-size:14px;color:var(--soft);margin-top:12px' }, ext === 'webm' ? '이 브라우저는 MP4 녹화를 지원하지 않아 WebM 형식으로 저장돼. 크롬과 최신 갤러리에서는 열리지만 아이폰에서는 안 열릴 수 있어. 최신 크롬이나 사파리에서 다시 녹화하면 MP4로 저장돼.' : 'MP4 형식이라 대부분의 기기와 앱에서 바로 열려. 저장한 뒤에도 재생 앱에서 배속을 바꿀 수 있어.'),
    ]);
    movie.close();
  },
});

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
    ...scenes.map((s) => h('article', {}, h('small', {}, `${s.age}살 · ${s.title}`), h('p', {}, s.text), s.prep ? h('p', { class: 'prep' }, '지금 준비할 것: ' + s.prep) : null)),
    S.a.step && S.a.step.text ? h('article', {}, h('small', {}, '이번 주의 한 걸음'), h('p', {}, S.a.step.text)) : null,
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
    const text = answerText(b, a);
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
    item(audio.on ? '♪ 배경 소리 끄기' : '♪ 배경 소리 켜기', '잔잔한 소리가 길을 따라 바뀌어', () => { S.sound = audio.toggle(); save(); $('dlg').close(); }),
    item('대본 보기·고치기', '지금까지 쓴 장면을 한눈에', openScript),
    item('처음부터 감상하기', '쓴 장면이 영상처럼 이어져', () => { $('dlg').close(); movie.play(); }),
    item('영상으로 저장', '감상하는 동안 녹화해서 파일로', () => { $('dlg').close(); movie.play({ record: true }); }),
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
      h('p', {}, '이 드라마는 예측이 아니야. 언제든 대본에서 다시 고를 수 있어.'),
      h('p', {}, '쓰다가 마음이 많이 무거워지면 혼자 두지 말고 선생님이나 믿을 수 있는 어른에게 이야기해 줘. 청소년 상담 전화 1388은 24시간 열려 있어.'),
    ])),
  ], 'menu');
}
$('menuBtn').onclick = openMenu;

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
const resumeAt = beats.findIndex((b) => b.id === S.at);
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
