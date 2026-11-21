// 봉합: 위 점에서 아래 점까지 바늘을 끌어 한 땀씩 꿰맨다. 연습용 모형처럼 단순하게 그린다(피는 그리지 않는다).
// 등급 — neat: 놓친 땀이 1번 이하 / retie: 여러 번 다시 꿰맴
import { makeCanvas, loop, drag, roundRect } from './util.js';

const W = 320, H = 230, N = 5, Y1 = 92, Y2 = 140, X0 = 92, GAP = 34, HIT = 22;
const LINE = { y: 116, x1: 68, x2: 252 };

export function suture(el, sc, { sfx, act, done }) {
  el.innerHTML = `<div class="handsHead"><b id="suStep"></b><span id="suHow">바늘을 위쪽 점에 대고, 아래쪽 점까지 끌어서 놓아요.</span></div>
    <div class="handsStage"></div>
    <div class="handsFoot"><div class="meter"><i id="suBar"></i></div><span id="suMiss">다시 꿰맨 땀 0</span></div>`;
  const c = makeCanvas(el.querySelector('.handsStage'), W, H, '봉합 연습 화면. 위 점에서 아래 점까지 끌어 꿰매요.');
  const xs = Array.from({ length: N }, (_, k) => X0 + k * GAP);
  let k = 0, misses = 0, pull = null, finished = false, flash = 0, flashText = '';
  const sewn = [];

  function paint() {
    el.querySelector('#suStep').textContent = finished ? `${N}땀 완성` : `${k + 1} / ${N}땀`;
    el.querySelector('#suBar').style.width = (sewn.length / N * 100) + '%';
    el.querySelector('#suMiss').textContent = `다시 꿰맨 땀 ${misses}`;
  }
  paint();

  drag(c.cv, c.toBase, {
    down(p) {
      if (finished) return false;
      if (Math.hypot(p.x - xs[k], p.y - Y1) > HIT + 6) { flash = 1.2; flashText = '반짝이는 위쪽 점에서 시작해요'; return false; }
      pull = { from: { x: xs[k], y: Y1 }, at: p }; sfx('pop');
    },
    move(p) { if (pull) pull.at = p; },
    up(p, cancel) {
      if (!pull) return; const to = p; pull = null; if (cancel) return;
      const off = Math.hypot(to.x - xs[k], to.y - Y2);
      if (off <= HIT) {
        sewn.push({ x: xs[k], tilt: (to.x - xs[k]) * 0.4 }); k++; sfx('good'); act('work');
        if (k === N) { finished = true; paint(); return done(misses <= 1 ? 'neat' : 'retie', { misses }); }
      } else {
        misses++; sfx('bad'); flash = 1.4;
        flashText = to.y < Y2 - HIT ? '조금 더 아래 점까지 끌어요' : Math.abs(to.x - xs[k]) > HIT ? '간격이 어긋났어요. 바로 아래 점으로' : '아래 점에 맞춰 놓아요';
      }
      paint();
    },
  });

  loop(el, (dt, t) => {
    const ctx = c.ctx; c.begin();
    // 수술포와 연습 피부
    ctx.fillStyle = '#4f8f84'; roundRect(ctx, 0, 0, W, H, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
    for (let x = 10; x < W; x += 14) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 30, H); ctx.stroke(); }
    ctx.fillStyle = '#f3c7a8'; ctx.strokeStyle = '#d9a17f'; ctx.lineWidth = 2;
    roundRect(ctx, 44, 52, 232, 128, 30); ctx.fill(); ctx.stroke();
    // 아직 닫히지 않은 절개선: 꿰맨 곳은 가늘게
    const closed = (x) => sewn.some((s) => Math.abs(s.x - x) < GAP / 2 + 1);
    for (let x = LINE.x1; x < LINE.x2; x += 4) {
      ctx.strokeStyle = closed(x) ? '#d79a86' : '#b9555f'; ctx.lineWidth = closed(x) ? 1.4 : 3.4;
      ctx.beginPath(); ctx.moveTo(x, LINE.y); ctx.lineTo(x + 4, LINE.y); ctx.stroke();
    }
    // 꿰맨 땀
    for (const s of sewn) {
      ctx.strokeStyle = '#2f5d9c'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s.x, Y1); ctx.lineTo(s.x + s.tilt, Y2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.x - 6, Y1 - 3); ctx.lineTo(s.x + 6, Y1 + 3); ctx.moveTo(s.x + 6, Y1 - 3); ctx.lineTo(s.x - 6, Y1 + 3); ctx.stroke();
    }
    // 다음 땀의 두 점
    if (!finished) {
      const pulse = 1 + Math.sin(t * 6) * 0.25;
      for (const [y, col] of [[Y1, '#ffd166'], [Y2, '#ffffff']]) {
        ctx.fillStyle = col; ctx.strokeStyle = '#263c52'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(xs[k], y, 5.5 * (y === Y1 ? pulse : 1), 0, 7); ctx.fill(); ctx.stroke();
      }
      for (let j = k + 1; j < N; j++) for (const y of [Y1, Y2]) { ctx.fillStyle = 'rgba(38,60,82,.25)'; ctx.beginPath(); ctx.arc(xs[j], y, 3, 0, 7); ctx.fill(); }
    }
    // 끌고 있는 바늘과 실
    if (pull) {
      const a = pull.from, b = pull.at;
      ctx.strokeStyle = '#2f5d9c'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2 + 14, (a.y + b.y) / 2, b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#8a97a5'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(b.x + 9, b.y, 10, Math.PI * 0.9, Math.PI * 1.9); ctx.stroke();
      const ok = Math.hypot(b.x - xs[k], b.y - Y2) <= HIT;
      ctx.strokeStyle = ok ? '#3f9d7d' : 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(xs[k], Y2, HIT, 0, 7); ctx.stroke();
    }
    if (flash > 0 || finished) {
      flash -= dt;
      const text = finished ? (misses <= 1 ? '✓ 고르게 다섯 땀' : '✓ 다섯 땀 완성') : flashText;
      ctx.fillStyle = finished ? 'rgba(63,157,125,.9)' : 'rgba(38,60,82,.82)'; roundRect(ctx, 50, 12, 220, 34, 14); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '16px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(text, W / 2, 35);
    }
  });
  return () => c.stop();
}
