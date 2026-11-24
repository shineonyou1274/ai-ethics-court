// 소방서에서 쓰는 3D 조각: 소방차와 장비. 일터 모형(places/fire-station.js)과 가까이 보기(world/closeups.js)가 함께 쓴다.
// 실제 장비를 단순하게 줄인 모양이다. 색은 다른 일터처럼 밝은 파스텔을 쓴다.
import * as T from 'three';
import { box, cyl, ball, mat } from './kit.js';

export const RED = '#d9614c', CREAM = '#f3efe6', STEEL = '#b9b4aa', KHAKI = '#cdb98a', GLOW = '#f6e58a';

// 소방차 한 대. 길이는 x 방향, 운전석이 +x 쪽이다. kind: pump(펌프차) · ambulance(구급차)
export function truck(p, x, z, rot = 0, kind = 'pump') {
  const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rot; p.add(g);
  const body = kind === 'ambulance' ? '#f7f4ec' : RED, band = kind === 'ambulance' ? '#7fbf9a' : CREAM;
  box(g, -0.35, 1.0, 0, 2.4, 1.1, 1.3, body); // 짐칸
  box(g, 1.3, 0.9, 0, 0.9, 0.9, 1.3, body); // 운전석
  box(g, 1.47, 1.08, 0, 0.6, 0.38, 1.32, '#bcd8e4'); // 창
  box(g, 0.1, 0.52, 0, 3.32, 0.12, 1.33, band);
  box(g, 1.3, 1.4, 0, 0.42, 0.1, 0.9, kind === 'ambulance' ? '#8fc0e8' : '#f2c94c'); // 경광등
  box(g, 1.78, 0.6, 0, 0.06, 0.2, 1.1, '#e9e4d8'); // 앞 범퍼
  for (const a of [-1.05, 1.2]) for (const b of [-0.6, 0.6]) { const w = cyl(g, a, 0.3, b, 0.3, 0.2, '#4a4f57'); w.rotation.x = Math.PI / 2; const h = cyl(g, a, 0.3, b + Math.sign(b) * 0.1, 0.13, 0.03, '#d9d5cb'); h.rotation.x = Math.PI / 2; }
  if (kind === 'pump') {
    for (const b of [-0.22, 0.22]) box(g, -0.35, 1.6, b, 2.2, 0.05, 0.05, STEEL); // 사다리
    for (let i = 0; i < 6; i++) box(g, -1.3 + i * 0.38, 1.6, 0, 0.04, 0.04, 0.44, STEEL);
    for (const a of [-1.0, -0.3, 0.4]) for (const b of [-0.66, 0.66]) box(g, a, 1.05, b, 0.6, 0.7, 0.02, '#c9523e'); // 장비함 문
  } else for (const b of [-0.66, 0.66]) { box(g, -0.35, 1.1, b, 0.36, 0.1, 0.02, '#7fbf9a'); box(g, -0.35, 1.1, b, 0.1, 0.36, 0.02, '#7fbf9a'); }
  return g;
}

export function helmet() {
  const g = new T.Group();
  cyl(g, 0, 0.04, 0, 0.27, 0.04, '#e0b63c'); ball(g, 0, 0.1, 0, 0.21, '#f2c94c', [1, 0.85, 1.08]);
  box(g, 0, 0.2, 0.19, 0.12, 0.1, 0.03, '#d2553f'); box(g, 0, 0.26, 0, 0.05, 0.05, 0.36, '#e0b63c');
  return g;
}

// 공기호흡기(공기통). band: 통에 두른 띠의 색. 초록은 채운 통, 빨강은 다 쓴 통.
export function tank(band = '#5d6b78') {
  const g = new T.Group();
  box(g, 0, 0.3, -0.1, 0.3, 0.52, 0.05, '#4a4f57'); // 등받이
  cyl(g, 0, 0.3, 0.02, 0.12, 0.5, '#f0cf6a'); ball(g, 0, 0.55, 0.02, 0.12, '#f0cf6a', [1, 0.6, 1]);
  cyl(g, 0, 0.64, 0.02, 0.04, 0.08, '#6b7078'); cyl(g, 0, 0.3, 0.02, 0.125, 0.1, band);
  return g;
}

