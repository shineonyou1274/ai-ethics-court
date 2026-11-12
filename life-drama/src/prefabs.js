// 길가 풍경을 이루는 조각들. 외부 모델 없이 기본 도형을 합쳐서 만든다.
// 조각 하나가 그리기 한 번이 되도록 색을 꼭짓점에 칠해 하나로 합친다.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
export const GLOW = new THREE.MeshBasicMaterial({ color: '#fff1b8', fog: false });

const _c = new THREE.Color();
function paint(g, color, x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = 1, sz = 1, rz = 0) {
  if (g.index) g = g.toNonIndexed();
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  );
  g.applyMatrix4(m);
  g.deleteAttribute('uv');
  g.computeVertexNormals();
  _c.set(color);
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
const box = (w, h, d, c, x, y, z, ry = 0, rz = 0) => paint(new THREE.BoxGeometry(w, h, d), c, x, y, z, ry, 1, 1, 1, rz);
const cyl = (rt, rb, h, c, x, y, z, seg = 7, rz = 0) => paint(new THREE.CylinderGeometry(rt, rb, h, seg), c, x, y, z, 0, 1, 1, 1, rz);
const cone = (r, h, c, x, y, z, seg = 7, ry = 0) => paint(new THREE.ConeGeometry(r, h, seg), c, x, y, z, ry);
const blob = (r, c, x, y, z, sx = 1, sy = 1, sz = 1) => paint(new THREE.IcosahedronGeometry(r, 1), c, x, y, z, 0, sx, sy, sz);
const merge = (list) => mergeGeometries(list, false);

const pick = (arr, v) => arr[Math.abs(v) % arr.length];

const GREENS = ['#8fd694', '#7cc98a', '#a3dba0', '#6fbf8f'];
const PINKS = ['#ffc2d4', '#ffb3c8', '#ffd1dc', '#f9a8c4'];
const AUTUMN = ['#f4a259', '#e76f51', '#f6c453', '#e9965a'];
const WALLS = ['#fff1e0', '#ffe3d3', '#e3f1ff', '#fdf0c9', '#e8f6e9', '#f3e6ff'];
const ROOFS = ['#ff9b85', '#f28ca0', '#7fb7e6', '#f4b860', '#86c9a5', '#b79ced'];
const TOWERS = ['#cfe3ff', '#ffd9e4', '#e2d8ff', '#d4f1e4', '#ffe7c2', '#c9e9f6'];

function tree(crowns, v, tall = 1) {
  const g = [cyl(0.16, 0.24, 1.7 * tall, '#a8825f', 0, 0.85 * tall, 0, 6)];
  const c1 = pick(crowns, v), c2 = pick(crowns, v + 1);
  g.push(blob(1.25, c1, 0, 2.5 * tall, 0, 1, 0.95, 1));
  g.push(blob(0.85, c2, 0.7, 2.0 * tall, 0.2));
  g.push(blob(0.8, c2, -0.65, 2.15 * tall, -0.2));
  g.push(blob(0.7, c1, 0.1, 3.3 * tall, 0.1));
  return g;
}

