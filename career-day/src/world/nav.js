// 걸어 다니기 길 찾기: 일터 바닥을 촘촘한 칸으로 나누고, 막힌 곳(벽, 차, 가구)을 돌아가는 길을 찾는다.
// 3D(three)에 기대지 않는 계산만 있어서, 검사(test/walk.mjs)가 화면 없이 그대로 쓴다.
//
// makeNav({ bounds: [x0, x1, z0, z1], blocks: [[x0, x1, z0, z1], …], pad, step })
//   bounds  걸을 수 있는 바닥의 바깥 테두리
//   blocks  막힌 네모들(벽, 차, 가구). 사람 몸 폭(pad)만큼 넓혀서 막는다
//   돌려주는 것: blocked(x, z), path(from, to) → [{ x, z }, …] (못 가면 null), free(x, z) → 가장 가까운 걸을 수 있는 점
export function makeNav({ bounds, blocks = [], pad = 0.3, step = 0.25 }) {
  const [bx0, bx1, bz0, bz1] = bounds;
  const blocked = (x, z) => x < bx0 || x > bx1 || z < bz0 || z > bz1
    || blocks.some(([x0, x1, z0, z1]) => x > x0 - pad && x < x1 + pad && z > z0 - pad && z < z1 + pad);
  const nx = Math.floor((bx1 - bx0) / step) + 1, nz = Math.floor((bz1 - bz0) / step) + 1;
  const pt = (i, j) => ({ x: bx0 + i * step, z: bz0 + j * step });
  const grid = new Uint8Array(nx * nz); // 1 이면 막힌 칸 (한 번만 계산해 둔다)
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const p = pt(i, j); grid[j * nx + i] = blocked(p.x, p.z) ? 1 : 0; }
  const cellOf = (p) => [Math.max(0, Math.min(nx - 1, Math.round((p.x - bx0) / step))), Math.max(0, Math.min(nz - 1, Math.round((p.z - bz0) / step)))];

  // 막히지 않은 가장 가까운 칸 (누른 곳이 가구 위여도 그 앞까지는 갈 수 있게)
  function nearestCell(p) {
    const [ci, cj] = cellOf(p);
    if (!grid[cj * nx + ci]) return [ci, cj];
    for (let r = 1; r < Math.max(nx, nz); r++) {
      let best = null, bd = Infinity;
      for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
        if (i < 0 || j < 0 || i >= nx || j >= nz || grid[j * nx + i]) continue;
        const q = pt(i, j), d = Math.hypot(q.x - p.x, q.z - p.z); if (d < bd) { bd = d; best = [i, j]; }
      }
      if (best) return best;
    }
    return null;
  }
  // 두 점 사이가 곧게 트였는지 (지나는 길을 촘촘히 훑는다)
  function clear(a, b) {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (step / 2)));
    for (let k = 1; k < n; k++) { const t = k / n; if (blocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false; }
    return true;
  }
  function free(x, z) { const c = nearestCell({ x, z }); return c ? pt(c[0], c[1]) : null; }

  // 칸을 따라 가장 짧은 길(넓이 우선 탐색, 여덟 방향)을 찾고, 곧게 갈 수 있는 곳은 이어서 꺾이는 점만 남긴다
  function path(from, to) {
    const s = nearestCell(from), e = nearestCell(to); if (!s || !e) return null;
    const key = (i, j) => j * nx + i, sk = key(...s), ek = key(...e);
    const prev = new Int32Array(nx * nz).fill(-2); prev[sk] = -1;
    const queue = new Int32Array(nx * nz); let head = 0, tail = 0; queue[tail++] = sk;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    while (head < tail) {
      const k = queue[head++]; if (k === ek) break;
      const i = k % nx, j = (k - i) / nx;
      for (const [di, dj] of dirs) {
        const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
        const nk = key(a, b); if (prev[nk] !== -2 || grid[nk]) continue;
        if (di && dj && (grid[key(a, j)] || grid[key(i, b)])) continue; // 모서리를 비스듬히 가로지르지 않는다
        prev[nk] = k; queue[tail++] = nk;
      }
    }
    if (prev[ek] === -2) return null;
    const cells = []; for (let k = ek; k !== -1; k = prev[k]) cells.push(pt(k % nx, Math.floor(k / nx)));
    cells.reverse();
    const end = blocked(to.x, to.z) ? cells[cells.length - 1] : { x: to.x, z: to.z };
    const pts = [{ x: from.x, z: from.z }, ...cells.slice(1, -1), end];
    // 곧게 이을 수 있는 점은 건너뛴다
    const out = [pts[0]]; let a = 0;
    while (a < pts.length - 1) { let b = pts.length - 1; while (b > a + 1 && !clear(pts[a], pts[b])) b--; out.push(pts[b]); a = b; }
    return out.slice(1);
  }
  return { blocked, path, free, bounds, blocks };
}

// 길의 길이 (검사와 걷는 시간 계산에 쓴다)
export const pathLength = (from, pts) => pts.reduce((sum, p, k) => { const a = k ? pts[k - 1] : from; return sum + Math.hypot(p.x - a.x, p.z - a.z); }, 0);
