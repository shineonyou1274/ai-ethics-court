// 소리: 파일 없이 브라우저가 직접 만들어 내는 효과음과 잔잔한 배경 음악.
let ctx = null, master = null, on = true, timer = null, step = 0, nextT = 0;
try { on = localStorage.getItem('career-day-sound') !== 'off'; } catch { /* 저장이 막혀 있으면 켠 채로 둔다 */ }

function ready() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? 1 : 0; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}
function tone(f, t, len, vol = 0.14, type = 'triangle', slide = 0) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + len);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + len + 0.03);
}
const N = (n) => 261.63 * Math.pow(2, n / 12); // 가온 도에서 반음 n개 위
const SFX = {
  tap: () => [[N(12), 0, 0.07, 0.08]],
  good: () => [[N(12), 0, 0.14], [N(16), 0.08, 0.14], [N(19), 0.16, 0.25]],
  bad: () => [[N(3), 0, 0.2, 0.13, 'sine'], [N(-2), 0.16, 0.38, 0.13, 'sine']],
  coin: () => [[N(23), 0, 0.07, 0.1, 'square'], [N(28), 0.06, 0.22, 0.1, 'square']],
  loss: () => [[N(0), 0, 0.3, 0.14, 'sine', 0.6]],
  pop: () => [[N(7), 0, 0.12, 0.16, 'sine', 2.2], [N(19), 0.1, 0.12], [N(24), 0.18, 0.3]],
  fanfare: () => [[N(12), 0, 0.16], [N(16), 0.14, 0.16], [N(19), 0.28, 0.16], [N(24), 0.42, 0.5], [N(16), 0.42, 0.5, 0.08], [N(19), 0.42, 0.5, 0.08]],
};
export function sfx(name) {
  if (!on || !ready()) return;
  const t = ctx.currentTime + 0.01;
  for (const [f, d, len, vol, type, slide] of SFX[name]()) tone(f, t + d, len, vol, type, slide);
}

// 배경 음악: 네 마디를 도는 느긋한 실로폰 가락
const CHORDS = [[0, 4, 7, 12], [-3, 0, 4, 9], [-7, -3, 0, 5], [-5, -1, 2, 7]];
const TUNE = [0, 2, 3, 2, 1, 2, 3, null, 2, 3, 1, 2, 0, null, 2, null];
function schedule() {
  const beat = 0.3;
  while (nextT < ctx.currentTime + 0.25) {
    const ch = CHORDS[Math.floor(step / 16) % 4], n = TUNE[step % 16];
    if (step % 8 === 0) tone(N(ch[0] - 12), nextT, 1.6, 0.07, 'sine');
    if (n !== null) tone(N(ch[n] + 12), nextT, 0.5, 0.045, 'sine');
    if (step % 4 === 2) tone(N(ch[1]), nextT, 0.35, 0.025, 'triangle');
    nextT += beat; step++;
  }
}
export function startMusic() {
  if (!ready() || timer) return;
  nextT = ctx.currentTime + 0.1; timer = setInterval(schedule, 80);
}
export const soundOn = () => on;
export function toggleSound() {
  on = !on; try { localStorage.setItem('career-day-sound', on ? 'on' : 'off'); } catch { /* 저장 없이도 바뀐다 */ }
  if (ready()) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.05);
  return on;
}
document.addEventListener('visibilitychange', () => { if (ctx) (document.hidden ? ctx.suspend() : ctx.resume()); });
