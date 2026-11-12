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

function tick() {
  if (!on) return;
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
        if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination); }
        ctx.resume(); tick();
      } catch (e) { on = false; }
    }
    return on;
  },
  /** 완성 영상을 미리 볼 때 배경 소리가 겹치지 않게 잠시 줄인다. */
  previewMute(v) { if (master) master.gain.value = v ? 0 : 0.6; },
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