const BUILDERS = {
  round: (v) => tree(GREENS, v, 1 + (v % 3) * 0.12),
  blossom: (v) => tree(PINKS, v, 1 + (v % 2) * 0.1),
  autumn: (v) => tree(AUTUMN, v, 1 + (v % 3) * 0.1),
  pine: (v) => {
    const h = 1 + (v % 3) * 0.2;
    return [cyl(0.14, 0.2, 1 * h, '#8d6e56', 0, 0.5 * h, 0, 6),
      cone(1.3, 1.8, '#5fae8b', 0, 1.6 * h, 0), cone(1.05, 1.6, '#6cbb97', 0, 2.5 * h, 0), cone(0.75, 1.4, '#7cc7a3', 0, 3.4 * h, 0)];
  },
  bare: () => [cyl(0.14, 0.24, 2.4, '#9c8577', 0, 1.2, 0, 6), cyl(0.07, 0.1, 1.3, '#9c8577', 0.45, 2.6, 0, 5, -0.7), cyl(0.07, 0.1, 1.2, '#9c8577', -0.4, 2.7, 0.1, 5, 0.6),
    blob(0.55, '#d9d3e8', 0.9, 3.1, 0), blob(0.6, '#e6e0f2', -0.8, 3.2, 0.1), blob(0.5, '#d9d3e8', 0, 3.6, 0)],
  bush: (v) => [blob(0.7, pick(GREENS, v), 0, 0.45, 0, 1.2, 0.8, 1), blob(0.5, pick(GREENS, v + 2), 0.6, 0.35, 0.2)],
  flowers: (v) => {
    const cs = ['#ff9eb5', '#ffd166', '#ffffff', '#c3a6ff', '#ff8a80'];
    const g = [];
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4 + v, r = 0.3 + (i % 3) * 0.35;
      const x = Math.cos(a) * r, z = Math.sin(a) * r, h = 0.3 + (i % 2) * 0.15;
      g.push(cyl(0.03, 0.03, h, '#7cc98a', x, h / 2, z, 4));
      g.push(blob(0.13, pick(cs, i + v), x, h + 0.08, z));
    }
    return g;
  },
  wheat: () => {
    const g = [];
    for (let i = 0; i < 9; i++) {
      const a = i * 1.7, r = 0.25 + (i % 4) * 0.3;
      g.push(cone(0.12, 0.95 + (i % 3) * 0.2, i % 2 ? '#f2cf7a' : '#e8bd5f', Math.cos(a) * r, 0.5, Math.sin(a) * r, 4));
    }
    return g;
  },
  rock: (v) => [blob(0.6, '#c9c6d3', 0, 0.3, 0, 1.3, 0.75, 1), blob(0.35, '#b8b5c6', 0.6, 0.2, 0.2 + (v % 2) * 0.2)],
  fence: () => {
    const g = [];
    for (let i = -2; i <= 2; i++) g.push(box(0.14, 0.8, 0.14, '#fff6ea', 0, 0.4, i * 1.1));
    g.push(box(0.08, 0.1, 4.6, '#fff6ea', 0, 0.62, 0), box(0.08, 0.1, 4.6, '#fff6ea', 0, 0.32, 0));
    return g;
  },
  bench: () => [box(1.7, 0.1, 0.5, '#d9a36f', 0, 0.5, 0), box(1.7, 0.5, 0.08, '#d9a36f', 0, 0.85, -0.24), box(0.1, 0.5, 0.45, '#8d8aa0', -0.7, 0.25, 0), box(0.1, 0.5, 0.45, '#8d8aa0', 0.7, 0.25, 0)],
  lamp: () => ({
    main: [cyl(0.07, 0.1, 3.4, '#8d8aa0', 0, 1.7, 0, 6), box(0.7, 0.08, 0.08, '#8d8aa0', 0.3, 3.4, 0), cone(0.28, 0.25, '#6f6c85', 0.6, 3.38, 0, 6)],
    glow: [blob(0.17, '#ffffff', 0.6, 3.2, 0)],
  }),
  lantern: () => ({
    main: [cyl(0.05, 0.07, 1.2, '#8c7b75', 0, 0.6, 0, 5), box(0.34, 0.06, 0.34, '#8c7b75', 0, 1.22, 0), cone(0.28, 0.2, '#8c7b75', 0, 1.66, 0, 4, Math.PI / 4)],
    glow: [box(0.24, 0.3, 0.24, '#ffffff', 0, 1.4, 0)],
  }),
  house: (v) => {
    const wall = pick(WALLS, v), roof = pick(ROOFS, v * 3 + 1);
    const w = 3.4 + (v % 2) * 0.6;
    return {
      main: [box(w, 2.3, 3.2, wall, 0, 1.15, 0), paint(new THREE.ConeGeometry(w * 0.86, 1.5, 4), roof, 0, 3.05, 0, Math.PI / 4, 1, 1, 0.95),
        box(0.7, 1.2, 0.1, '#c98d6b', -0.6, 0.6, 1.62), box(0.4, 0.9, 0.4, roof, w * 0.28, 3.3, -0.4),
        box(0.9, 0.12, 0.5, '#e9dccb', -0.6, 0.06, 1.9)],
      glow: [box(0.8, 0.7, 0.08, '#ffffff', 0.75, 1.35, 1.62)],
    };
  },
  school: () => {
    const main = [box(9, 3.4, 3.6, '#fff4dc', 0, 1.7, 0), box(9.3, 0.35, 3.9, '#ff9b85', 0, 3.55, 0), box(2.2, 1.2, 3.7, '#fff4dc', 0, 4.3, 0),
      box(2.5, 0.3, 4, '#ff9b85', 0, 5.0, 0), cyl(0.5, 0.5, 0.1, '#ffffff', 0, 4.35, 1.9, 12, 0), box(1.3, 1.6, 0.1, '#7fb7e6', 0, 0.8, 1.82),
      cyl(0.05, 0.05, 3.2, '#b9b6c9', 5.2, 1.6, 1.4, 5), box(0.9, 0.5, 0.04, '#ff8fab', 5.65, 2.95, 1.4)];
    const glow = [];
    for (let r = 0; r < 2; r++) for (let c = -3; c <= 3; c++) { if (c === 0 && r === 0) continue; glow.push(box(0.75, 0.7, 0.08, '#ffffff', c * 1.2, 1.1 + r * 1.3, 1.82)); }
    return { main, glow };
  },
  playground: () => [cyl(0.07, 0.07, 2.6, '#ff8fab', -1.2, 1.3, 0, 5, 0.25), cyl(0.07, 0.07, 2.6, '#ff8fab', 1.2, 1.3, 0, 5, -0.25), box(2.2, 0.1, 0.1, '#ff8fab', 0, 2.55, 0),
    box(0.03, 1.6, 0.03, '#8d8aa0', -0.3, 1.7, 0), box(0.03, 1.6, 0.03, '#8d8aa0', 0.3, 1.7, 0), box(0.7, 0.08, 0.3, '#ffd166', 0, 0.9, 0),
    box(0.9, 0.1, 2.6, '#7fc8e8', 2.9, 0.75, 0.4, 0, 0), box(0.9, 1.5, 0.9, '#b79ced', 2.9, 0.75, -1.2), cone(0.8, 0.7, '#ffd166', 2.9, 1.85, -1.2, 4, Math.PI / 4)],
  building: (v) => {
    const h = 6 + (v % 4) * 1.8, w = 3.2 + (v % 2) * 0.8, c = pick(TOWERS, v);
    const main = [box(w, h, 3.2, c, 0, h / 2, 0), box(w + 0.2, 0.3, 3.4, '#ffffff', 0, h + 0.1, 0), box(1, 0.9, 1, '#b9c4dd', w * 0.2, h + 0.6, -0.5)];
    const glow = [];
    const rows = Math.floor((h - 1.2) / 1.4);
    for (let r = 0; r < rows; r++) for (let k = -1; k <= 1; k++) glow.push(box(0.6, 0.75, 0.08, '#ffffff', k * (w / 3.4), 1.3 + r * 1.4, 1.62));
    return { main, glow };
  },
  shop: (v) => {
    const c = pick(WALLS, v + 2), a = pick(ROOFS, v);
    return {
      main: [box(3.6, 2.6, 3, c, 0, 1.3, 0), box(3.9, 0.25, 3.3, '#ffffff', 0, 2.72, 0), box(3.4, 0.12, 1.1, a, 0, 2.05, 1.9, 0, 0), box(1.7, 0.6, 0.12, a, 0, 3.2, 1.2),
        box(0.75, 1.5, 0.1, '#c98d6b', 1.0, 0.75, 1.52), cyl(0.3, 0.26, 0.5, '#d9a36f', -1.5, 0.25, 2.2, 7), blob(0.45, '#7cc98a', -1.5, 0.75, 2.2)],
      glow: [box(1.5, 1.0, 0.08, '#ffffff', -0.55, 1.2, 1.52)],
    };
  },
  busstop: () => [box(0.08, 2.3, 0.08, '#8d8aa0', -1, 1.15, 0), box(0.08, 2.3, 0.08, '#8d8aa0', 1, 1.15, 0), box(2.5, 0.1, 1.2, '#7fc8e8', 0, 2.35, 0.2), box(2.1, 1.2, 0.05, '#dff3ff', 0, 1.4, -0.05), box(1.6, 0.1, 0.4, '#d9a36f', 0, 0.5, 0.2)],
  hill: (v) => [blob(14, pick(['#a8dba0', '#b7e3ab', '#9bd3a1'], v), 0, -4, 0, 1.5, 0.75, 1.2)],
  mountain: (v) => [cone(15, 20 + (v % 3) * 5, pick(['#b7c6e8', '#c5b9e6', '#a9cbe0'], v), 0, 9, 0, 5, v), cone(4.2, 5.8, '#ffffff', 0, 17.2 + (v % 3) * 2.5, 0, 5, v)],
  city: (v) => {
    const g = [];
    for (let i = 0; i < 5; i++) { const h = 10 + ((v + i * 3) % 5) * 4; g.push(box(5, h, 5, pick(['#c9d8f2', '#d9cff0', '#c3e3ee'], v + i), (i - 2) * 6.2, h / 2, (i % 2) * 4)); }
    return g;
  },
  pebble: (v) => [box(0.6, 0.03, 0.32, '#ffffff', (v % 3 - 1) * 2.2, 0.07, 0, v), box(0.4, 0.03, 0.24, '#ffffff', ((v + 1) % 3 - 1) * 2.4, 0.07, 3.2, v * 2)],
  bridge: () => {
    const g = [];
    const half = 4.75, len = 13;
    for (let i = 0; i < 9; i++) g.push(box(half * 2, 0.07, 1.25, i % 2 ? '#e6b98a' : '#dcab78', 0, 0.085, -len / 2 + 0.75 + i * 1.44));
    for (const sx of [-1, 1]) {
      for (let i = 0; i <= 6; i++) {
        const z = -len / 2 + (i * len) / 6, h = 1.05 + Math.sin((i / 6) * Math.PI) * 0.95;
        g.push(box(0.2, h, 0.2, '#ff8f7a', sx * half, h / 2, z));
        if (i < 6) {
          const h2 = 1.05 + Math.sin(((i + 1) / 6) * Math.PI) * 0.95, zz = z + len / 12;
          g.push(box(0.14, 0.14, len / 6 + 0.15, '#ff8f7a', sx * half, (h + h2) / 2, zz));
          g.push(box(0.1, 0.1, len / 6, '#ffd0c4', sx * half, 0.55, zz));
        }
      }
      g.push(blob(0.28, '#ffd166', sx * half, 2.2, 0));
    }
    return g;
  },
  myhome: () => {
    const main = [box(6.2, 3.2, 5, '#fff6e6', 0, 1.6, 0), paint(new THREE.ConeGeometry(5.1, 2.4, 4), '#ff8f7a', 0, 4.4, 0, Math.PI / 4, 1, 1, 0.85),
      box(1.1, 1.9, 0.14, '#c98d6b', -0.2, 0.95, 2.52), box(0.6, 1.4, 0.6, '#ff8f7a', 1.8, 4.6, -0.6), box(2, 0.14, 1, '#e9dccb', -0.2, 0.07, 3.0),
      box(2.6, 2.2, 3.2, '#ffe9d6', -4.3, 1.1, -0.4), box(2.9, 0.25, 3.5, '#f4b860', -4.3, 2.3, -0.4),
      cyl(0.16, 0.22, 1.6, '#a8825f', 4.6, 0.8, 2.6, 6), blob(1.15, '#8fd694', 4.6, 2.3, 2.6), blob(0.8, '#a3dba0', 5.2, 1.9, 2.9),
      cyl(0.05, 0.05, 1.1, '#8d8aa0', -2.6, 0.55, 3.6, 5), box(0.5, 0.36, 0.3, '#7fc8e8', -2.6, 1.15, 3.6)];
    for (let i = -4; i <= 4; i++) if (Math.abs(i) > 1) main.push(box(0.14, 0.75, 0.14, '#ffffff', i * 0.95, 0.38, 4.6));
    main.push(box(2.9, 0.1, 0.1, '#ffffff', -2.85, 0.5, 4.6), box(2.9, 0.1, 0.1, '#ffffff', 2.85, 0.5, 4.6));
    for (let i = 0; i < 5; i++) main.push(blob(0.16, ['#ff9eb5', '#ffd166', '#c3a6ff'][i % 3], 1.4 + i * 0.5, 0.3, 3.4));
    return { main, glow: [box(1.2, 1.1, 0.1, '#ffffff', 1.9, 1.8, 2.52), box(1.2, 1.1, 0.1, '#ffffff', -2.0, 1.8, 2.52), box(0.9, 0.8, 0.1, '#ffffff', -4.3, 1.3, 1.22)] };
  },
  car: () => ({
    main: [box(2.3, 0.85, 4.4, '#7fd0c0', 0, 0.95, 0), box(2.0, 0.8, 2.4, '#a5e3d6', 0, 1.75, 0.15), box(2.34, 0.16, 0.5, '#fffdf8', 0, 0.62, -2.05), box(2.34, 0.16, 0.5, '#fffdf8', 0, 0.62, 2.05),
      box(0.5, 0.2, 0.08, '#ff8f7a', -0.7, 1.05, 2.22), box(0.5, 0.2, 0.08, '#ff8f7a', 0.7, 1.05, 2.22)],
    glow: [box(1.7, 0.55, 0.06, '#ffffff', 0, 1.78, -1.07), box(1.7, 0.55, 0.06, '#ffffff', 0, 1.78, 1.37), box(0.06, 0.5, 1.7, '#ffffff', 1.01, 1.8, 0.15), box(0.06, 0.5, 1.7, '#ffffff', -1.01, 1.8, 0.15),
      box(0.45, 0.22, 0.08, '#ffffff', -0.72, 1.0, -2.22), box(0.45, 0.22, 0.08, '#ffffff', 0.72, 1.0, -2.22)],
  }),
  tunnel: () => {
    const hw = 5.2, ht = 7.6, len = 18, wall = '#5d5670', stone = '#efe3d3';
    const g = [];
    for (const sx of [-1, 1]) {
      g.push(box(1, ht, len, wall, sx * (hw + 0.5), ht / 2, 0));
      g.push(box(12, ht + 1.4, len - 0.6, '#9bd3a1', sx * (hw + 7), (ht + 1.4) / 2, 0)); // 양옆 언덕
      g.push(blob(6.5, '#a8dba0', sx * (hw + 9), ht + 1.2, 0, 1.3, 0.55, 1.5));
      for (const sz of [-1, 1]) g.push(box(1.5, ht + 0.6, 0.9, stone, sx * (hw + 0.5), (ht + 0.6) / 2, sz * (len / 2)));
    }
    g.push(box(hw * 2 + 2, 1, len, wall, 0, ht + 0.5, 0));
    g.push(box(26, 1.6, len - 0.6, '#9bd3a1', 0, ht + 1.6, 0));
    g.push(blob(8, '#b7e3ab', 0, ht + 5.2, 0, 1.7, 0.5, 1.25));
    for (const sz of [-1, 1]) g.push(box(hw * 2 + 3, 1.3, 0.9, stone, 0, ht + 0.4, sz * (len / 2)));
    const glow = [];
    for (let i = -3; i <= 3; i++) glow.push(box(0.5, 0.12, 0.9, '#ffffff', 0, ht - 0.08, i * 2.4));
    return { main: g, glow };
  },
  plane: () => {
    const g = [paint(new THREE.CapsuleGeometry(0.75, 3.4, 4, 10), '#fffdf8', 0, 0, 0, 0, 1, 1, 1, 0)];
    g[0].rotateX(Math.PI / 2); g[0].computeVertexNormals();
    g.push(box(7.4, 0.14, 1.25, '#ff9f8a', 0, -0.15, -0.2), box(2.6, 0.12, 0.8, '#ff9f8a', 0, 0.2, 2.1), box(0.14, 1.1, 0.9, '#ff9f8a', 0, 0.75, 2.15));
    g.push(blob(0.34, '#7fc8e8', 0, 0, -2.5, 1, 1, 1.3));
    for (const sx of [-1, 1]) g.push(cyl(0.2, 0.2, 0.5, '#8d8aa0', sx * 1.9, -0.5, -0.2, 8));
    return { main: g, glow: [-1.2, -0.3, 0.6].flatMap((z) => [box(0.05, 0.3, 0.42, '#ffffff', 0.74, 0.18, z), box(0.05, 0.3, 0.42, '#ffffff', -0.74, 0.18, z)]) };
  },
  bigtree: () => {
    const g = [cyl(0.7, 1.1, 5, '#a8825f', 0, 2.5, 0, 8), cyl(0.3, 0.45, 3, '#a8825f', 1.3, 5.4, 0, 6, -0.7), cyl(0.3, 0.45, 3, '#a8825f', -1.3, 5.6, 0.2, 6, 0.7)];
    const cs = ['#f6c453', '#f4a259', '#ffd98a', '#f9b872', '#ffe2a0'];
    [[0, 8, 0, 3.3], [2.8, 7, 0.5, 2.5], [-2.8, 7.2, -0.3, 2.6], [1.2, 9.6, -0.8, 2.2], [-1.4, 9.8, 0.6, 2.1], [0, 6.4, 1.8, 2.0], [0.4, 6.8, -2, 2.1]]
      .forEach(([x, y, z, r], i) => g.push(blob(r, cs[i % cs.length], x, y, z, 1, 0.85, 1)));
    const glow = [];
    for (let i = 0; i < 14; i++) { const a = i * 2.39; glow.push(blob(0.1, '#ffffff', Math.cos(a) * (2 + (i % 3)), 5.2 + (i % 5) * 0.9, Math.sin(a) * (1.6 + (i % 2)))); }
    return { main: g, glow };
  },
};

