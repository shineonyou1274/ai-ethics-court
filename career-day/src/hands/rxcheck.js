// 약사: 처방전과 준비된 약 봉투를 한 칸씩 견주어, 다른 곳을 눌러 찾는다 (틀린 그림 찾기처럼).
// 약 이름은 모두 가상이고, 약 지식이 아니라 '대조하는 눈'을 쓴다.
// 등급 — sure: 같은 칸을 다르다고 짚은 적 없음 / recheck: 잘못 짚은 적이 있음
import { esc } from './util.js';

export function rxcheck(el, sc, { sfx, act, done }) {
  const rows = sc.rx; // [{ name, times, days }] 처방전
  const bag = sc.bag; // 같은 모양, 몇 칸이 다르다
  const diffs = new Set();
  bag.forEach((b, i) => ['name', 'times', 'days'].forEach((k) => { if (b[k] !== rows[i][k]) diffs.add(`${i}.${k}`); }));
  const found = new Set();
  let mistakes = 0, finished = false;
  const cell = (r, i, k, tap) => `<${tap ? `button class="rxCell" data-key="${i}.${k}"` : 'span class="rxCell"'}>${esc(r[k])}</${tap ? 'button' : 'span'}>`;
  el.innerHTML = `<div class="rxWrap">
      <div class="rxCard"><small>📄 처방전 · 가온 님</small>${rows.map((r, i) => `<div class="rxRow">${cell(r, i, 'name')}${cell(r, i, 'times')}${cell(r, i, 'days')}</div>`).join('')}</div>
      <div class="rxCard bag"><small>💊 준비된 약 봉투 · 다른 곳을 눌러요</small>${bag.map((r, i) => `<div class="rxRow">${cell(r, i, 'name', 1)}${cell(r, i, 'times', 1)}${cell(r, i, 'days', 1)}</div>`).join('')}</div>
    </div>
    <div class="handsFoot"><div class="meter"><i id="rxBar"></i></div><span id="rxCount">다른 곳 0 / ${diffs.size}</span></div>
    <p class="handsMsg" id="rxMsg" role="status">위아래 같은 줄을 견주어, 봉투에서 다른 칸을 눌러요.</p>`;
  const msg = (t, bad) => { const m = el.querySelector('#rxMsg'); m.textContent = t; m.classList.toggle('bad', !!bad); };
  el.querySelectorAll('button.rxCell').forEach((b) => b.addEventListener('click', () => {
    if (finished || found.has(b.dataset.key)) return;
    const [i, k] = b.dataset.key.split('.');
    if (diffs.has(b.dataset.key)) {
      found.add(b.dataset.key); b.classList.add('found'); sfx('pop'); act('inspect');
      el.querySelector('#rxBar').style.width = (found.size / diffs.size * 100) + '%';
      el.querySelector('#rxCount').textContent = `다른 곳 ${found.size} / ${diffs.size}`;
      msg(`찾았어요! 처방전은 "${rows[i][k]}", 봉투는 "${bag[i][k]}"예요.`);
      if (found.size === diffs.size) {
        finished = true; sfx('good');
        msg('다른 곳을 모두 찾았어요. 조제한 동료와 함께 확인해 바로잡았어요.');
        done(mistakes ? 'recheck' : 'sure', { mistakes });
      }
    } else {
      mistakes++; sfx('bad'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      msg('다시 보니 처방전과 같아요. 같은 줄의 같은 칸끼리 견주어 봐요.', true);
    }
  }));
  return () => {};
}
