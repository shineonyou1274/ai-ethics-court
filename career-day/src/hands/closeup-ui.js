// 3D 가까이 보기 장면의 아래쪽 칸: 할 일 목록, 안내 한 줄, 3D가 안 되는 기기를 위한 버튼.
import { esc } from './util.js';

export function checklist(el, { title, hint, items }) {
  el.innerHTML = `<div class="handsHead"><b>${esc(title)}</b><span>${esc(hint)}</span></div>
    <ol class="todo">${items.map((it) => `<li data-id="${it.id}"><i></i><span>${esc(it.label)}</span><small></small></li>`).join('')}</ol>
    <p class="handsMsg" id="cuMsg" role="status"></p><div id="cuFallback"></div>`;
  const li = (id) => el.querySelector(`.todo li[data-id="${id}"]`);
  return {
    msg(t, bad) { const m = el.querySelector('#cuMsg'); m.textContent = t; m.classList.toggle('bad', !!bad); },
    done(id) { li(id)?.classList.add('done'); },
    progress(id, v) { const s = li(id)?.querySelector('small'); if (s) s.textContent = v >= 1 ? '' : `${Math.round(v * 100)}%`; },
    // 3D를 못 쓰는 기기: 할 일을 버튼으로 하나씩 한다
    fallback(buttons) {
      const box = el.querySelector('#cuFallback');
      box.innerHTML = `<p class="fine">이 기기에서는 3D 대신 버튼으로 해요.</p>${buttons.map((b) => `<button class="choice" data-id="${b.id}"><span class="n">✋</span><span>${esc(b.label)}</span></button>`).join('')}`;
      box.querySelectorAll('.choice').forEach((x) => x.addEventListener('click', () => { const b = buttons.find((y) => y.id === x.dataset.id); if (b.run() !== false) { x.disabled = true; x.classList.add('done'); } }));
    },
  };
}
