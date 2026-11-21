// 원무행정 직원: 창구에 쌓인 서류를 알맞은 함에 끌어 넣고, 자리를 비우기 전에 화면을 잠근다.
// 등급 — neat: 한 번도 엇갈리지 않음 / redo: 다른 함에 넣으려 한 적이 있음
import { esc } from './util.js';

export function paperwork(el, sc, { sfx, act, done }) {
  const cards = sc.cards.map((c, k) => ({ ...c, k })).sort(() => Math.random() - 0.5);
  const filed = new Set();
  let mistakes = 0, locked = false, finished = false;
  el.innerHTML = `<p class="handsMsg" id="pwMsg" role="status">서류를 하나씩 끌어 알맞은 함에 넣어요.</p>
    <div class="trays">${sc.trays.map((t) => `<div class="tray" data-id="${t.id}"><span>${t.icon}</span><b>${esc(t.label)}</b><small>0장</small></div>`).join('')}</div>
    <div class="papers">${cards.map((c) => `<button class="paper" data-k="${c.k}"><b>${esc(c.label)}</b><small>${esc(c.sub || '')}</small></button>`).join('')}</div>
    <div class="screenLock"><div class="monitor" id="pwMon"><small>접수 화면</small><span>이든 님 · 010-****-1234 · 오늘 09:50 접수</span><span>새봄 님 · 010-****-5678 · 오늘 10:05 접수</span></div>
      <button class="btn ghost" id="pwLock">🔒 자리 비우기 전 화면 잠그기</button></div>`;
  const msg = (t, bad) => { const m = el.querySelector('#pwMsg'); m.textContent = t; m.classList.toggle('bad', !!bad); };
  const count = {};
  const finish = () => {
    if (finished || filed.size < cards.length || !locked) return;
    finished = true; sfx('good'); act('work');
    msg(mistakes ? '엇갈린 서류를 바로잡아 모두 정리했어요.' : '서류를 모두 제자리에 두고, 화면도 잠갔어요.');
    done(mistakes ? 'redo' : 'neat', { mistakes });
  };
  function file(card, trayId) {
    if (finished || filed.has(card.k)) return;
    const tray = el.querySelector(`.tray[data-id="${trayId}"]`);
    if (card.to !== trayId) {
      mistakes++; sfx('bad'); msg(`앗, 그 함이 아니에요. ${card.why}`, true);
      tray.classList.remove('shake'); void tray.offsetWidth; tray.classList.add('shake'); return;
    }
    filed.add(card.k); count[trayId] = (count[trayId] || 0) + 1; sfx('pop'); act('work');
    tray.querySelector('small').textContent = `${count[trayId]}장`; tray.classList.add('got'); setTimeout(() => tray.classList.remove('got'), 400);
    const b = el.querySelector(`.paper[data-k="${card.k}"]`); b.classList.add('filed'); b.disabled = true;
    msg(filed.size === cards.length && !locked ? '서류 정리 끝! 이제 잠깐 자리를 비워요. 화면에 다른 사람의 정보가 떠 있어요.' : card.ok || '알맞은 함에 넣었어요.');
    finish();
  }
  el.querySelector('#pwLock').addEventListener('click', () => {
    if (locked || finished) return;
    if (filed.size < cards.length) { msg('서류를 다 정리한 뒤에 자리를 비워요.'); return; }
    locked = true; sfx('pop'); el.querySelector('#pwMon').classList.add('locked'); el.querySelector('#pwLock').disabled = true; finish();
  });

  // 끌어 넣기. 누르기만 하면 '어느 함에 넣을지' 고를 수 있게 함들이 반짝인다.
  let picked = null;
  const trayAt = (x, y) => [...el.querySelectorAll('.tray')].find((t) => { const r = t.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top && y < r.bottom; });
  el.querySelectorAll('.tray').forEach((t) => t.addEventListener('click', () => { if (picked) { const c = picked; picked = null; el.querySelectorAll('.paper').forEach((p) => p.classList.remove('on')); el.querySelector('.trays').classList.remove('pick'); file(c, t.dataset.id); } }));
  el.querySelectorAll('.paper').forEach((b) => {
    let start = null, ghost = null;
    const card = cards.find((c) => c.k === +b.dataset.k);
    b.addEventListener('pointerdown', (e) => { if (b.disabled) return; start = { x: e.clientX, y: e.clientY, id: e.pointerId }; b.setPointerCapture?.(e.pointerId); });
    b.addEventListener('pointermove', (e) => {
      if (!start || e.pointerId !== start.id) return;
      if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) { ghost = b.cloneNode(true); ghost.classList.add('ghost'); document.body.append(ghost); b.classList.add('lifted'); }
      if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; const t = trayAt(e.clientX, e.clientY); el.querySelectorAll('.tray').forEach((x) => x.classList.toggle('over', x === t)); }
    });
    const end = (e, cancel) => {
      if (!start || e.pointerId !== start.id) return;
      if (ghost) {
        ghost.remove(); ghost = null; b.classList.remove('lifted'); el.querySelectorAll('.tray').forEach((x) => x.classList.remove('over'));
        const t = !cancel && trayAt(e.clientX, e.clientY); if (t) file(card, t.dataset.id);
      } else if (!cancel && !b.disabled) {
        picked = card; el.querySelectorAll('.paper').forEach((p) => p.classList.toggle('on', p === b)); el.querySelector('.trays').classList.add('pick');
        msg('어느 함에 넣을까요? 함을 눌러요.');
      }
      start = null;
    };
    b.addEventListener('pointerup', (e) => end(e, false));
    b.addEventListener('pointercancel', (e) => end(e, true));
  });
  return () => document.querySelectorAll('.paper.ghost').forEach((g) => g.remove());
}
