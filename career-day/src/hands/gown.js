// 수술 준비: 수술 복장을 순서대로 끌어다 입고, 시작 전에 팀이 함께 확인(타임아웃)한다.
// 등급 — ready: 한 번에 맞게 입음 / redo: 순서가 엇갈려 다시 함
import { esc } from './util.js';

// rank 가 같은 것끼리는 어느 것을 먼저 해도 된다
const NEED = {
  0: '모자와 마스크부터 써요. 손을 씻은 뒤에는 얼굴과 머리를 만지지 않거든요.',
  1: '가운과 장갑은 씻은 손으로만 만져요. 수술 전 손 세척이 먼저예요.',
  2: '장갑을 먼저 끼면 가운을 입다가 장갑 겉면이 닿을 수 있어요. 가운이 먼저예요.',
};

const FIGURE = `<svg viewBox="0 0 160 230" class="figure" aria-hidden="true">
  <rect x="58" y="180" width="18" height="44" rx="8" fill="#5a7d8c"/><rect x="84" y="180" width="18" height="44" rx="8" fill="#5a7d8c"/>
  <rect x="40" y="80" width="80" height="108" rx="24" fill="#7fb5a6"/>
  <rect x="18" y="88" width="20" height="78" rx="10" fill="#7fb5a6"/><rect x="122" y="88" width="20" height="78" rx="10" fill="#7fb5a6"/>
  <g id="fGown" opacity="0"><path d="M34 82 Q80 66 126 82 L134 206 Q80 216 26 206 Z" fill="#a6c5d1" stroke="#7fa3b2" stroke-width="2"/>
    <rect x="14" y="86" width="24" height="84" rx="12" fill="#a6c5d1" stroke="#7fa3b2" stroke-width="2"/><rect x="122" y="86" width="24" height="84" rx="12" fill="#a6c5d1" stroke="#7fa3b2" stroke-width="2"/></g>
  <circle id="fHandL" cx="27" cy="172" r="10" fill="#f4cbab"/><circle id="fHandR" cx="133" cy="172" r="10" fill="#f4cbab"/>
  <g id="fClean" opacity="0"><text x="6" y="160" font-size="14">✨</text><text x="136" y="160" font-size="14">✨</text></g>
  <circle cx="80" cy="48" r="28" fill="#f4cbab"/>
  <path d="M52 44 Q54 18 80 18 Q106 18 108 44 Q96 30 80 32 Q64 30 52 44Z" fill="#3b3330"/>
  <circle cx="70" cy="48" r="3" fill="#263c52"/><circle cx="90" cy="48" r="3" fill="#263c52"/>
  <path id="fSmile" d="M72 60 Q80 66 88 60" stroke="#263c52" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <g id="fCap" opacity="0"><path d="M50 42 Q50 12 80 12 Q110 12 110 42 Q80 32 50 42Z" fill="#5f9fc9"/><circle cx="66" cy="26" r="2.4" fill="#d6ecf7"/><circle cx="84" cy="21" r="2.4" fill="#d6ecf7"/><circle cx="98" cy="30" r="2.4" fill="#d6ecf7"/></g>
  <g id="fMask" opacity="0"><rect x="60" y="52" width="40" height="22" rx="8" fill="#cfe6f2" stroke="#93bcd2" stroke-width="1.5"/><path d="M64 60 H96 M64 66 H96" stroke="#93bcd2" stroke-width="1.2"/><path d="M60 58 L52 50 M100 58 L108 50" stroke="#93bcd2" stroke-width="1.5"/></g>
</svg>`;

