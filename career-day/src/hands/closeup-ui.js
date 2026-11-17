// 3D 가까이 보기 장면의 아래쪽 칸: 할 일 목록, 안내 한 줄, 3D가 안 되는 기기를 위한 버튼.
// 할 일 목록은 접어 둔다 (shared/DESIGN.md §2-1). 지금 할 일 하나만 이름과 %를 크게 보이고, 나머지는 동그라미로만 보인다(마친 것은 초록).
// 누르면 전체 목록이 펼쳐지고, 다시 누르면 접힌다.
import { esc } from './util.js';

export function checklist(el, { title, hint, items }) {
  el.innerHTML = `<div class="handsHead"><b>${esc(title)}</b><span>${esc(hint)}</span></div>
    <button type="button" class="todoNow" id="cuNow" aria-expanded="false" aria-controls="cuList">
      <span class="dots" aria-hidden="true">${items.map((it) => `<i data-id="${it.id}"></i>`).join('')}</span>
      <span class="now"><b id="cuLabel"></b><small id="cuPct"></small></span><span class="more" aria-hidden="true">▾</span>
    </button>
    <ol class="todo" id="cuList" hidden>${items.map((it) => `<li data-id="${it.id}"><i></i><span>${esc(it.label)}</span><small></small></li>`).join('')}</ol>
    <p class="handsMsg" id="cuMsg" role="status"></p><div id="cuFallback"></div>`;
  const li = (id) => el.querySelector(`.todo li[data-id="${id}"]`);
  const now = el.querySelector('#cuNow'), list = el.querySelector('#cuList');
  const done = new Set(), pct = {}; let active = null; // active: 지금 하고 있는 일 (문지르는 중인 것이 있으면 그것, 없으면 아직 안 한 첫 번째 것)
  const paint = () => {
    const cur = (active && !done.has(active) ? items.find((it) => it.id === active) : null) || items.find((it) => !done.has(it.id));
    el.querySelectorAll('.dots i').forEach((d) => { d.classList.toggle('done', done.has(d.dataset.id)); d.classList.toggle('cur', !!cur && d.dataset.id === cur.id); });
    el.querySelector('#cuLabel').textContent = cur ? cur.label : '모두 마쳤어요';
    el.querySelector('#cuPct').textContent = cur && pct[cur.id] ? `${Math.round(pct[cur.id] * 100)}%` : '';
    now.classList.toggle('all', !cur);
    now.setAttribute('aria-label', `${cur ? `지금 할 일: ${cur.label}` : '모두 마쳤어요'}. 할 일 ${items.length}개 가운데 ${done.size}개 마침. 누르면 목록이 ${list.hidden ? '펼쳐져요' : '접혀요'}.`);
  };
  now.addEventListener('click', () => { list.hidden = !list.hidden; now.setAttribute('aria-expanded', String(!list.hidden)); now.classList.toggle('open', !list.hidden); paint(); });
  // 가로로 넓은 화면(PC)에서는 자리가 넉넉하니 처음부터 펼쳐 둔다. 폰에서는 접어 둔다.
  if (typeof matchMedia === 'function' && matchMedia('(min-aspect-ratio: 11/10)').matches) { list.hidden = false; now.setAttribute('aria-expanded', 'true'); now.classList.add('open'); }
  paint();
  return {
    msg(t, bad) { const m = el.querySelector('#cuMsg'); m.textContent = t; m.classList.toggle('bad', !!bad); },
    done(id) { li(id)?.classList.add('done'); done.add(id); if (active === id) active = null; paint(); },
    progress(id, v) { const s = li(id)?.querySelector('small'); if (s) s.textContent = v >= 1 ? '' : `${Math.round(v * 100)}%`; pct[id] = v >= 1 ? 0 : v; if (v < 1) active = id; paint(); },
    // 3D를 못 쓰는 기기: 할 일을 버튼으로 하나씩 한다
    fallback(buttons) {
      const box = el.querySelector('#cuFallback');
      box.innerHTML = `<p class="fine">이 기기에서는 3D 대신 버튼으로 해요.</p>${buttons.map((b) => `<button class="choice" data-id="${b.id}"><span class="n">✋</span><span>${esc(b.label)}</span></button>`).join('')}`;
      box.querySelectorAll('.choice').forEach((x) => x.addEventListener('click', () => { const b = buttons.find((y) => y.id === x.dataset.id); if (b.run() !== false) { x.disabled = true; x.classList.add('done'); } }));
      now.hidden = true; // 버튼이 곧 할 일 목록이라, 접은 목록은 보이지 않게 한다
    },
  };
}
