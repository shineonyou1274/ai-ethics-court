// 환자 확인: 침대를 골라 팔찌를 읽고, 차트와 두 가지 이상이 맞는 분을 찾는다.
// 등급 — sure: 한 번도 엇갈리지 않음 / recheck: 잘못 짚었다가 다시 확인함
import { esc } from './util.js';

const FIELDS = [['name', '이름'], ['birth', '생년월일'], ['no', '등록번호']];

export function band(el, sc, { sfx, act, done }) {
  const beds = sc.beds.map((b, k) => ({ ...b, k })).sort(() => Math.random() - 0.5);
  let open = null, mistakes = 0, finished = false;
  const read = beds.map(() => new Set()), out = beds.map(() => false);

  el.innerHTML = `<div class="chartCard"><small>📋 차트 · 오늘 설명할 환자</small>
      <div class="fields">${FIELDS.map(([k, n]) => `<span><small>${n}</small><b>${esc(sc.chart[k])}</b></span>`).join('')}</div></div>
    <div class="beds">${beds.map((b, i) => `<button class="bed" data-i="${i}"><i class="face" style="--hair:${b.hair}"></i><b>${esc(b.bed)}</b><small>눌러서 다가가기</small></button>`).join('')}</div>
    <p class="handsMsg" id="bandMsg" role="status">침대를 하나 골라 다가가 보세요.</p><div id="bandView"></div>`;
  const msg = (t, bad) => { const m = el.querySelector('#bandMsg'); m.textContent = t; m.classList.toggle('bad', !!bad); };

  function paintBeds() {
    el.querySelectorAll('.bed').forEach((b) => {
      const i = +b.dataset.i;
      b.classList.toggle('on', i === open); b.classList.toggle('out', out[i]);
      b.querySelector('small').textContent = out[i] ? '확인함 · 다른 분' : i === open ? '팔찌를 읽는 중' : '눌러서 다가가기';
    });
  }

  function paintBand() {
    const v = el.querySelector('#bandView');
    if (open === null) { v.innerHTML = ''; return; }
    const b = beds[open], r = read[open];
    v.innerHTML = `<div class="speech"><small>${esc(b.bed)}</small>${esc(b.say)}</div>
      <div class="wrist"><span class="barcode" aria-hidden="true"></span>${FIELDS.map(([k, n]) => `<button class="wfield ${r.has(k) ? 'read' : ''}" data-k="${k}"><small>${n}</small><b>${r.has(k) ? esc(b[k]) : '눌러서 읽기'}</b></button>`).join('')}</div>
      <p class="fine">팔찌에서 두 가지 이상을 읽고 차트와 견주어 보세요. (${Math.min(r.size, 2)}/2)</p>
      <div class="twin"><button class="btn" id="bYes" ${r.size < 2 || finished ? 'disabled' : ''}>이분이 하늘 님이 맞아요</button><button class="btn ghost" id="bNo" ${r.size < 2 || finished ? 'disabled' : ''}>다른 분이에요</button></div>`;
    v.querySelectorAll('.wfield').forEach((f) => f.addEventListener('click', () => {
      if (finished) return; r.add(f.dataset.k); sfx('tap'); act('inspect'); paintBand();
    }));
    v.querySelector('#bYes').addEventListener('click', () => judge(true));
    v.querySelector('#bNo').addEventListener('click', () => judge(false));
  }

  const diff = (b) => FIELDS.filter(([k]) => b[k] !== sc.chart[k]).map(([k, n]) => `${n}(차트 ${sc.chart[k]} · 팔찌 ${b[k]})`);

  function judge(yes) {
    const b = beds[open];
    if (yes && b.right) {
      finished = true; sfx('good'); act('talk'); paintBand();
      msg(mistakes ? '다시 확인해서 바로잡았어요. 이분이 하늘 님이에요.' : '두 가지가 모두 맞아요. 이분이 하늘 님이에요.');
      return done(mistakes ? 'recheck' : 'sure', { mistakes });
    }
    if (!yes && !b.right) { out[open] = true; sfx('pop'); msg(`맞아요, 다른 분이에요. 다른 곳: ${diff(b).join(', ')}`); open = null; paintBeds(); paintBand(); return; }
    mistakes++; sfx('bad');
    msg(yes ? `잠깐! 다시 보니 다른 분이에요. ${diff(b).join(', ')}. 이름이나 생년월일 하나만 같아도 헷갈릴 수 있어요.`
      : '다시 보니 이름과 생년월일, 등록번호가 모두 차트와 같아요. 이분이 맞아요.', true);
    if (!b.right) read[open] = new Set(FIELDS.map(([k]) => k));
    paintBand();
  }

  el.querySelectorAll('.bed').forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.i; if (finished || out[i]) return;
    open = i; sfx('pop'); act('inspect'); paintBeds(); paintBand(); msg('팔찌의 칸을 눌러 읽어 보세요.');
  }));
  return () => {};
}
