// 손 위생: 여섯 단계마다 손 그림 위의 균을 손가락으로 문질러 지운다.
// 등급 — thorough: 여섯 단계를 다 함 / rushed: 중간에 서둘러 나감
import { makeCanvas, loop, drag, capsule, roundRect, segDist } from './util.js';

const W = 320, H = 290, CX = 160;
const FX = [-45, -15, 15, 45].map((x) => CX + x); // 손가락 네 개의 가운데
const TOP = [66, 46, 52, 78];                       // 손가락 끝의 높이
const THUMB = [{ x: CX - 54, y: 206 }, { x: CX - 100, y: 154 }];

const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const STEPS = [
  { name: '손바닥', how: '손바닥과 손바닥을 마주 대고 문질러요.', back: false,
    germs: [-40, -13, 14, 40].flatMap((x, i) => [165, 212].map((y, j) => ({ x: CX + x + (j ? 4 : -3), y: y + (i % 2 ? 6 : 0) }))) },
  { name: '손등', how: '손바닥으로 다른 손의 손등을 감싸 문질러요.', back: true,
    germs: [...[-38, -10, 18, 42].flatMap((x, i) => [160, 204].map((y) => ({ x: CX + x, y: y - (i % 2 ? 6 : 0) }))), { x: CX, y: 236 }] },
  { name: '손가락 사이', how: '손가락을 깍지 껴서 사이사이를 문질러요.', back: false,
    germs: [-30, 0, 30].flatMap((x) => [106, 128].map((y) => ({ x: CX + x, y }))) },
  { name: '손가락 마디', how: '두 손을 맞잡고 손가락 마디를 문질러요.', back: true,
    germs: [...FX.map((x) => ({ x, y: 122 })), { x: FX[1], y: 92 }, { x: FX[2], y: 98 }] },
  { name: '엄지', how: '엄지를 다른 손으로 감싸 돌려 가며 문질러요.', back: false,
    germs: [0.05, 0.35, 0.65, 0.95].map((t) => lerp(THUMB[0], THUMB[1], t)) },
  { name: '손끝', how: '손끝을 반대쪽 손바닥에 대고 손톱 밑까지 문질러요.', back: false,
    germs: [...FX.map((x, i) => ({ x, y: TOP[i] + 4 })), { x: THUMB[1].x - 2, y: THUMB[1].y - 4 }] },
];

