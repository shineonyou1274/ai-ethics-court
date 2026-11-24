// 손으로 하는 장면들이 함께 쓰는 도구. 캔버스를 기준 크기(baseW × baseH)로 그리고, 화면 크기에 맞춰 늘리고 줄인다.

export function makeCanvas(el, baseW, baseH, label) {
  const cv = document.createElement('canvas');
  cv.className = 'handsCanvas';
  cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', label);
  el.append(cv);
  const ctx = cv.getContext('2d');
  let scale = 1, dpr = 1;
  function resize() {
    // 폰에서는 그림이 화면 높이의 36%를 넘지 않게 줄여서, 안내 글과 버튼이 함께 보이게 한다
    const tall = window.innerWidth < window.innerHeight * 1.1;
    const maxW = tall ? (window.innerHeight || 800) * 0.36 * baseW / baseH : 520;
    const w = Math.max(240, Math.min(el.clientWidth || 320, 520, maxW));
    scale = w / baseW; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.style.width = w + 'px'; cv.style.height = Math.round(baseH * scale) + 'px';
    cv.width = Math.round(w * dpr); cv.height = Math.round(baseH * scale * dpr);
  }
  resize();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null; ro?.observe(el);
  return {
    cv, ctx,
    begin() { ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0); ctx.clearRect(0, 0, baseW, baseH); },
    toBase(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * baseW, y: (e.clientY - r.top) / r.height * baseH }; },
    stop() { ro?.disconnect(); },
  };
}

// 화면에서 사라지면 저절로 멈추는 그리기 고리
export function loop(el, draw) {
  let last = performance.now(), alive = true;
  const tick = (now) => {
    if (!alive || !el.isConnected) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    draw(dt, now / 1000);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return () => { alive = false; };
}

// 손가락으로 끄는 동작. 캔버스 밖으로 나가도 놓을 때까지 따라간다.
export function drag(cv, toBase, { down, move, up }) {
  let id = null;
  cv.addEventListener('pointerdown', (e) => {
    if (id !== null) return;
    const p = toBase(e); if (down(p) === false) return;
    id = e.pointerId; cv.setPointerCapture?.(e.pointerId); e.preventDefault();
  });
  cv.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(toBase(e)); });
  const end = (e, cancel) => { if (e.pointerId !== id) return; id = null; up(toBase(e), cancel); };
  cv.addEventListener('pointerup', (e) => end(e, false));
  cv.addEventListener('pointercancel', (e) => end(e, true));
}

export function capsule(ctx, x1, y1, x2, y2, r) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.arc(x1, y1, r, a + Math.PI / 2, a - Math.PI / 2);
  ctx.arc(x2, y2, r, a - Math.PI / 2, a + Math.PI / 2);
  ctx.closePath();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// 선분 a→b 에서 점 p 까지의 거리
export function segDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

export const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
