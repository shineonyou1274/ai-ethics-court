// 잔잔한 배경 소리. 파일 없이 브라우저에서 바로 만든다.
let ctx = null, master = null, timer = 0, on = false, mood = 0;
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];

function note(freq, when, len, vol, type = 'sine') {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(vol, when + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, when + len);
  o.connect(g).connect(master);
  o.start(when); o.stop(when + len + 0.05);
}

// 내 음악: 파일을 고르거나, 같은 폴더에 bgm.mp3를 두면 만든 소리 대신 그 곡이 흐른다.
let track = null, trackNode = null, trackName = '';
function ensureCtx() {
  if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination); }
  ctx.resume();
}
function setTrack(url, name, routed) {
  if (track) { track.pause(); if (trackNode) { try { trackNode.disconnect(); } catch (e) { /* 이미 끊김 */ } } }
  track = null; trackNode = null; trackName = '';
  if (!url) return;
  const el = new Audio(url);
  el.loop = true; el.preload = 'auto'; el.volume = 0.7;
  track = el; trackName = name;
  if (routed) {
    // 녹화에 함께 담기도록 소리 줄기에 잇는다(같은 출처의 파일만 가능)
    try { ensureCtx(); trackNode = ctx.createMediaElementSource(el); trackNode.connect(master); el.volume = 1; } catch (e) { trackNode = null; }
  }
  if (on) { clearTimeout(timer); el.play().catch(() => {}); }
}

function tick() {
  if (!on || track) return;
  const t = ctx.currentTime;
  const base = 261.63 * Math.pow(2, -mood * 0.42);
  const n = SCALE[Math.floor(Math.random() * SCALE.length)];
  note(base * Math.pow(2, n / 12), t, 2.4, 0.07, 'triangle');
  if (Math.random() < 0.4) note(base * Math.pow(2, (n + 7) / 12), t + 0.28, 2.0, 0.04);
  if (Math.random() < 0.3) { note(base / 2, t, 5, 0.05); note((base / 2) * 1.5, t, 5, 0.035); }
  timer = setTimeout(tick, 700 + Math.random() * 900 + mood * 500);
}

export const audio = {
  get on() { return on; },
  toggle(v) {
    on = v === undefined ? !on : v;
    clearTimeout(timer);
    if (on) {
      try {
        ensureCtx();
        if (track) track.play().catch(() => {}); else tick();
      } catch (e) { on = false; }
    } else if (track) track.pause();
    return on;
  },
  get trackName() { return trackName; },
  /** 학생이나 선생님이 고른 음악 파일을 배경으로 쓴다. null이면 만든 소리로 돌아간다. */
  useFile(file) {
    if (!file) { setTrack(null); if (on) tick(); return; }
    setTrack(URL.createObjectURL(file), file.name, true);
  },
  /** 같은 폴더에 bgm.mp3가 있으면 그 곡을 쓴다. 없으면 조용히 넘어간다. */
  probe() {
    const el = new Audio();
    el.preload = 'metadata';
    el.oncanplay = () => { if (!track) setTrack('bgm.mp3', 'bgm.mp3', /^https?:/.test(location.protocol)); };
    el.onerror = () => {};
    el.src = 'bgm.mp3';
  },
  /** 완성 영상을 미리 볼 때 배경 소리가 겹치지 않게 잠시 줄인다. */
  previewMute(v) { if (master) master.gain.value = v ? 0 : 0.6; if (track && !trackNode) track.volume = v ? 0 : 0.7; },
  /** 녹화에 넣을 소리 줄기. 다 쓰면 release()로 끊는다. */
  recordAudio() {
    if (!on || !ctx || !master || typeof ctx.createMediaStreamDestination !== 'function') return null;
    const dest = ctx.createMediaStreamDestination();
    master.connect(dest);
    let released = false;
    return {
      stream: dest.stream,
      release() {
        if (released) return;
        released = true;
        try { master.disconnect(dest); } catch (e) { /* 이미 끊김 */ }
        dest.stream.getTracks().forEach((t) => t.stop());
      },
    };
  },
  /** 0(새벽) ~ 1(별밤). 밤이 될수록 낮고 느려진다. */
  setMood(m) { mood = Math.min(1, Math.max(0, m)); },
};