export function lantern() {
  const g = new T.Group();
  box(g, 0, 0.13, 0, 0.3, 0.22, 0.2, '#f08a4b'); const lens = cyl(g, 0, 0.13, 0.11, 0.09, 0.04, '#fff3c4'); lens.rotation.x = Math.PI / 2;
  box(g, 0, 0.3, 0, 0.22, 0.04, 0.05, '#4a4f57'); for (const a of [-0.1, 0.1]) box(g, a, 0.26, 0, 0.03, 0.08, 0.05, '#4a4f57');
  return g;
}

export function hydrant(p, x, z) {
  const g = new T.Group(); g.position.set(x, 0, z); p.add(g);
  cyl(g, 0, 0.05, 0, 0.24, 0.1, '#b8493a'); cyl(g, 0, 0.36, 0, 0.16, 0.6, RED); ball(g, 0, 0.68, 0, 0.17, RED, [1, 0.7, 1]); cyl(g, 0, 0.8, 0, 0.05, 0.08, '#b8493a');
  for (const s of [-1, 1]) { const n = cyl(g, s * 0.2, 0.42, 0, 0.07, 0.12, CREAM); n.rotation.z = Math.PI / 2; }
  const f = cyl(g, 0, 0.42, 0.2, 0.08, 0.12, CREAM); f.rotation.x = Math.PI / 2;
  return g;
}

// 말아 둔 호스
export function hoseRoll(c = '#e8dfc8') {
  const g = new T.Group();
  for (const [r, y] of [[0.24, 0.07], [0.15, 0.07]]) { const m = new T.Mesh(new T.TorusGeometry(r, 0.065, 8, 28), mat(c)); m.rotation.x = Math.PI / 2; m.position.y = y; m.castShadow = true; g.add(m); }
  cyl(g, 0.3, 0.07, 0.06, 0.06, 0.1, STEEL).rotation.x = Math.PI / 2;
  return g;
}

// 관창(호스 끝에 끼워 물줄기를 잡는 손잡이)
export function nozzle() {
  const g = new T.Group();
  const a = cyl(g, 0, 0.1, 0, 0.06, 0.42, '#4a4f57', 0.035); a.rotation.z = -Math.PI / 2;
  const b = cyl(g, -0.2, 0.1, 0, 0.075, 0.1, STEEL); b.rotation.z = Math.PI / 2; box(g, -0.02, 0.2, 0, 0.05, 0.14, 0.05, '#f2c94c');
  return g;
}

// 소화전을 여는 손잡이(스패너)
export function wrench() {
  const g = new T.Group();
  box(g, 0, 0.05, 0, 0.5, 0.05, 0.08, '#8a97a5'); const r = new T.Mesh(new T.TorusGeometry(0.1, 0.035, 8, 20), mat('#8a97a5')); r.rotation.x = Math.PI / 2; r.position.set(0.3, 0.05, 0); g.add(r);
  return g;
}

export function cone(p, x, z) {
  const g = new T.Group(); g.position.set(x, 0, z); p.add(g);
  box(g, 0, 0.02, 0, 0.34, 0.04, 0.34, '#e98a4a'); cyl(g, 0, 0.24, 0, 0.13, 0.42, '#f09a5a', 0.03); cyl(g, 0, 0.28, 0, 0.085, 0.07, CREAM, 0.07);
  return g;
}

// 벽에 건 방화복 한 벌
export function coatOnHook(p, x, y, z) {
  box(p, x, y, z, 0.5, 0.75, 0.12, KHAKI); box(p, x, y - 0.18, z + 0.065, 0.5, 0.05, 0.01, GLOW); box(p, x, y + 0.12, z + 0.065, 0.5, 0.05, 0.01, GLOW);
  box(p, x, y + 0.42, z, 0.06, 0.06, 0.1, '#8f8a80');
}
