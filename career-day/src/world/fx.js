// 불과 물의 효과: 가까이 보기 무대(world/closeups.js)가 쓴다.
// 약속 (shared/CHECKLIST.md A5·A10·A13, B2~B5)
//   - 빛은 부드럽게만 오르내린다. 무작위 값을 프레임마다 그대로 쓰지 않고, 느린 물결(sin) 둘을 섞어 쓴다. 가장 빠른 물결도 1초에 한 번을 넘지 않는다.
//   - 입자 수에는 상한(FX_MAX)이 있다. 미리 만들어 둔 것을 돌려 쓰고, 넘치면 새로 만들지 않는다.
//   - 기기 설정이 '동작 줄이기'면 흔들림과 입자를 멈추거나 줄인다. 그래도 불이 줄고 물이 닿는 것은 보인다.
import * as T from 'three';
import { reduced } from './kit.js';

export const FX_MAX = reduced
  ? { sparks: 0, smoke: 3, drops: 0, splash: 0, steam: 0, wet: 20 }
  : { sparks: 16, smoke: 9, drops: 48, splash: 24, steam: 7, wet: 26 };

// 느리게 이어지는 물결 (-1 ~ 1). k 를 달리하면 서로 엇갈린다.
const wave = (t, k, speed = 1) => Math.sin(t * 1.7 * speed + k * 2.3) * 0.6 + Math.sin(t * 2.9 * speed + k * 1.1) * 0.4;
const basic = (color, opacity = 1, extra = {}) => new T.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, ...extra });
const BALL = new T.SphereGeometry(1, 10, 8);

// 불꽃 한 겹: 아래는 노랑, 가운데는 주황, 끝은 빨강
function flameGeometry() {
  const g = new T.ConeGeometry(1, 1, 12, 6, true); g.translate(0, 0.5, 0);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  const a = new T.Color('#ffe27a'), b = new T.Color('#f6a03c'), c = new T.Color('#e2513a'), o = new T.Color();
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < 0.45) o.copy(a).lerp(b, y / 0.45); else o.copy(b).lerp(c, (y - 0.45) / 0.55); col.set([o.r, o.g, o.b], i * 3); }
  g.setAttribute('color', new T.BufferAttribute(col, 3)); return g;
}