function drawHand(ctx, back, t) {
  const skin = back ? '#eab996' : '#f4cbab', line = '#c98f6c';
  ctx.lineWidth = 2.2; ctx.strokeStyle = line; ctx.fillStyle = skin;
  // 소매
  ctx.fillStyle = '#ffffff'; roundRect(ctx, CX - 54, 250, 108, 44, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skin;
  FX.forEach((x, i) => { capsule(ctx, x, TOP[i], x, 150, 14); ctx.fill(); ctx.stroke(); });
  capsule(ctx, THUMB[0].x, THUMB[0].y, THUMB[1].x, THUMB[1].y, 15); ctx.fill(); ctx.stroke();
  roundRect(ctx, CX - 63, 132, 126, 124, 34); ctx.fill(); ctx.stroke();
  // 손가락 뿌리를 손바닥과 이어 보이게
  ctx.fillStyle = skin; ctx.fillRect(CX - 58, 128, 116, 12);
  ctx.strokeStyle = line; ctx.lineWidth = 1.4;
  if (back) {
    FX.forEach((x, i) => {
      ctx.fillStyle = '#f7dccd'; roundRect(ctx, x - 8, TOP[i] - 6, 16, 17, 6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, 122, 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, TOP[i] + 30, 5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    });
    ctx.fillStyle = '#f7dccd'; roundRect(ctx, THUMB[1].x - 9, THUMB[1].y - 9, 16, 15, 6); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(CX - 46, 168); ctx.quadraticCurveTo(CX, 186 + Math.sin(t) * 0.5, CX + 50, 160); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CX - 40, 196); ctx.quadraticCurveTo(CX - 6, 230, CX + 6, 246); ctx.stroke();
    FX.forEach((x, i) => { ctx.beginPath(); ctx.moveTo(x - 7, TOP[i] + 40); ctx.lineTo(x + 7, TOP[i] + 40); ctx.stroke(); });
  }
}

function drawGerm(ctx, g, t) {
  const wob = Math.sin(t * 5 + g.x) * 1.4, r = 9;
  ctx.fillStyle = '#7cb342'; ctx.strokeStyle = '#4e7d23'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let k = 0; k <= 10; k++) {
    const a = (k / 10) * Math.PI * 2, rr = r + Math.sin(a * 3 + t * 4 + g.y) * 1.6;
    const px = g.x + Math.cos(a) * rr, py = g.y + wob + Math.sin(a) * rr;
    k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(g.x - 3, g.y + wob - 2, 2.6, 0, 7); ctx.arc(g.x + 3.4, g.y + wob - 2, 2.6, 0, 7); ctx.fill();
  ctx.fillStyle = '#263c52'; ctx.beginPath(); ctx.arc(g.x - 2.6, g.y + wob - 1.6, 1.2, 0, 7); ctx.arc(g.x + 3.8, g.y + wob - 1.6, 1.2, 0, 7); ctx.fill();
}

export function scrub(el, sc, { sfx, act, done }) {
  el.innerHTML = `<div class="handsHead"><b id="hsStep"></b><span id="hsHow"></span></div>
    <div class="handsStage"></div>
    <div class="handsFoot"><div class="meter"><i id="hsBar"></i></div><span id="hsTime">문지른 시간 0초</span></div>
    <button class="btn ghost" id="hsSkip" hidden>여기까지만 하고 서둘러 회진 나가기</button>`;
  const stage = el.querySelector('.handsStage');
  const c = makeCanvas(stage, W, H, '손 그림. 초록 균 위를 손가락으로 문질러 지워요.');
  let step = 0, rubbed = 0, moving = 0, last = null, finished = false, shift = 0;
  const germs = () => STEPS[step].germs;
  let state = STEPS.map((s) => s.germs.map(() => ({ clean: false, pop: 0 })));
  const foam = [];

  function paintHead() {
    const s = STEPS[step];
    el.querySelector('#hsStep').textContent = `${step + 1} / ${STEPS.length} · ${s.name}`;
    el.querySelector('#hsHow').textContent = s.how;
    const total = STEPS.reduce((a, x) => a + x.germs.length, 0);
    const clean = state.flat().filter((g) => g.clean).length;
    el.querySelector('#hsBar').style.width = Math.round(clean / total * 100) + '%';
    el.querySelector('#hsSkip').hidden = step < 1 || finished;
  }
  paintHead();

  function finish(grade) {
    if (finished) return; finished = true;
    el.querySelector('#hsSkip').hidden = true;
    done(grade, { steps: grade === 'thorough' ? STEPS.length : step, seconds: Math.round(rubbed) });
  }

  drag(c.cv, c.toBase, {
    down(p) { if (finished || shift > 0) return false; last = p; },
    move(p) {
      if (!last) return;
      const moved = Math.hypot(p.x - last.x, p.y - last.y);
      if (moved > 1.5) { moving = 0.15; if (Math.random() < 0.7) foam.push({ x: p.x + (Math.random() - 0.5) * 16, y: p.y + (Math.random() - 0.5) * 16, r: 4 + Math.random() * 7, life: 1 }); }
      germs().forEach((g, k) => {
        const st = state[step][k];
        if (!st.clean && segDist(g, last, p) < 21) { st.clean = true; st.pop = 1; sfx('tap'); }
      });
      last = p;
      if (state[step].every((g) => g.clean) && shift === 0) {
        if (step === STEPS.length - 1) { paintHead(); act('work'); return finish('thorough'); }
        shift = 0.9; act('work');
      }
      paintHead();
    },
    up() { last = null; },
  });
  el.querySelector('#hsSkip').addEventListener('click', () => finish('rushed'));

  loop(el, (dt, t) => {
    if (moving > 0) { moving -= dt; rubbed += dt; el.querySelector('#hsTime').textContent = `문지른 시간 ${Math.floor(rubbed)}초`; }
    if (shift > 0) { shift -= dt; if (shift <= 0) { shift = 0; step++; foam.length = 0; paintHead(); } }
    const ctx = c.ctx; c.begin();
    ctx.fillStyle = '#e7f2f1'; roundRect(ctx, 0, 0, W, H, 18); ctx.fill();
    // 물방울 무늬 배경
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc((k * 73 + t * 12) % W, 30 + (k * 41) % (H - 40), 3 + (k % 3), 0, 7); ctx.fill(); }
    drawHand(ctx, STEPS[step].back, t);
    germs().forEach((g, k) => {
      const st = state[step][k];
      if (!st.clean) drawGerm(ctx, g, t);
      else if (st.pop > 0) {
        st.pop -= dt * 2;
        ctx.strokeStyle = `rgba(120,190,220,${Math.max(0, st.pop)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(g.x, g.y, 10 + (1 - st.pop) * 14, 0, 7); ctx.stroke();
      }
    });
    for (let k = foam.length - 1; k >= 0; k--) {
      const f = foam[k]; f.life -= dt * 0.45; if (f.life <= 0) { foam.splice(k, 1); continue; }
      ctx.fillStyle = `rgba(255,255,255,${f.life * 0.85})`; ctx.strokeStyle = `rgba(160,200,215,${f.life * 0.6})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); ctx.stroke();
    }
    if (shift > 0) {
      ctx.fillStyle = 'rgba(38,60,82,.78)'; roundRect(ctx, 60, 12, 200, 40, 16); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '17px Jua, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`✓ ${STEPS[step].name} · 다음은 ${STEPS[step + 1].name}`, CX, 39);
    }
    if (finished) {
      ctx.fillStyle = 'rgba(63,157,125,.85)'; roundRect(ctx, 70, 12, 180, 40, 16); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '17px Jua, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(state.flat().every((g) => g.clean) ? '✓ 여섯 단계 끝!' : '손을 털고 나가요', CX, 39);
    }
  });
  return () => c.stop();
}

