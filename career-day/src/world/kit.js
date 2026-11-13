// 3D 조각 상자: 어느 일터에서나 같이 쓰는 기본 도형, 가구, 사람.
// 어쩌다 병원의 모형을 그대로 옮기고, 일터마다 다시 쓸 수 있게 나눴다.
import * as T from 'three';

export const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const mats = new Map();
export function mat(c) {
  if (!mats.has(c)) mats.set(c, new T.MeshStandardMaterial({ color: c, roughness: 0.82, metalness: 0 }));
  return mats.get(c);
}
export function mesh(g, c, p, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(g, mat(c));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m;
}
export const box = (p, x, y, z, w, h, d, c) => mesh(new T.BoxGeometry(w, h, d), c, p, x, y, z);
export const ball = (p, x, y, z, r, c, s = [1, 1, 1]) => { const m = mesh(new T.SphereGeometry(r, 16, 12), c, p, x, y, z); m.scale.set(...s); return m; };
export const cyl = (p, x, y, z, r, h, c, rt = r) => mesh(new T.CylinderGeometry(rt, r, h, 20), c, p, x, y, z);
export function tube(p, points, r, c) {
  const curve = new T.CatmullRomCurve3(points.map((a) => new T.Vector3(...a)));
  return mesh(new T.TubeGeometry(curve, 24, r, 6, false), c, p);
}
export function label(p, text, x, y, z, w = 2, h = 0.48, color = '#344d63', bg = '#fffaf0') {
  const c = document.createElement('canvas'); c.width = 640; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, 640, 160, 30); g.fill();
  g.fillStyle = color; g.font = '600 52px "Gowun Dodum", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 320, 83, 600);
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: true, side: T.DoubleSide }));
  m.position.set(x, y, z); p.add(m); return m;
}
export function plant(p, x, z, sz = 1) {
  const g = new T.Group(); g.position.set(x, 0, z); g.scale.setScalar(sz); p.add(g);
  cyl(g, 0, 0.24, 0, 0.27, 0.48, '#ceab8c', 0.33); cyl(g, 0, 0.65, 0, 0.025, 0.5, '#8c9677');
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4;
    const leaf = ball(g, Math.cos(a) * 0.19, 0.85 + (i % 2) * 0.16, Math.sin(a) * 0.19, 0.26, i % 2 ? '#a4b19a' : '#b8c3a5', [0.7, 1.2, 0.5]);
    leaf.rotation.z = Math.cos(a) * 0.6;
  }
}
export function chair(p, x, z, c = '#b7cddd', rot = 0) {
  const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rot; p.add(g);
  box(g, 0, 0.5, 0, 0.65, 0.15, 0.62, c); box(g, 0, 0.87, -0.28, 0.65, 0.65, 0.12, c);
  for (const a of [-0.24, 0.24]) for (const b of [-0.22, 0.22]) cyl(g, a, 0.23, b, 0.035, 0.45, '#a39a8a');
  return g;
}
export function desk(p, x, z, w = 1.6, c = '#e5cdb1') {
  box(p, x, 0.8, z, w, 0.13, 0.85, c);
  for (const a of [-w * 0.4, w * 0.4]) box(p, x + a, 0.4, z, 0.09, 0.8, 0.66, '#eee4d6');
}
export function monitor(p, x, z) {
  box(p, x, 1.18, z, 0.55, 0.38, 0.06, '#364e61'); box(p, x, 1.18, z + 0.035, 0.47, 0.29, 0.012, '#bbd8e2');
  box(p, x, 0.93, z, 0.06, 0.15, 0.05, '#5c7080'); box(p, x, 0.87, z, 0.3, 0.025, 0.18, '#5c7080');
  for (let i = 0; i < 3; i++) box(p, x - 0.08, 1.22 - i * 0.07, z + 0.047, 0.24, 0.015, 0.008, '#e7f1ec');
}
export function bed(p, x, z) {
  box(p, x, 0.48, z, 1.05, 0.16, 2, '#f5f0e6'); box(p, x, 0.68, z, 1.01, 0.28, 1.95, '#fffdf8');
  box(p, x, 0.86, z - 0.62, 0.75, 0.13, 0.42, '#e3e5de'); box(p, x, 0.86, z + 0.25, 1.03, 0.12, 1.15, '#abc7d7');
  for (const a of [-0.4, 0.4]) for (const b of [-0.8, 0.8]) { box(p, x + a, 0.24, z + b, 0.07, 0.45, 0.07, '#a5afb1'); ball(p, x + a, 0.08, z + b, 0.09, '#697d85'); }
  box(p, x, 0.98, z - 0.97, 1.15, 0.6, 0.08, '#d4dddb');
}
export function cupboard(p, x, z, w = 1.3, h = 1.8) {
  box(p, x, h / 2, z, w, h, 0.45, '#f3ece1');
  for (let i = 0; i < 3; i++) {
    box(p, x, (i + 1) * h / 4, z + 0.23, w - 0.08, 0.025, 0.01, '#d9d3c7');
    box(p, x + w * 0.27, (i + 0.65) * h / 3, z + 0.27, 0.18, 0.025, 0.03, '#9faaa8');
  }
}