const cache = new Map();
/** 종류와 변형 번호로 합쳐진 도형을 돌려준다. 같은 것은 다시 만들지 않는다. */
export function prefab(type, v = 0) {
  v = v % 6;
  const key = type + ':' + v;
  if (!cache.has(key)) {
    const out = BUILDERS[type](v);
    const main = merge(Array.isArray(out) ? out : out.main);
    const glow = !Array.isArray(out) && out.glow ? merge(out.glow) : null;
    cache.set(key, { main, glow });
  }
  return cache.get(key);
}

export function makeObject(type, v) {
  const p = prefab(type, v);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(p.main, MAT));
  if (p.glow) g.add(new THREE.Mesh(p.glow, GLOW));
  return g;
}

// 나이대별 길가 풍경. near: 길 바로 옆, big: 한 줄 뒤, far: 먼 배경.
export const BIOMES = [
  { to: 7, near: ['flowers', 'flowers', 'fence', 'bush', 'round', 'flowers'], big: ['house', 'house', 'round', 'playground', 'house', 'round'], far: ['hill'] },
  { to: 19, near: ['blossom', 'blossom', 'lamp', 'flowers', 'bush', 'blossom'], big: ['school', 'house', 'blossom', 'shop', 'house', 'blossom'], far: ['hill', 'mountain'] },
  { to: 34, near: ['lamp', 'round', 'busstop', 'bench', 'round', 'bush'], big: ['building', 'shop', 'building', 'building', 'shop', 'round'], far: ['city'] },
  { to: 54, near: ['round', 'pine', 'bench', 'flowers', 'fence', 'round'], big: ['house', 'pine', 'house', 'round', 'building', 'house'], far: ['hill', 'mountain'] },
  { to: 72, near: ['autumn', 'wheat', 'autumn', 'bench', 'rock', 'wheat'], big: ['autumn', 'house', 'autumn', 'wheat', 'autumn', 'pine'], far: ['mountain', 'hill'] },
  { to: 999, near: ['lantern', 'pine', 'autumn', 'rock', 'lantern', 'wheat'], big: ['pine', 'bare', 'pine', 'house', 'bare', 'autumn'], far: ['mountain'] },
];
export const biomeOf = (age) => BIOMES.find((b) => age <= b.to) || BIOMES[BIOMES.length - 1];

