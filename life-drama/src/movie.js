// 감상 화면: 쓴 장면들이 자막과 함께 영상처럼 이어진다.
// 같은 재생을 그대로 녹화해 동영상으로, 장면마다 멈춰 찍어 카드 이미지로 내보낸다.
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const FONT = '"Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const TITLE = '"Gowun Batang", "Gowun Dodum", "Apple SD Gothic Neo", serif';

function wrap(ctx, text, maxW, maxLines) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const ch of para) {
      if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch === ' ' ? '' : ch; } else line += ch;
    }
    lines.push(line);
  }
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,2}$/, '…'); }
  return lines;
}

function cover(ctx, src, W, H) {
  const s = Math.max(W / src.width, H / src.height);
  const w = src.width * s, h = src.height * s;
  ctx.drawImage(src, (W - w) / 2, (H - h) / 2, w, h);
}

export function createMovie({ world, $, getData, stage, onOpen, onClose, onVideo, toast }) {
  let segs = [], total = 0, t = 0, playing = false, open = false, stageKey = '', jumped = true;
  let cap = { mode: 'none' }, shownCap = '';
  let rec = null;
  let speed = 1;

  function plan() {
    const { scenes } = getData();
    segs = [];
    let time = 0;
    let pos = scenes[0].dist - 14;
    const push = (dur, d1, o) => { segs.push({ t0: time, t1: time + dur, d0: pos, d1, ...o }); time += dur; pos = d1; };
    push(4, pos + 9, { kind: 'intro', si: 0 });
    scenes.forEach((sc, k) => {
      const arrive = sc.dist - 2;
      if (arrive > pos + 1) push(clamp((arrive - pos) / 12, 1.6, 3.2), arrive, { kind: 'travel', si: k });
      const H = clamp(3.4 + (sc.text.length + (sc.prep ? sc.prep.length + 8 : 0)) / 10, 4.8, 12);
      push(H, pos + (sc.final ? 0.5 : Math.min(6, H * 0.85)), { kind: 'scene', si: k });
    });
    const last = scenes[scenes.length - 1];
    if (last.final) push(8.5, pos, { kind: 'finale', si: scenes.length - 1 });
    push(8, pos, { kind: 'end', si: scenes.length - 1 });
    total = time;
  }

  function applySeg(seg) {
    const { S, scenes } = getData();
    const sc = scenes[seg.si];
    const arrived = seg.kind !== 'travel' && seg.kind !== 'intro';
    const key = sc.i + (arrived ? 1 : 0) + '';
    if (key !== stageKey) { stage(sc.i + (arrived ? 1 : 0), { instant: jumped }); stageKey = key; }
    world.setWeather(seg.kind === 'intro' ? 'clear' : sc.weather);
    world.setFinale(seg.kind === 'finale' || (seg.kind === 'end' && sc.final));
    world.setCamera(seg.kind === 'intro' ? 'title' : seg.kind === 'travel' ? 'walk' : seg.kind === 'finale' || seg.kind === 'end' ? 'finale' : sc.final ? 'front' : ['card', 'front', 'walk'][seg.si % 3]);
    if (seg.kind === 'intro') cap = { mode: 'big', title: S.title || `${S.name}의 인생 드라마`, sub: `주연 ${S.name}` };
    else if (seg.kind === 'scene') cap = t - seg.t0 > 0.5 ? { mode: 'scene', tag: `${sc.age}살 · ${sc.title}`, text: sc.text, prep: sc.prep ? `지금 준비할 것 · ${sc.prep}` : '' } : { mode: 'none' };
    else if (seg.kind === 'end') {
      const rem = S.a.remember && S.a.remember.text, step = S.a.step && S.a.step.text;
      cap = { mode: 'big', title: rem ? `“${rem}”` : (S.title || '인생 드라마'), sub: [rem ? `${S.name}, 그렇게 기억되고 싶은 사람` : '', `그리고 지금, ${S.now}살.`, step ? `이번 주의 한 걸음 · ${step}` : ''].filter(Boolean).join('\n') };
    } else cap = { mode: 'none' };
  }

  function showCap() {
    const key = JSON.stringify(cap);
    if (key === shownCap) return;
    shownCap = key;
    $('mvBig').hidden = cap.mode !== 'big';
    $('mvCap').hidden = cap.mode !== 'scene';
    if (cap.mode === 'big') { $('mvBigTitle').textContent = cap.title; $('mvBigSub').textContent = cap.sub; }
    if (cap.mode === 'scene') { $('mvTag').textContent = cap.tag; $('mvText').textContent = cap.text; $('mvPrep').textContent = cap.prep; $('mvPrep').hidden = !cap.prep; }
  }

  function drawCap(ctx, W, H) {
    const u = W / 720; // 720 폭 기준 배율
    if (cap.mode === 'big') {
      ctx.fillStyle = 'rgba(27,23,48,.42)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(58 * u)}px ${TITLE}`;
      const tl = wrap(ctx, cap.title, W - 100 * u, 4);
      ctx.font = `${Math.round(27 * u)}px ${FONT}`;
      const sl = wrap(ctx, cap.sub, W - 110 * u, 6);
      let y = H / 2 - (tl.length * 74 * u + sl.length * 42 * u) / 2 + 30 * u;
      ctx.font = `700 ${Math.round(58 * u)}px ${TITLE}`;
      for (const l of tl) { ctx.fillText(l, W / 2, y); y += 74 * u; }
      y += 10 * u;
      ctx.font = `${Math.round(27 * u)}px ${FONT}`;
      for (const l of sl) { ctx.fillText(l, W / 2, y); y += 42 * u; }
      return;
    }
    if (cap.mode !== 'scene') return;
    const g = ctx.createLinearGradient(0, H * 0.5, 0, H);
    g.addColorStop(0, 'rgba(27,23,48,0)'); g.addColorStop(1, 'rgba(27,23,48,.72)');
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.5, W, H * 0.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const pad = 40 * u, lh = 50 * u;
    ctx.font = `${Math.round(36 * u)}px ${FONT}`;
    const lines = wrap(ctx, cap.text, W - pad * 2, 7);
    let y = H - 56 * u - (cap.prep ? 46 * u : 0) - lines.length * lh;
    ctx.font = `700 ${Math.round(25 * u)}px ${FONT}`;
    const tw = ctx.measureText(cap.tag).width + 36 * u;
    ctx.fillStyle = '#fffdf8'; ctx.beginPath(); ctx.roundRect(pad, y - 60 * u, tw, 44 * u, 22 * u); ctx.fill();
    ctx.fillStyle = '#4a3f58'; ctx.fillText(cap.tag, pad + 18 * u, y - 29 * u);
    ctx.fillStyle = '#fff'; ctx.font = `${Math.round(36 * u)}px ${FONT}`;
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 10 * u;
    y += 34 * u;
    for (const l of lines) { ctx.fillText(l, pad, y); y += lh; }
    if (cap.prep) { ctx.fillStyle = '#ffe9a8'; ctx.font = `${Math.round(25 * u)}px ${FONT}`; ctx.fillText(wrap(ctx, cap.prep, W - pad * 2, 1)[0], pad, y + 4 * u); }
    ctx.shadowBlur = 0;
  }

  function tick(dt) {
    if (!open) return;
    if (playing) t += dt * speed;
    if (t >= total) {
      t = total; playing = false; $('mvPlay').textContent = '↺';
      if (rec) stopRec(true);
    }
    const seg = segs.find((s) => t < s.t1) || segs[segs.length - 1];
    applySeg(seg);
    const k = clamp((t - seg.t0) / (seg.t1 - seg.t0), 0, 1);
    const d = lerp(seg.d0, seg.d1, k);
    if (jumped) { world.jump(d); jumped = false; }
    world.setDist(d, playing && seg.kind !== 'finale' && seg.kind !== 'end');
    showCap();
    $('mvFill').style.width = (t / total) * 100 + '%';
    if (rec) { cover(rec.ctx, world.canvas, rec.W, rec.H); drawCap(rec.ctx, rec.W, rec.H); }
  }

  function startRec() {
    const gl = world.canvas;
    const portrait = gl.height >= gl.width;
    const W = portrait ? 720 : 1280, H = portrait ? 1280 : 720;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const types = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    const mime = types.find((x) => MediaRecorder.isTypeSupported(x));
    const mr = new MediaRecorder(c.captureStream(30), { mimeType: mime, videoBitsPerSecond: 5000000 });
    const chunks = [];
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec = { ctx, W, H, mr, chunks, mime, keep: false };
    mr.onstop = () => { const r = rec; rec = null; if (r && r.keep) onVideo(new Blob(r.chunks, { type: r.mime.split(';')[0] }), r.mime.includes('mp4') ? 'mp4' : 'webm'); };
    mr.start(1000);
  }
  function stopRec(keep) {
    if (!rec) return;
    rec.keep = keep;
    $('mvRec').hidden = true; $('movie').classList.remove('rec');
    const r = rec;
    setTimeout(() => { try { r.mr.stop(); } catch (e) { rec = null; } }, keep ? 500 : 0);
  }

  function seekScene(delta) {
    const cur = segs.find((s) => t < s.t1) || segs[segs.length - 1];
    const scenesSegs = segs.filter((s) => s.kind === 'scene');
    let i = scenesSegs.findIndex((s) => s.si === cur.si);
    if (cur.kind === 'intro') i = -1;
    i = clamp(i + delta, 0, scenesSegs.length - 1);
    t = scenesSegs[i].t0 + 0.01; jumped = true; stageKey = '';
    playing = true; $('mvPlay').textContent = 'Ⅱ';
  }

  $('mvPlay').onclick = () => {
    if (t >= total) { t = 0; jumped = true; stageKey = ''; playing = true; } else playing = !playing;
    $('mvPlay').textContent = playing ? 'Ⅱ' : '▶';
  };
  $('mvSpeed').onclick = () => { speed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1; $('mvSpeed').textContent = speed + '배'; };
  $('mvPrev').onclick = () => seekScene(-1);
  $('mvNext').onclick = () => seekScene(1);
  $('mvClose').onclick = () => api.close();

  const api = {
    get open() { return open; },
    canRecord() { return typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream; },
    play({ record = false } = {}) {
      if (!getData().scenes.length) { toast('아직 쓴 장면이 없어. 질문에 답하면 장면이 생겨.'); return; }
      if (record && !api.canRecord()) { toast('이 브라우저는 영상 저장이 안 돼. 장면 카드로 저장해 줘.'); return; }
      plan();
      onOpen();
      if (record) { speed = 1; $('mvSpeed').textContent = '1배'; }
      open = true; t = 0; playing = true; jumped = true; stageKey = ''; shownCap = '';
      world.state.ageOverride = null; world.state.labels = true;
      world.setInset(0, 0);
      $('movie').hidden = false; $('mvPlay').textContent = 'Ⅱ';
      $('mvRec').hidden = !record; $('movie').classList.toggle('rec', record);
      world.state.onFrame = tick;
      if (record) startRec();
    },
    close() {
      if (!open) return;
      stopRec(false);
      open = false; world.state.onFrame = null;
      $('movie').hidden = true;
      world.setFinale(false);
      onClose();
    },

    /** 장면마다 멈춰서 찍은 카드 이미지를 만든다. */
    async cards(onProgress) {
      const { S, scenes } = getData();
      const frames = (n) => new Promise((res) => { let c = 0; world.state.onFrame = () => { if (++c >= n) { world.state.onFrame = null; res(); } }; });
      const W = 1080, H = 1350;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      const out = [];
      const shoot = async (name, draw) => {
        await frames(4);
        ctx.shadowBlur = 0;
        cover(ctx, world.canvas, W, H);
        draw();
        const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.9));
        out.push({ name, url: URL.createObjectURL(blob), blob });
        if (onProgress) onProgress(out.length, scenes.length + 1);
      };
      world.setInset(0, 0); world.setFinale(false);
      world.state.ageOverride = null; world.state.labels = true;
      // 표지
      const first = scenes.find((s) => s.act >= 2) || scenes[0];
      stage(first.i + 1, { instant: true }); world.setWeather('clear'); world.setCamera('front'); world.jump(first.dist + 1);
      await shoot('00_표지.jpg', () => { cap = { mode: 'big', title: S.title || `${S.name}의 인생 드라마`, sub: `주연 ${S.name}` }; drawCap(ctx, W, H); });
      for (let k = 0; k < scenes.length; k++) {
        const sc = scenes[k];
        stage(sc.i + 1, { instant: true });
        world.setWeather(sc.weather); world.setCamera(sc.final ? 'front' : ['card', 'front', 'walk'][k % 3]); world.jump(sc.dist + 1);
        await shoot(`${String(k + 1).padStart(2, '0')}_${sc.age}살_${sc.title}.jpg`, () => {
          cap = { mode: 'scene', tag: `${sc.age}살 · ${sc.title}`, text: sc.text, prep: sc.prep ? `지금 준비할 것 · ${sc.prep}` : '' };
          drawCap(ctx, W, H);
        });
      }
      cap = { mode: 'none' };
      return out;
    },
  };
  return api;
}
