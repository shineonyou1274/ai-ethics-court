// 깜박임 재기 — WCAG 2.3.1(1초에 세 번 넘게 번쩍이지 않기)을 단순하게 옮긴 검사
//
// 쓰는 법
//   1) Playwright 컨텍스트를 영상 녹화로 열고 장면을 끝까지 조작해요.
//        const ctx = await browser.newContext({ ...opt, recordVideo: { dir: 'out/' } });
//        ... 조작 ...  await ctx.close();   // 닫아야 영상이 저장돼요
//   2) node shared/tools/flicker.cjs out/*.webm      (또는 require 해서 analyzeVideo(path))
//
// 재는 법
//   - 영상(25fps)을 32×32로 줄여 프레임마다 화면 전체와 4×4 칸의 상대 휘도(0~1)를 구해요.
//   - 번쩍임 1번 = 휘도가 0.1 넘게 오르고 0.1 넘게 내려옴(어두운 쪽이 0.8 미만일 때).
//   - 어느 1초 안에서도, 어느 칸에서도 3번을 넘으면 실패.
//   - 흰 화면 = 앞뒤 프레임보다 전체 휘도가 0.3 넘게 튀어 오른 짧은(3프레임 이하) 구간.
const { execFileSync } = require('node:child_process');
const N = 32, FPS = 25;
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };

function frames(path) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-vf', `fps=${FPS},scale=${N}:${N}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 30 });
  const size = N * N * 3, out = [];
  for (let o = 0; o + size <= raw.length; o += size) {
    const cells = new Array(17).fill(0);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = o + (y * N + x) * 3, L = 0.2126 * lin(raw[i]) + 0.7152 * lin(raw[i + 1]) + 0.0722 * lin(raw[i + 2]);
      cells[((y * 4 / N) | 0) * 4 + ((x * 4 / N) | 0)] += L / (N * N / 16); cells[16] += L / (N * N);
    }
    out.push(cells);
  }
  return out;
}
function flashesPerSec(series) {
  // 마지막 꼭짓점(ext)에서 0.1 넘게 반대로 움직이면 전환 1번. 전환 2번 = 번쩍임 1번
  const trans = []; let hi = series[0], lo = series[0], ext = series[0], dir = 0;
  for (let i = 1; i < series.length; i++) {
    const v = series[i];
    if (dir === 0) {
      hi = Math.max(hi, v); lo = Math.min(lo, v);
      if (hi - v >= 0.1 && v < 0.8) { trans.push(i); dir = -1; ext = v; } else if (v - lo >= 0.1 && lo < 0.8) { trans.push(i); dir = 1; ext = v; }
      continue;
    }
    if (dir === 1) { if (v > ext) ext = v; else if (ext - v >= 0.1 && v < 0.8) { trans.push(i); dir = -1; ext = v; } }
    else { if (v < ext) ext = v; else if (v - ext >= 0.1 && ext < 0.8) { trans.push(i); dir = 1; ext = v; } }
  }
  let max = 0, at = 0;
  for (let i = 0; i < trans.length; i++) { let j = i; while (j < trans.length && trans[j] - trans[i] < FPS) j++; const n = Math.floor((j - i) / 2); if (n > max) { max = n; at = trans[i] / FPS; } }
  return { max, at };
}
function analyzeVideo(path) {
  const lum = frames(path);
  let maxFlashesPerSec = 0, worst = '-', at = 0;
  for (let k = 0; k < 17; k++) { const r = flashesPerSec(lum.map((c) => c[k])); if (r.max > maxFlashesPerSec) { maxFlashesPerSec = r.max; at = r.at; worst = k === 16 ? '전체' : `칸 ${(k / 4) | 0},${k % 4}`; } }
  const whiteAt = [];
  for (let i = 1; i < lum.length - 1; i++) for (let w = 1; w <= 3 && i + w < lum.length; w++) {
    const before = lum[i - 1][16], after = lum[i + w][16], peak = Math.min(...lum.slice(i, i + w).map((c) => c[16]));
    if (peak - before > 0.3 && peak - after > 0.3) { whiteAt.push(+(i / FPS).toFixed(2)); break; }
  }
  return { seconds: +(lum.length / FPS).toFixed(1), maxFlashesPerSec, worst, atSec: +at.toFixed(2), whiteFrames: whiteAt.length, whiteAt, pass: maxFlashesPerSec <= 3 && whiteAt.length === 0 };
}
module.exports = { analyzeVideo, flashesPerSec };
if (require.main === module) {
  let bad = 0;
  for (const p of process.argv.slice(2)) { const r = analyzeVideo(p); if (!r.pass) bad++; console.log(`${r.pass ? '✓' : '✗'} ${p}`, JSON.stringify(r)); }
  process.exit(bad ? 1 : 0);
}