const BALLOONS = ['#ff9eb5', '#ffd166', '#9ad0f5', '#b8a4f0', '#95d5b2', '#ffb4a2'];
/** 나이 표지 아치. 풍선으로 엮은 문에 "N살" 팻말을 단다. */
export function makeArch(label, half = 4.7) {
  const g = new THREE.Group();
  const parts = [cyl(0.12, 0.14, 3.2, '#fffaf0', -half, 1.6, 0, 6), cyl(0.12, 0.14, 3.2, '#fffaf0', half, 1.6, 0, 6)];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const a = (i / (n - 1)) * Math.PI;
    parts.push(blob(0.42, BALLOONS[i % BALLOONS.length], -Math.cos(a) * half, 3.2 + Math.sin(a) * 1.5, 0));
  }
  g.add(new THREE.Mesh(merge(parts), MAT));
  const c = document.createElement('canvas');
  c.width = 256; c.height = 112;
  const x = c.getContext('2d');
  x.fillStyle = '#fffdf8';
  x.beginPath(); x.roundRect(4, 4, 248, 104, 34); x.fill();
  x.lineWidth = 6; x.strokeStyle = '#ffc9b5'; x.stroke();
  x.fillStyle = '#4a4458'; x.font = '700 58px "Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(label, 128, 60);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, fog: false }));
  s.scale.set(2.6, 1.14, 1);
  s.position.set(0, 5.5, 0);
  g.add(s);
  g.userData.dispose = () => { tex.dispose(); s.material.dispose(); g.children[0].geometry.dispose(); };
  return g;
}