// 사람 한 명. outfit: casual · white(가운) · scrub(치료복) · surgery · vest(조끼 근무복)
export function person({ coat = '#b7ccdc', hair = 0, seed = 0, outfit = 'casual' } = {}) {
  const root = new T.Group(), body = new T.Group(); root.add(body);
  const skin = seed % 3 === 0 ? '#cba68c' : seed % 3 === 1 ? '#e6bfa1' : '#f1d4b7';
  const dark = '#56473f'; const limbs = [];
  for (const side of [-1, 1]) {
    const leg = new T.Group(); leg.position.set(side * 0.16, 0.82, 0); body.add(leg);
    mesh(new T.CapsuleGeometry(0.105, 0.48, 4, 10), '#586c7c', leg, 0, -0.32, 0);
    ball(leg, 0, -0.65, 0.055, 0.135, '#faf7ef', [0.85, 0.55, 1.5]); limbs.push(leg);
  }
  const torso = mesh(new T.CapsuleGeometry(0.29, 0.38, 5, 12), coat, body, 0, 1.14, 0); torso.scale.z = 0.65;
  for (const side of [-1, 1]) {
    const arm = new T.Group(); arm.position.set(side * 0.34, 1.39, 0); body.add(arm);
    mesh(new T.CapsuleGeometry(0.085, 0.33, 3, 8), coat, arm, side * 0.02, -0.23, 0);
    ball(arm, side * 0.02, -0.49, 0.015, 0.085, skin, [0.85, 1.1, 0.8]); limbs.push(arm);
  }
  cyl(body, 0, 1.53, 0, 0.09, 0.16, skin);
  const head = new T.Group(); head.position.y = 1.82; body.add(head);
  ball(head, 0, 0, 0, 0.285, skin, [0.9, 1.1, 0.9]);
  ball(head, 0, 0.13, -0.035, 0.29, dark, [0.95, 0.72, 0.95]);
  for (let i = 0; i < 5; i++) ball(head, -0.21 + i * 0.105, 0.17 - (i % 2) * 0.04, 0.14, 0.105, dark, [0.85, 0.68, 1]);
  if (hair === 1) ball(head, 0.19, 0.12, -0.18, 0.17, dark, [1, 1.1, 1]);
  if (hair === 2) for (const side of [-1, 1]) ball(head, side * 0.225, -0.055, -0.03, 0.11, dark, [0.65, 1.9, 1.35]);
  for (const side of [-1, 1]) {
    ball(head, side * 0.1, 0.005, 0.24, 0.024, '#35434d', [0.8, 1, 0.5]);
    ball(head, side * 0.167, -0.06, 0.2, 0.045, '#dda799', [1, 0.5, 0.3]);
    ball(head, side * 0.258, -0.01, 0, 0.055, skin, [0.55, 1, 0.7]);
  }
  tube(head, [[-0.045, -0.09, 0.25], [0, -0.1, 0.26], [0.045, -0.09, 0.25]], 0.008, '#aa7e6a');
  const apparel = new T.Group(); body.add(apparel);
  if (outfit === 'white') {
    for (const side of [-1, 1]) {
      const flap = box(apparel, side * 0.14, 1.02, 0.17, 0.25, 0.73, 0.06, '#fffdf6'); flap.rotation.z = side * 0.045;
      const lapel = box(apparel, side * 0.09, 1.43, 0.2, 0.1, 0.25, 0.035, '#e4e5de'); lapel.rotation.z = side * 0.36;
    }
    for (const y of [1.22, 1.05, 0.88]) ball(apparel, 0.02, y, 0.215, 0.016, '#bbbbb1');
  } else if (outfit === 'scrub' || outfit === 'surgery') {
    const a = box(apparel, -0.055, 1.45, 0.19, 0.12, 0.035, 0.025, '#f6ede0'); a.rotation.z = -0.7;
    const b = box(apparel, 0.055, 1.45, 0.19, 0.12, 0.035, 0.025, '#f6ede0'); b.rotation.z = 0.7;
    box(apparel, -0.16, 1.12, 0.2, 0.16, 0.16, 0.025, '#a2b6be');
  } else if (outfit === 'vest') {
    for (const side of [-1, 1]) box(apparel, side * 0.16, 1.18, 0.18, 0.21, 0.54, 0.045, '#d7c19e');
    box(apparel, 0, 1.2, 0.21, 0.025, 0.5, 0.025, '#f2eddf');
  } else {
    box(apparel, 0, 1.29, 0.2, 0.018, 0.36, 0.015, '#e7e3d8');
    for (const y of [1.4, 1.27, 1.14]) ball(apparel, 0, y, 0.22, 0.015, '#f8eee0');
  }
  if (outfit === 'surgery') { ball(head, 0, 0.17, -0.015, 0.3, '#a7c9d6', [1, 0.65, 1]); box(head, 0, -0.08, 0.247, 0.29, 0.15, 0.04, '#d3e6e9'); }
  if (outfit !== 'casual') { box(apparel, 0.18, 1.24, 0.25, 0.12, 0.18, 0.025, '#fffdf5'); box(apparel, 0.18, 1.29, 0.27, 0.09, 0.035, 0.008, '#df9c80'); }
  const clipboard = new T.Group(); body.add(clipboard);
  box(clipboard, -0.38, 1.05, 0.33, 0.3, 0.38, 0.035, '#b59674'); box(clipboard, -0.38, 1.07, 0.355, 0.25, 0.29, 0.01, '#fffaf0');
  for (let i = 0; i < 3; i++) box(clipboard, -0.38, 1.12 - i * 0.07, 0.37, 0.16, 0.012, 0.008, '#a4bbc4');
  clipboard.visible = false;
  let gestureUntil = 0, gestureKind = '';
  const act = (kind) => { gestureKind = kind; gestureUntil = performance.now() / 1000 + 2; clipboard.visible = ['write', 'work', 'inspect'].includes(kind); };
  const update = (t, walk = false) => {
    if (reduced) return;
    for (let i = 0; i < 2; i++) limbs[i].rotation.x = walk ? Math.sin(t * 7 + i * Math.PI) * 0.42 : 0;
    for (let i = 2; i < 4; i++) limbs[i].rotation.x = walk ? Math.sin(t * 7 + (i - 1) * Math.PI) * 0.3 : Math.sin(t * 1.4 + seed) * 0.025;
    body.position.y = walk ? Math.abs(Math.sin(t * 7)) * 0.035 : Math.sin(t * 1.5 + seed) * 0.012;
    head.rotation.y = walk ? 0 : Math.sin(t * 0.45 + seed) * 0.05;
    if (t < gestureUntil && !walk) {
      if (gestureKind === 'talk') { limbs[2].rotation.x = -0.3; limbs[3].rotation.x = -1 + Math.sin(t * 5) * 0.15; head.rotation.x = Math.sin(t * 3) * 0.09; }
      else if (gestureKind === 'rest') { limbs[2].rotation.x = -1; limbs[3].rotation.x = -0.2; head.rotation.x = 0.08; }
      else { limbs[2].rotation.x = -0.55; limbs[3].rotation.x = -0.75 + Math.sin(t * 6) * 0.15; head.rotation.x = 0.08; }
    } else { head.rotation.x = 0; clipboard.visible = false; }
  };
  return { root, update, act, head };
}

export function dispose(group) {
  group?.traverse((o) => { o.geometry?.dispose(); if (o.material?.map) { o.material.map.dispose(); o.material.dispose(); } });
}
