// 별자리: 걸어온 장면이 별이 되고, 학생이 이은 점이 금빛 선이 된다.
// 화면, 영상 녹화, 장면 카드가 모두 이 그림 하나를 쓴다.
const FONT = '"Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const TITLE = '"Gowun Batang", "Gowun Dodum", "Apple SD Gothic Neo", serif';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const snip = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n) + '…' : t; };

function layout(data, W, H) {
  const n = data.nodes.length;
  const top = H * 0.19, bottom = H * 0.95;
  const gap = n > 1 ? (bottom - top) / (n - 1) : 0;
  return data.nodes.map((nd, i) => ({
    ...nd,
    x: W / 2 + Math.sin(i * 0.82 + 0.5) * W * 0.17,
    y: bottom - i * gap, // 아래에서 위로: 길을 걸어 하늘로 오른다
    gap,
  }));
}

/**
 * @param prog 0~1. 별이 아래에서부터 하나씩 켜지고, 마지막에 선이 이어진다.
 * @param opts.night true면 밤하늘 바탕을 직접 칠한다(3D 화면 없이 그림만 쓸 때).
 */
export function drawConstel(ctx, W, H, data, prog = 1, opts = {}) {
  const u = Math.min(W / 390, H / 540);
  ctx.save();
  if (opts.night) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#12173f'); g.addColorStop(0.7, '#2c2f6e'); g.addColorStop(1, '#5a4a8a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 140; i++) {
      const r = Math.sin(i * 91.7) * 43758.5453, r2 = Math.sin(i * 17.3) * 9631.77;
      ctx.globalAlpha = 0.25 + ((i * 37) % 60) / 100;
      ctx.beginPath(); ctx.arc((r - Math.floor(r)) * W, (r2 - Math.floor(r2)) * H, (0.6 + (i % 3) * 0.35) * u, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = 'rgba(14,17,50,.5)'; ctx.fillRect(0, 0, W, H);
  }
  const pts = layout(data, W, H);
  const n = pts.length;
  const shown = clamp(prog / 0.72, 0, 1) * n; // 켜진 별의 수(소수점은 다음 별의 밝기)
  const linkProg = clamp((prog - 0.72) / 0.28, 0, 1);

  // 제목
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 8 * u;
  ctx.font = `700 ${Math.round(25 * u)}px ${TITLE}`;
  ctx.fillText(`${data.name}의 별자리`, W / 2, H * 0.075);
  ctx.font = `${Math.round(13 * u)}px ${FONT}`; ctx.fillStyle = '#ffe9a8';
  ctx.fillText(data.links.length ? `걸어온 점 ${n}개 · 이어진 선 ${data.links.length}개` : `걸어온 점 ${n}개`, W / 2, H * 0.075 + 27 * u);
  ctx.shadowBlur = 0;
  if (!n) { ctx.restore(); return; }

  // 걸어온 길
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.lineWidth = 1.6 * u;
  ctx.beginPath();
  const upto = Math.min(n - 1, Math.floor(shown));
  pts.forEach((p, i) => {
    if (i > upto) return;
    if (i === 0) ctx.moveTo(p.x, p.y);
    else { const q = pts[i - 1]; ctx.quadraticCurveTo(q.x, (q.y + p.y) / 2, p.x, p.y); }
  });
  ctx.stroke();

  // 별이 많으면 글이 겹친다. 갈림길·이어진 점·굵직한 장면부터 글을 달고, 자리가 없으면 별만 남긴다.
  const fs = opts.all ? clamp(pts[0].gap * 0.5, 10 * u, 14.5 * u) : clamp(pts[0].gap * 0.8, 12.5 * u, 15 * u);
  const linked = new Set(data.links.flatMap((l) => [l.from, l.to]));
  const MAJOR = ['care', 'values', 'highschool', 'school', 'job', 'marry', 'home', 'retire', 'customEvent', 'learn', 'last', 'remember'];
  const weight = (p, i) => (p.turning || linked.has(p.id) ? 3 : i === 0 || i === n - 1 ? 2 : MAJOR.includes(p.id) ? 1 : 0);
  const labelled = new Set();
  const used = { L: [], R: [] };
  [...pts.keys()].sort((a, b) => weight(pts[b], b) - weight(pts[a], a) || a - b).forEach((i) => {
    const side = pts[i].x < W / 2 ? 'R' : 'L';
    if (!opts.all && used[side].some((y) => Math.abs(y - pts[i].y) < fs * 1.25)) return;
    used[side].push(pts[i].y); labelled.add(i);
  });
  pts.forEach((p, i) => {
    const a = clamp(shown - i, 0, 1);
    if (a <= 0) return;
    const right = p.x < W / 2; // 글은 자리가 넓은 쪽에
    ctx.globalAlpha = a;
    // 가지 않은 길: 흐린 가지
    if (p.fork && p.others && p.others.length) {
      p.others.slice(0, 2).forEach((label, k) => {
        const dx = (right ? -1 : 1) * (26 + k * 6) * u, dy = (k ? 9 : -9) * u;
        ctx.setLineDash([3 * u, 4 * u]); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.2 * u;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dx, p.y + dy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = `${Math.round(fs * 0.82)}px ${FONT}`;
        ctx.textAlign = right ? 'right' : 'left';
        ctx.fillText(snip(label, 9), p.x + dx + (right ? -4 : 4) * u, p.y + dy);
      });
    }
    // 별
    const r = (p.turning ? 6.2 : p.final ? 5.4 : 4.2) * u;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2);
    g.addColorStop(0, p.turning ? 'rgba(255,214,120,.95)' : 'rgba(255,255,255,.95)'); g.addColorStop(0.35, p.turning ? 'rgba(255,200,110,.45)' : 'rgba(255,244,214,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.62, 0, 7); ctx.fill();
    if (p.turning) { ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 1.3 * u; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.5, 0, 7); ctx.stroke(); }
    // 글
    if (!labelled.has(i)) return;
    ctx.textAlign = right ? 'left' : 'right';
    ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = 5 * u;
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(fs)}px ${FONT}`;
    const tx = p.x + (right ? 13 : -13) * u;
    const head = `${p.age}살 `;
    const room = (right ? W - tx : tx) - 10 * u;
    const body = snip(opts.all ? (p.fork || p.turning ? p.text.split(' — ')[0] : p.text) : p.fork ? p.text.split(' — ')[0] : p.title, Math.max(6, Math.floor(room / fs) - 4));
    if (right) { ctx.fillText(head, tx, p.y); const w = ctx.measureText(head).width; ctx.font = `${Math.round(fs)}px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillText(body, tx + w, p.y); }
    else { ctx.font = `${Math.round(fs)}px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillText(body, tx, p.y); const w = ctx.measureText(body).width; ctx.font = `700 ${Math.round(fs)}px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText(head, tx - w, p.y); }
    ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1;

  // 이어진 점: 금빛 곡선
  if (linkProg > 0) {
    const by = Object.fromEntries(pts.map((p) => [p.id, p]));
    data.links.forEach((l, k) => {
      const a = by[l.from], b = by[l.to];
      if (!a || !b) return;
      const t = clamp(linkProg * 1.4 - k * 0.12, 0, 1);
      if (t <= 0) return;
      const side = (a.x + b.x) / 2 < W / 2 ? -1 : 1;
      const cx = (a.x + b.x) / 2 + side * Math.min(W * 0.22, Math.abs(a.y - b.y) * 0.32 + 30 * u), cy = (a.y + b.y) / 2;
      ctx.strokeStyle = l.color || '#ffd98a'; ctx.lineWidth = 2.2 * u; ctx.shadowColor = l.color || '#ffd98a'; ctx.shadowBlur = 10 * u;
      ctx.beginPath(); ctx.moveTo(a.x, a.y);
      const steps = 24;
      for (let i = 1; i <= Math.round(steps * t); i++) {
        const s = i / steps;
        ctx.lineTo((1 - s) * (1 - s) * a.x + 2 * (1 - s) * s * cx + s * s * b.x, (1 - s) * (1 - s) * a.y + 2 * (1 - s) * s * cy + s * s * b.y);
      }
      ctx.stroke(); ctx.shadowBlur = 0;
    });
  }
  ctx.restore();
}