export function gown(el, sc, { sfx, act, done }) {
  const items = sc.items.map((it, k) => ({ ...it, k })).sort(() => Math.random() - 0.5);
  const worn = new Set();
  let mistakes = 0, phase = 'dress', finished = false;

  el.innerHTML = `<p class="handsMsg" id="gMsg" role="status">입을 순서대로 하나씩 끌어 놓으세요. 눌러도 돼요.</p><div class="dressRow"><div class="dropZone" id="drop">${FIGURE}<span class="dropTip">여기로 끌어 놓기</span></div>
      <div class="items">${items.map((it) => `<button class="item" data-k="${it.k}"><span>${it.icon}</span><b>${esc(it.label)}</b></button>`).join('')}</div></div>
    <div id="tOut"></div>`;
  const msg = (t, bad) => { const m = el.querySelector('#gMsg'); m.textContent = t; m.classList.toggle('bad', !!bad); };
  const drop = el.querySelector('#drop');
  const layer = { cap: 'fCap', mask: 'fMask', scrub: 'fClean', gown: 'fGown' };

  function wear(it) {
    if (phase !== 'dress' || worn.has(it.id)) return;
    const need = Math.min(...sc.items.filter((x) => !worn.has(x.id)).map((x) => x.rank));
    if (it.rank !== need) { mistakes++; sfx('bad'); msg(`앗, 순서가 엇갈렸어요. ${NEED[need]}`, true); drop.classList.remove('shake'); void drop.offsetWidth; drop.classList.add('shake'); return; }
    worn.add(it.id); sfx('pop'); act('work');
    if (layer[it.id]) el.querySelector('#' + layer[it.id]).setAttribute('opacity', '1');
    if (it.id === 'mask') el.querySelector('#fSmile').setAttribute('opacity', '0');
    if (it.id === 'gloves') ['fHandL', 'fHandR'].forEach((id) => el.querySelector('#' + id).setAttribute('fill', '#efe2bf'));
    const b = el.querySelector(`.item[data-k="${it.k}"]`); b.classList.add('worn'); b.disabled = true;
    msg(it.tip);
    if (worn.size === sc.items.length) timeout();
  }

  function timeout() {
    phase = 'timeout'; drop.classList.add('ready');
    const said = new Set();
    el.querySelector('#tOut').innerHTML = `<div class="bubble timeout"><b class="jua">⏸ 타임아웃 · 모두 손을 멈추고 함께 확인해요</b>
      <div class="team">${sc.timeout.map((t, i) => `<button class="member" data-i="${i}"><span>${t.icon}</span><b>${esc(t.who)}</b><small>눌러서 확인 듣기</small></button>`).join('')}</div>
      <div id="tSay"></div></div>`;
    el.querySelectorAll('.member').forEach((m) => m.addEventListener('click', () => {
      if (finished) return; const i = +m.dataset.i; if (said.has(i)) return;
      said.add(i); m.classList.add('done'); m.querySelector('small').textContent = '✓ 확인'; sfx('pop'); act('talk');
      el.querySelector('#tSay').insertAdjacentHTML('beforeend', `<div class="speech"><small>${esc(sc.timeout[i].who)}</small>${esc(sc.timeout[i].say)}</div>`);
      if (said.size === sc.timeout.length) { finished = true; msg('모두 확인했어요. 이제 수술을 시작해요.'); done(mistakes ? 'redo' : 'ready', { mistakes }); }
    }));
    msg('다 갖춰 입었어요. 시작하기 전에 팀이 함께 확인해요.');
    el.querySelector('#tOut').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // 끌어 놓기 (누르기만 해도 입는다)
  el.querySelectorAll('.item').forEach((b) => {
    let start = null, ghost = null;
    b.addEventListener('pointerdown', (e) => { if (b.disabled) return; start = { x: e.clientX, y: e.clientY, id: e.pointerId }; b.setPointerCapture?.(e.pointerId); });
    b.addEventListener('pointermove', (e) => {
      if (!start || e.pointerId !== start.id) return;
      if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) {
        ghost = b.cloneNode(true); ghost.classList.add('ghost'); document.body.append(ghost); b.classList.add('lifted');
      }
      if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; const r = drop.getBoundingClientRect(); drop.classList.toggle('over', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom); }
    });
    const end = (e, cancel) => {
      if (!start || e.pointerId !== start.id) return;
      const it = items.find((x) => x.k === +b.dataset.k);
      if (ghost) {
        const r = drop.getBoundingClientRect(), inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
        ghost.remove(); ghost = null; b.classList.remove('lifted'); drop.classList.remove('over');
        if (inside && !cancel) wear(it);
      } else if (!cancel) wear(it);
      start = null;
    };
    b.addEventListener('pointerup', (e) => end(e, false));
    b.addEventListener('pointercancel', (e) => end(e, true));
  });
  return () => el.querySelectorAll('.ghost').forEach((g) => g.remove());
}