// 불: spots = [{ x, y, z, s }] 자리마다 세 겹의 불꽃. set(i, 0~1) 로 자리마다 남은 불을 알려 주면 불꽃·불티·빛·연기가 함께 줄어든다.
export function makeFire(g, spots, { smokeAt } = {}) {
  const geo = flameGeometry();
  const mats = [new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.72, depthWrite: false, side: T.DoubleSide }), new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, side: T.DoubleSide }), basic('#fff0b0', 0.9)];
  const LAYER = [[0.2, 0.58], [0.135, 0.44], [0.07, 0.26]]; // 겹마다 [굵기, 높이]
  const fires = spots.map((sp, i) => {
    const root = new T.Group(); root.position.set(sp.x, sp.y, sp.z); g.add(root);
    const layers = LAYER.map(([r, h], k) => { const m = new T.Mesh(geo, mats[k]); m.renderOrder = 4 + k; root.add(m); return { m, r: r * (sp.s || 1), h: h * (sp.s || 1) }; });
    return { root, layers, k: i, target: 1, lvl: 1 };
  });
  const cx = spots.reduce((a, s) => a + s.x, 0) / spots.length, cz = spots.reduce((a, s) => a + s.z, 0) / spots.length, cy = spots[0].y;
  const light = new T.PointLight('#ffa64d', 0, 7, 1.4); light.position.set(cx, cy + 0.7, cz + 0.5); g.add(light);
  const glow = new T.Mesh(new T.CircleGeometry(1.5, 32), basic('#ff9a3d', 0, { blending: T.AdditiveBlending })); glow.rotation.x = -Math.PI / 2; glow.position.set(cx, 0.03, cz + 0.2); glow.renderOrder = 1; g.add(glow);
  const sparkMat = basic('#ffc35a', 0.95);
  const sparks = Array.from({ length: FX_MAX.sparks }, () => { const m = new T.Mesh(BALL, sparkMat); m.visible = false; m.renderOrder = 7; g.add(m); return { m, life: 0 }; });
  const smoke = Array.from({ length: FX_MAX.smoke }, (_, i) => { const m = new T.Mesh(BALL, basic('#b4b1ab', 0)); m.visible = false; m.renderOrder = 3; g.add(m); return { m, life: 0, age: 0, k: i }; });
  let ember = 0, dens = 0.8, spawnS = 0, spawnK = 0, n = 0;
  const sp0 = smokeAt || [cx, cy + 0.5, cz];
  const total = () => fires.reduce((a, f) => a + f.lvl, 0) / fires.length;
  return {
    set(i, v) { fires[i].target = Math.max(0, Math.min(1, v)); },
    setEmber(v) { ember = v; },
    level: total,
    near(x, z, r = 0.55) { let m = 0; fires.forEach((f, i) => { if (Math.hypot(spots[i].x - x, spots[i].z - z) < r) m = Math.max(m, f.lvl); }); return m; },
    tick(dt, t) {
      for (const f of fires) {
        f.lvl += (f.target - f.lvl) * Math.min(1, dt * 3.5);
        const on = f.lvl > 0.03; f.root.visible = on; if (!on) continue;
        f.layers.forEach((L, k) => {
          const w = reduced ? 0 : wave(t, f.k + k * 0.7), w2 = reduced ? 0 : wave(t, f.k * 1.9 + k + 5, 0.8);
          L.m.scale.set(L.r * (0.65 + 0.35 * f.lvl), L.h * f.lvl * (1 + w * 0.16), L.r * (0.65 + 0.35 * f.lvl));
          L.m.rotation.z = w * 0.2; L.m.rotation.x = w2 * 0.14;
        });
      }
      const lv = total();
      // 주변을 비추는 빛: 불이 줄면 함께 약해진다. 흔들림은 느린 물결로 ±7%.
      light.intensity = 3.2 * lv * (1 + (reduced ? 0 : wave(t, 3, 0.55) * 0.07));
      glow.material.opacity = 0.07 * lv;
      // 불티
      spawnK += dt * 7 * lv;
      for (const s of sparks) {
        if (s.life <= 0) {
          if (spawnK < 1) continue; spawnK -= 1; n++;
          const f = fires[n % fires.length]; if (f.lvl < 0.15) continue;
          const sp = spots[f.k]; s.life = s.max = 0.9 + ((n * 37) % 10) / 20; s.vx = Math.sin(n * 2.4) * 0.25; s.vz = Math.cos(n * 1.7) * 0.15; s.vy = 0.9 + ((n * 13) % 10) / 20;
          s.m.position.set(sp.x + Math.sin(n) * 0.1, sp.y + 0.3 * f.lvl, sp.z); s.m.visible = true;
        }
        s.life -= dt; s.m.position.x += s.vx * dt + Math.sin(t * 3 + s.vy * 9) * 0.004; s.m.position.y += s.vy * dt; s.m.position.z += s.vz * dt;
        s.m.scale.setScalar(0.03 * Math.max(0, s.life / s.max)); if (s.life <= 0) s.m.visible = false;
      }
      // 연기: 불이 있으면 짙고, 불씨만 남으면 가늘게, 다 끄면 서서히 옅어진다
      const want = lv > 0.04 ? 0.45 + 0.55 * lv : ember > 0.02 ? 0.32 : 0;
      dens += (want - dens) * Math.min(1, dt * (want < dens ? 0.6 : 2));
      spawnS += dt * (reduced ? 0.6 : 2.4);
      for (const p of smoke) {
        if (p.life <= 0) {
          if (spawnS < 1 || dens < 0.05) { p.m.visible = false; continue; } spawnS -= 1;
          p.life = p.max = reduced ? 5 : 3.4; p.x = sp0[0] + Math.sin(p.k * 2.2 + t) * 0.3; p.m.visible = true; p.d = dens;
        }
        p.life -= dt; const a = 1 - p.life / p.max; // 0 → 1
        p.m.position.set(p.x + (reduced ? 0 : Math.sin(a * 3 + p.k) * 0.18), sp0[1] + a * 2.1, sp0[2] - 0.15);
        p.m.scale.setScalar(0.14 + a * 0.26);
        p.m.material.opacity = Math.min(p.d, dens + 0.15) * 0.6 * Math.sin(Math.min(1, a * 1.15) * Math.PI); // 부드럽게 나타났다 사라진다
        if (p.life <= 0) p.m.visible = false;
      }
    },
  };
}

