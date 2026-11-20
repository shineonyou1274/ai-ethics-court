// Copied/adapted from career-day/src/world/kit.js person(), 2026-11-20.
// Keep series proportions/colors; local ownership and disposable materials.
import * as T from './vendor/three.module.min.js';
import {reducedMotion} from './motion.mjs';
export function mat(c){return new T.MeshStandardMaterial({color:c,roughness:.82,metalness:0})}
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
  } else if (outfit === 'fire' || outfit === 'turnout') {
    // 소방관: fire 는 활동복, turnout 은 방화복. 둘 다 눈에 잘 띄는 반사띠를 두른다.
    for (const y of outfit === 'turnout' ? [1.0, 1.32] : [1.02]) box(apparel, 0, y, 0.185, 0.5, 0.05, 0.04, '#f6e58a');
    if (outfit === 'turnout') for (const side of [-1, 1]) box(apparel, side * 0.36, 1.0, 0.02, 0.2, 0.05, 0.2, '#f6e58a');
  } else if (outfit === 'vest') {
    for (const side of [-1, 1]) box(apparel, side * 0.16, 1.18, 0.18, 0.21, 0.54, 0.045, '#d7c19e');
    box(apparel, 0, 1.2, 0.21, 0.025, 0.5, 0.025, '#f2eddf');
  } else {
    box(apparel, 0, 1.29, 0.2, 0.018, 0.36, 0.015, '#e7e3d8');
    for (const y of [1.4, 1.27, 1.14]) ball(apparel, 0, y, 0.22, 0.015, '#f8eee0');
  }
  if (outfit === 'surgery') { ball(head, 0, 0.17, -0.015, 0.3, '#a7c9d6', [1, 0.65, 1]); box(head, 0, -0.08, 0.247, 0.29, 0.15, 0.04, '#d3e6e9'); }
  if (outfit === 'turnout') { ball(head, 0, 0.15, -0.01, 0.31, '#f2c94c', [1, 0.66, 1.05]); cyl(head, 0, 0.07, 0, 0.36, 0.03, '#e0b63c'); box(head, 0, 0.2, 0.27, 0.12, 0.1, 0.03, '#d2553f'); }
  if (outfit !== 'casual') { box(apparel, 0.18, 1.24, 0.25, 0.12, 0.18, 0.025, '#fffdf5'); box(apparel, 0.18, 1.29, 0.27, 0.09, 0.035, 0.008, '#df9c80'); }
  const clipboard = new T.Group(); body.add(clipboard);
  box(clipboard, -0.38, 1.05, 0.33, 0.3, 0.38, 0.035, '#b59674'); box(clipboard, -0.38, 1.07, 0.355, 0.25, 0.29, 0.01, '#fffaf0');
  for (let i = 0; i < 3; i++) box(clipboard, -0.38, 1.12 - i * 0.07, 0.37, 0.16, 0.012, 0.008, '#a4bbc4');
  clipboard.visible = false;
  let gestureUntil = 0, gestureKind = '';
  const act = (kind) => { gestureKind = kind; gestureUntil = performance.now() / 1000 + 2; clipboard.visible = ['write', 'work', 'inspect'].includes(kind); };
  const update = (t, walk = false) => {
    if (reducedMotion()) return;
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