function wrapText(ctx, text, maxW, maxLines) {
  const lines = [];
  let line = '';
  for (const ch of String(text).replace(/\s+/g, ' ')) {
    if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch === ' ' ? '' : ch; } else line += ch;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…'; }
  return lines;
}

/** 제출용 한 장(세로 1080×1920): 위에는 별자리, 아래에는 핵심 답. rows: [[이름, 내용]] */
export function summaryImage(data, title, by, rows) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1920;
  const ctx = c.getContext('2d');
  const top = 1080;
  drawConstel(ctx, 1080, top, data, 1, { night: true });
  ctx.fillStyle = '#fffdf8'; ctx.fillRect(0, top, 1080, 1920 - top);
  ctx.fillStyle = '#ff8f7a'; ctx.fillRect(0, top, 1080, 8);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#3a3448'; ctx.font = `700 54px ${TITLE}`;
  let y = top + 92;
  for (const l of wrapText(ctx, title, 960, 2)) { ctx.fillText(l, 60, y); y += 66; }
  ctx.fillStyle = '#6f6880'; ctx.font = `30px ${FONT}`; ctx.fillText(by, 60, y - 8); y += 44;
  const kept = rows.filter((r) => r[1]);
  const room = 1920 - 50 - y;
  const per = Math.min(150, room / Math.max(1, kept.length));
  for (const [k, v] of kept) {
    ctx.fillStyle = '#e0705c'; ctx.font = `700 27px ${FONT}`; ctx.fillText(k, 60, y);
    ctx.fillStyle = '#3a3448'; ctx.font = `34px ${FONT}`;
    let yy = y + 44;
    for (const l of wrapText(ctx, v, 960, per > 120 ? 2 : 1)) { ctx.fillText(l, 60, yy); yy += 44; }
    y += per;
  }
  return c;
}

/** 저장용 그림 한 장(세로 1080×1620). */
export function constelImage(data) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1620;
  drawConstel(c.getContext('2d'), c.width, c.height, data, 1, { night: true, all: true });
  return c;
}