// 속에 남은 불씨: 은은하게 숨 쉬듯 빛난다 (약 3초에 한 번)
export function makeEmberGlow(g, x, y, z, r = 0.34) {
  const m = new T.Mesh(new T.CircleGeometry(r, 24), basic('#ff7a45', 0, { blending: T.AdditiveBlending })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = 3; g.add(m);
  let lvl = 0, shown = false;
  return { show(v) { shown = v; }, set(v) { lvl = v; }, tick(dt, t) { m.material.opacity = shown ? lvl * (0.34 + (reduced ? 0 : Math.sin(t * 2.1) * 0.1)) : 0; } };
}

// 물: 관창(from)에서 손가락이 가리키는 곳(pointer)까지 물방울이 포물선으로 날아가고, 닿는 곳에서 튄다.
//   pointer 는 무대의 tool 로 넘긴다. 가까이 보기가 문지르는 동안 보이게 하고 자리를 옮겨 준다(모양은 없다).
//   setOn(true) 를 부르기 전에는 물이 나오지 않는다(호스를 잇기 전).
//   hot(x, z) 가 0보다 크면 닿는 곳에서 김이 피어오른다. puddle 을 주면 그 자리에 물이 고인다.
//   wetY 는 젖은 자국을 둘 높이. 숫자나 (x, z) => 높이. 주지 않으면 물이 닿은 높이에 둔다.
export function makeWater(g, from, { hot = () => 0, puddle = null, wetY = null } = {}) {
  const pointer = new T.Group(); g.add(pointer);
  const a = new T.Vector3(...from), b = new T.Vector3(), up = new T.Vector3(0, 1, 0), d = new T.Vector3();
  const dropMat = basic('#8fc9ea', 0.95), sprayMat = basic('#e3f3fb', 0.9);
  const drops = Array.from({ length: FX_MAX.drops }, () => { const m = new T.Mesh(BALL, dropMat); m.visible = false; m.renderOrder = 6; g.add(m); return { m, u: 1, to: new T.Vector3() }; });
  const splash = Array.from({ length: FX_MAX.splash }, () => { const m = new T.Mesh(BALL, sprayMat); m.visible = false; m.renderOrder = 6; g.add(m); return { m, life: 0, v: new T.Vector3() }; });
  const steam = Array.from({ length: FX_MAX.steam }, () => { const m = new T.Mesh(BALL, basic('#ffffff', 0)); m.visible = false; m.renderOrder = 5; g.add(m); return { m, life: 0 }; });
  // 젖은 자국: 하나씩 따로 옅어진다. 자리가 모자라면 가장 오래된 것을 서서히 지우고, 빈 자리가 난 뒤에 새로 만든다(갑자기 사라지지 않게).
  const wetGeo = new T.CircleGeometry(0.17, 16), WET = 0.2, yOf = typeof wetY === 'function' ? wetY : (x, z, y) => wetY ?? y;
  const wet = Array.from({ length: FX_MAX.wet }, (_, i) => { const m = new T.Mesh(wetGeo, basic('#56788f', 0)); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 1; g.add(m); return { m, age: -1, out: 0, k: i }; });
  // 동작 줄이기: 입자 대신 가만히 있는 물줄기 한 줄
  const beam = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 1, 8), basic('#a9d6ec', 0.9)); beam.visible = false; g.add(beam);
  // A continuous tapered jet fills the gaps between drops. Fixed pool, no camera shake or flashing.
  const jet = Array.from({length: reduced ? 0 : 12}, () => {
    const m = new T.Mesh(new T.CylinderGeometry(0.8, 1, 1, 8), basic('#b8e0ef', 0.52));
    m.visible=false;m.renderOrder=5;g.add(m);return m;
  });
  const start=new T.Vector3(),end=new T.Vector3(),tangent=new T.Vector3();
  let pud = null; if (puddle) { pud = new T.Mesh(new T.CircleGeometry(1, 28), basic('#6f93aa', 0.24)); pud.rotation.x = -Math.PI / 2; pud.position.set(puddle[0], puddle[1], puddle[2]); pud.scale.set(0.01, 0.01, 1); pud.renderOrder = 1; g.add(pud); }
  let on = false, emit = 0, n = 0, used = 0, steamK = 0; const lastWet = new T.Vector3(99, 0, 99);
  const hit = (p) => {
    for (let k = 0; k < 2; k++) { const s = splash.find((x) => x.life <= 0); if (!s) break; n++; s.life = 0.34; s.m.position.copy(p); s.m.visible = true; s.v.set(Math.sin(n * 2.4) * 0.9, 1.1 + ((n * 7) % 10) / 14, Math.cos(n * 1.9) * 0.6); }
    if (Math.hypot(p.x - lastWet.x, p.z - lastWet.z) > 0.13 && wet.length) {
      const free = wet.find((w) => w.age < 0);
      if (free) { free.age = 0; free.out = 0; free.m.position.set(p.x, yOf(p.x, p.z, p.y) + 0.006 + free.k * 0.0003, p.z); free.m.visible = true; lastWet.copy(p); }
      else { const old = wet.reduce((a, w) => (w.out ? a : !a || w.age > a.age ? w : a), null); if (old) old.out = 1; } // 가장 오래된 자국부터 서서히 지운다
    }
    const h = hot(p.x, p.z);
    if (h > 0.05 && steamK >= 1) { const s = steam.find((x) => x.life <= 0); if (s) { steamK = 0; s.life = s.max = 1.0; s.m.position.set(p.x, p.y + 0.1, p.z); s.m.visible = true; s.h = h; } }
  };
  return {
    pointer,
    setOn(v) { on = v; },
    tick(dt, t) {
      const active = on && pointer.visible; b.copy(pointer.position);
      jet.forEach((m,i)=>{
        m.visible=active;if(!active)return;
        const u=i/jet.length,v=(i+1)/jet.length;
        start.lerpVectors(a,b,u);end.lerpVectors(a,b,v);
        start.y+=Math.sin(u*Math.PI)*.18;end.y+=Math.sin(v*Math.PI)*.18;
        tangent.copy(end).sub(start);const len=tangent.length();
        m.position.copy(start).add(end).multiplyScalar(.5);
        const width=.028+u*.035;m.scale.set(width,len+.012,width);
        if(len>0)m.quaternion.setFromUnitVectors(up,tangent.divideScalar(len));
      });
      steamK += dt * 6;
      for (const w of wet) { if (w.age < 0) continue; w.age += dt; if (w.out) w.out += dt; const f = w.out ? Math.max(0, 1 - (w.out - 1) / 0.8) : 1; w.m.material.opacity = WET * Math.min(1, w.age / 0.25) * f; if (w.out && f <= 0) { w.age = -1; w.out = 0; w.m.visible = false; } }
      if (active) used += dt;
      if (pud) { const s = Math.min(1, used / 5); pud.scale.set(0.01 + s * 1.15, 0.01 + s * 0.5, 1); }
      if (reduced) {
        beam.visible = active; if (!active) return;
        d.copy(b).sub(a); const len = d.length() || 1; beam.position.copy(a).addScaledVector(d, 0.5); beam.scale.set(1, len, 1); beam.quaternion.setFromUnitVectors(up, d.divideScalar(len));
        emit += dt; if (emit > 0.12) { emit = 0; hit(b); } return;
      }
      if (active) emit += dt * 130;
      for (const p of drops) {
        if (p.u >= 1) {
          if (!active || emit < 1) { p.m.visible = false; continue; } emit -= 1; n++;
          p.u = 0; p.to.set(b.x + Math.sin(n * 1.3) * 0.07, b.y, b.z + Math.cos(n * 2.1) * 0.07); p.m.visible = true; p.s = 0.042 + ((n * 5) % 7) / 300;
        }
        p.u = Math.min(1, p.u + dt / 0.22);
        p.m.position.lerpVectors(a, p.to, p.u); p.m.position.y += Math.sin(p.u * Math.PI) * 0.18; d.copy(p.to).sub(a).normalize();p.m.quaternion.setFromUnitVectors(up,d);p.m.scale.set(p.s*.65,p.s*2.4,p.s*.65);
        if (p.u >= 1) { p.m.visible = false; hit(p.to); }
      }
      if (!active) emit = 0;
      for (const s of splash) { if (s.life <= 0) continue; s.life -= dt; s.v.y -= 6 * dt; s.m.position.addScaledVector(s.v, dt); s.m.scale.setScalar(0.036 * Math.max(0.2, s.life / 0.34)); if (s.life <= 0) s.m.visible = false; }
      for (const s of steam) { if (s.life <= 0) continue; s.life -= dt; const k = 1 - s.life / s.max; s.m.position.y += dt * 0.75; s.m.scale.setScalar(0.07 + k * 0.16); s.m.material.opacity = 0.5 * Math.min(1, s.h * 2) * Math.sin(Math.min(1, k * 1.1) * Math.PI); if (s.life <= 0) s.m.visible = false; }
    },
  };
}