/** 갈림길 팻말. 고른 길은 금빛 테두리, 가지 않은 길은 흐리게. */
export function makeSign(text, mode = 'open') {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(merge([cyl(0.07, 0.09, 2.5, '#c9a98a', 0, 1.25, 0, 6)]), MAT);
  g.add(pole);
  const c = document.createElement('canvas');
  c.width = 512; c.height = 208;
  const x = c.getContext('2d');
  const words = String(text).split(' ');
  const lines = [''];
  for (const w of words) { if ((lines[lines.length - 1] + ' ' + w).trim().length > 9 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim(); }
  if (lines.length > 2) { lines[1] = lines.slice(1).join(' '); lines.length = 2; }
  x.fillStyle = mode === 'chosen' ? '#fff7dc' : '#fffdf8';
  x.beginPath(); x.roundRect(8, 8, 496, 192, 44); x.fill();
  x.lineWidth = 10; x.strokeStyle = mode === 'chosen' ? '#f5b942' : '#c9bfb4'; x.stroke();
  x.fillStyle = '#3a3448'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '700 ' + (lines.length > 1 ? 56 : 64) + 'px "Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  lines.forEach((l, i) => x.fillText(l, 256, 104 + (i - (lines.length - 1) / 2) * 70, 470));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, fog: false, transparent: true, opacity: mode === 'dim' ? 0.5 : 1 }));
  sp.scale.set(3.3, 1.34, 1);
  sp.position.set(0, 3.0, 0);
  g.add(sp);
  g.userData.dispose = () => { tex.dispose(); sp.material.dispose(); pole.geometry.dispose(); };
  return g;
}

export function cloudGeometry(v) {
  return merge([blob(2.2, '#fff', 0, 0, 0, 1.4, 0.7, 1), blob(1.6, '#fff', 2.2, -0.2, 0.3, 1.2, 0.7, 1), blob(1.4, '#fff', -2.1, -0.3, -0.2, 1.2, 0.65, 1), blob(1.3, '#fff', 0.6 + (v % 2), 0.8, 0, 1, 0.7, 1)]);
}
