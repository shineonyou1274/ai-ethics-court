// 걷는 세계. 주인공은 제자리에 있고 풍경이 다가온다.
// 나이가 곧 하루의 시간이다: 새벽에 태어나 별밤에 길을 마친다.
import * as THREE from 'three';
import { makeObject, makeArch, makeSign, cloudGeometry, biomeOf, GLOW } from './prefabs.js';
import { makePerson, makePet, heightOf } from './people.js';
import { ROLES } from './story.js';

const ROAD = 8.4;
const SLOT = 7;
const AHEAD = 150;
const BEHIND = 28;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const damp = (dt, k) => 1 - Math.exp(-dt * k);

// 인생의 몇 할을 걸었는가(f)에 따른 하늘빛
const SKY = [
  { f: 0.0, top: '#a9b8f5', hor: '#ffd8c9', sun: '#ffd0b0', sunI: 1.5, amb: 1.25, star: 0.15 },
  { f: 0.12, top: '#86c6f7', hor: '#ffeeda', sun: '#fff1d6', sunI: 2.0, amb: 1.35, star: 0 },
  { f: 0.32, top: '#58aef2', hor: '#d6f0ff', sun: '#ffffff', sunI: 2.0, amb: 1.4, star: 0 },
  { f: 0.52, top: '#6da9e6', hor: '#ffe9bd', sun: '#ffe7b0', sunI: 2.0, amb: 1.3, star: 0 },
  { f: 0.72, top: '#7a76cc', hor: '#ffb089', sun: '#ffb37a', sunI: 2.0, amb: 1.15, star: 0.05 },
  { f: 0.88, top: '#3b3f86', hor: '#e58aa0', sun: '#ff9a8a', sunI: 1.3, amb: 1.0, star: 0.55 },
  { f: 1.0, top: '#171d4a', hor: '#4a4a8f', sun: '#aab4ff', sunI: 0.9, amb: 0.95, star: 1 },
];
const GROUND = [[0, '#bfe8ae'], [18, '#9bdc97'], [40, '#9fd08a'], [58, '#d6cf86'], [74, '#d9c690'], [95, '#b9bfa6']];

// 갈림길에서 길이 옆으로 휘는 폭, 휘기 시작하는 거리, 휘는 구간의 길이
const BEND = 13, RAMP0 = 6, RAMP = 30;

const FORM = [[-1.4, 0.5], [1.4, 0.7], [-2.7, 1.2], [2.7, 1.0], [-3.9, 1.9], [3.9, 2.1], [-2.0, 2.7], [2.0, 2.9], [0, 3.3]];

const CAMS = {
  walk: { p: [0, 3.5, 8.8], l: [0, 1.5, -8] },
  card: { p: [2.6, 3.0, 7.8], l: [0, 1.3, -5] },
  front: { p: [-3.6, 2.3, -8.0], l: [0, 1.15, 0.6] },
  meet: { p: [-3.0, 2.7, 6.8], l: [1.5, 1.2, -2.6] },
  title: { p: [1.6, 2.3, 8.6], l: [0, 2.0, -10] },
  finale: { p: [0, 2.6, 10], l: [0, 1.6, -6] },
  sky: { p: [0, 2.0, 9], l: [0, 26, -34] },
  fork: { p: [0, 6.2, 10.5], l: [0, 0.6, -20] },
  high: { p: [0, 15, 17], l: [0, 0, -30] },
};

function dotTexture(soft = 0.5) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(soft, 'rgba(255,255,255,.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  return t;
}

export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const lowEnd = (navigator.hardwareConcurrency || 4) <= 4;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2));
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#ffffff', 46, 150);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 900);

  const hemi = new THREE.HemisphereLight('#ffffff', '#cfe8c0', 1.3);
  const sun = new THREE.DirectionalLight('#ffffff', 2);
  const fill = new THREE.DirectionalLight('#ffffff', 1.1);
  fill.position.set(-30, 30, -70);
  scene.add(hemi, sun, fill);

  // 하늘
  const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() } };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(500, 24, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 hor; varying float h; void main(){ float t = smoothstep(-0.02, 0.55, h); gl_FragColor = vec4(mix(hor, top, t), 1.0);\n#include <colorspace_fragment>\n}',
    }),
  );
  sky.renderOrder = -10;
  scene.add(sky);
  const dot = dotTexture(0.35);
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(0.22), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
  sunSprite.scale.setScalar(110);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(0.7), color: '#fff6d8', fog: false, depthWrite: false, transparent: true }));
  moon.scale.setScalar(22);
  moon.position.set(90, 150, -330);
  scene.add(sunSprite, moon);

  const starGeo = new THREE.BufferGeometry();
  {
    const n = 520, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = hash(i * 1.7) * Math.PI * 2, v = Math.acos(hash(i * 3.3) * 0.92);
      a[i * 3] = Math.sin(v) * Math.cos(u) * 420; a[i * 3 + 1] = Math.cos(v) * 420 + 6; a[i * 3 + 2] = Math.sin(v) * Math.sin(u) * 420;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(a, 3));
  }
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ map: dot, size: 3.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false, color: '#fff7df' }));
  scene.add(stars);

  const cloudMat = new THREE.MeshBasicMaterial({ color: '#fff', fog: false, transparent: true, opacity: 0.92 });
  const clouds = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(cloudGeometry(i), cloudMat);
    m.position.set(lerp(-150, 150, hash(i * 9.1)), lerp(34, 70, hash(i * 2.3)), lerp(-120, -300, hash(i * 5.7)));
    m.scale.setScalar(lerp(2.2, 4.4, hash(i * 4.1)));
    scene.add(m); clouds.push(m);
  }

  // 땅과 길
  const groundMat = new THREE.MeshLambertMaterial({ color: '#bfe8ae' });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2), groundMat);
  const roadMat = new THREE.MeshLambertMaterial({ color: '#fdebd8' });
  const edgeMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  // 길은 곧은 평면이 아니라, 걸을 때마다 다시 놓이는 띠다. 그래서 굽이치고 갈라질 수 있다.
  function makeRibbon(n, mat) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array((n + 1) * 6), nor = new Float32Array((n + 1) * 6), idx = [];
    for (let i = 0; i <= n; i++) { nor[i * 6 + 1] = 1; nor[i * 6 + 4] = 1; if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return {
      mesh, n,
      set(i, xl, xr, y, z) { pos[i * 6] = xl; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z; pos[i * 6 + 3] = xr; pos[i * 6 + 4] = y; pos[i * 6 + 5] = z; },
      done() { geo.attributes.position.needsUpdate = true; },
      dispose() { scene.remove(mesh); geo.dispose(); },
    };
  }
  const RN = 100;
  const road = makeRibbon(RN, roadMat), e1 = makeRibbon(RN, edgeMat), e2 = makeRibbon(RN, edgeMat);
  scene.add(ground);

  // 주인공
  const walker = makePerson({ color: '#ff9f8a' });
  scene.add(walker.group);

  // 흩날리는 것들
  const PN = lowEnd ? 180 : 280;
  const pPos = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) { pPos[i * 3] = lerp(-16, 16, hash(i * 1.1)); pPos[i * 3 + 1] = hash(i * 2.2) * 11; pPos[i * 3 + 2] = lerp(-36, 8, hash(i * 3.3)); }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ map: dot, size: 0.3, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const particles = new THREE.Points(pGeo, pMat);
  particles.frustumCulled = false;
  scene.add(particles);
  const FX = {
    petals: { color: '#ffc4d6', size: 0.26, fall: 0.9, sway: 0.9, op: 0.95 },
    motes: { color: '#ffffff', size: 0.14, fall: 0.08, sway: 0.4, op: 0.55 },
    leaves: { color: '#f6a55c', size: 0.28, fall: 1.3, sway: 1.2, op: 0.95 },
    fireflies: { color: '#fff3a0', size: 0.24, fall: -0.15, sway: 0.7, op: 0.95 },
    rain: { color: '#8fb8ee', size: 0.2, fall: 19, sway: 0, op: 0.95 },
  };
  let fxMode = 'petals', fxShown = 'petals', fxFade = 0;

  // 마지막 장면의 별
  const starSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(0.15), color: '#fff3c4', fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending, opacity: 0 }));
  scene.add(starSprite);
  const spirits = [];

  const orbs = [];
  const orbGeo = new THREE.SphereGeometry(0.11, 10, 8);

  const S = {
    dist: -400, walking: false, lifespan: 85, weather: 'clear', wet: 0, cam: 'title', ageOverride: null,
    finaleOn: false, fin: 0, t: 0, speed: 0, cruise: 0, onFrame: null, labels: true,
  };
  let stops = [{ dist: 0, age: 0 }];
  let tween = null;
  let camSnap = true;
  let shownAge = null;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), tp = new THREE.Vector3(), tl = new THREE.Vector3();
  const inset = { b: 0, r: 0, tb: 0, tr: 0 };

  // ── 길의 굽이와 갈림길 ──
  let forks = [];
  const bendOf = (f, d) => BEND * smooth(d, f.dist + RAMP0, f.dist + RAMP0 + RAMP);
  const meander = (d) => Math.sin(d * 0.021) * 2.4 + Math.sin(d * 0.0083 + 1.3) * 3.2;
  function lane(d, skip) {
    let x = meander(d);
    for (const f of forks) if (f !== skip && f.done && f.dir) x += f.dir * bendOf(f, d);
    return x;
  }
  let L0 = 0; // 주인공이 선 자리의 굽이. 모든 것은 여기서 본 위치에 놓인다.
  const inForkZone = (d) => forks.some((f) => d > f.dist + 1 && d < f.dist + RAMP0 + RAMP + 12);

  const forkDecor = new Map();
  function dropFork(id) {
    const fd = forkDecor.get(id);
    if (!fd) return;
    for (const st of fd.stubs) { st.rib.dispose(); st.e1.dispose(); st.e2.dispose(); scene.remove(st.tree); }
    for (const sg of fd.signs) { scene.remove(sg.o); sg.o.userData.dispose(); }
    forkDecor.delete(id);
  }
  function syncForks() {
    for (const f of forks) {
      const near = f.dist > S.dist - 70 && f.dist < S.dist + AHEAD;
      const key = f.done + '|' + f.dir;
      let fd = forkDecor.get(f.id);
      if (fd && (!near || fd.key !== key)) { dropFork(f.id); fd = null; }
      if (!near) continue;
      const active = f.done ? f.dir : 0;
      if (!fd) {
        fd = { key, stubs: [], signs: [] };
        for (const o of f.options) {
          if (o.dir !== active && !fd.stubs.some((x) => x.dir === o.dir)) {
            const tree = makeObject(o.dir ? 'round' : 'pine', Math.abs(Math.round(f.dist)) % 6);
            tree.scale.setScalar(1.5);
            scene.add(tree);
            fd.stubs.push({ dir: o.dir, rib: makeRibbon(19, roadMat), e1: makeRibbon(19, edgeMat), e2: makeRibbon(19, edgeMat), tree });
          }
          const sg = makeSign(o.label, f.done ? (o.dir === active && o.label === f.chosen ? 'chosen' : 'dim') : 'open');
          scene.add(sg);
          fd.signs.push({ dir: o.dir, o: sg, n: fd.signs.filter((x) => x.dir === o.dir).length });
        }
        forkDecor.set(f.id, fd);
      }
      const base = (d) => lane(d, f) - L0;
      for (const st of fd.stubs) {
        for (let i = 0; i <= 19; i++) {
          const d = f.dist + i * 2;
          const x = base(d) + st.dir * bendOf(f, d), z = -(d - S.dist);
          st.rib.set(i, x - ROAD / 2, x + ROAD / 2, 0.035, z);
          st.e1.set(i, x - ROAD / 2 - 0.14, x - ROAD / 2 + 0.14, 0.06, z);
          st.e2.set(i, x + ROAD / 2 - 0.14, x + ROAD / 2 + 0.14, 0.06, z);
        }
        st.rib.done(); st.e1.done(); st.e2.done();
        const de = f.dist + 41;
        st.tree.position.set(base(de) + st.dir * bendOf(f, de), 0, -(de - S.dist));
      }
      for (const sg of fd.signs) {
        const d = f.dist + RAMP0 + (sg.dir ? 20 : 31) + sg.n * 5;
        const side = sg.dir || -1;
        sg.o.position.set(base(d) + sg.dir * bendOf(f, d) + side * (ROAD / 2 + 1.3), 0, -(d - S.dist));
      }
    }
    for (const id of [...forkDecor.keys()]) if (!forks.some((f) => f.id === id)) dropFork(id);
  }

  // ── 길 위에 남긴 점과, 점을 잇는 빛줄기 ──
  const dots = new Map();
  const dotGeo = new THREE.SphereGeometry(0.17, 12, 10);
  const stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 1, 5);
  const stemMat = new THREE.MeshBasicMaterial({ color: '#fffaf0' });
  function setDots(list) {
    const ids = new Set(list.map((x) => x.id));
    for (const [id, o] of dots) if (!ids.has(id)) { scene.remove(o.g); o.m.material.dispose(); o.halo.material.dispose(); dots.delete(id); }
    const seen = {};
    for (const it of list) {
      const n = (seen[it.dist] = (seen[it.dist] || 0) + 1) - 1;
      let o = dots.get(it.id);
      if (!o) {
        const g = new THREE.Group();
        const m = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: it.color, fog: false }));
        m.position.y = 1.05;
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: it.color, transparent: true, opacity: 0.6, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
        halo.scale.setScalar(1.1); halo.position.y = 1.05;
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.5;
        g.add(m, halo, stem); scene.add(g);
        o = { g, m, halo, born: 0 };
        dots.set(it.id, o);
      }
      o.m.material.color.set(it.color); o.halo.material.color.set(it.color);
      o.d = it.dist + 2 + n * 1.3;
      o.side = n % 2 ? -1 : 1;
    }
  }
  const dotX = (o) => lane(o.d) - L0 + o.side * (ROAD / 2 + 0.85);
  const links = new Map();
  const LN = 28;
  function setLinks(list) {
    const keys = new Set(list.map((l) => l.from + '>' + l.to));
    for (const [k, o] of links) if (!keys.has(k)) { scene.remove(o.line); o.line.geometry.dispose(); o.line.material.dispose(); links.delete(k); }
    for (const l of list) {
      const k = l.from + '>' + l.to;
      if (links.has(k)) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((LN + 1) * 3), 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: l.color || '#ffe9a8', transparent: true, opacity: 0.9, fog: false, depthWrite: false }));
      line.frustumCulled = false;
      scene.add(line);
      links.set(k, { line, a: l.fromDist + 2, b: l.toDist, grow: 0 });
    }
  }
  function updateLights(dt) {
    for (const o of dots.values()) {
      o.born = Math.min(1, o.born + dt * 1.6);
      const k = ease(o.born);
      o.g.position.set(dotX(o), 0, -(o.d - S.dist));
      o.g.scale.setScalar(0.3 + 0.7 * k);
      o.halo.scale.setScalar(1.1 + Math.sin(S.t * 2.2 + o.d) * 0.18);
    }
    for (const o of links.values()) {
      o.grow = Math.min(1, o.grow + dt * 0.55);
      const arr = o.line.geometry.attributes.position.array;
      const len = Math.abs(o.b - o.a), H = Math.min(11, 2.6 + len * 0.03);
      const xa = lane(o.a) - L0 + ROAD / 2 + 0.85, xb = lane(o.b) - L0;
      for (let i = 0; i <= LN; i++) {
        const t = i / LN, d = lerp(o.a, o.b, t);
        arr[i * 3] = lerp(xa, xb, t) + (lane(d) - L0 - lerp(lane(o.a) - L0, lane(o.b) - L0, t)) * 0.6;
        arr[i * 3 + 1] = lerp(1.05, 1.5, t) + Math.sin(Math.PI * t) * H;
        arr[i * 3 + 2] = -(d - S.dist);
      }
      o.line.geometry.attributes.position.needsUpdate = true;
      o.line.geometry.setDrawRange(0, Math.max(2, Math.round((LN + 1) * ease(o.grow))));
      o.line.material.opacity = 0.65 + Math.sin(S.t * 1.8 + o.a) * 0.2;
    }
  }

  function ageAt(d) {
    if (d <= stops[0].dist) return stops[0].age;
    for (let i = 1; i < stops.length; i++) {
      if (d <= stops[i].dist) {
        const a = stops[i - 1], b = stops[i];
        return lerp(a.age, b.age, (d - a.dist) / Math.max(0.001, b.dist - a.dist));
      }
    }
    return stops[stops.length - 1].age;
  }

  // ── 길가 풍경 ──
  const slots = new Map();
  function place(list, type, v, d, x, ry, scale = 1) {
    const o = makeObject(type, v);
    o.rotation.y = ry;
    if (scale !== 1) o.scale.setScalar(scale);
    scene.add(o);
    list.push({ o, d, x });
  }
  function fillSlot(k) {
    const d = k * SLOT, list = [];
    const biome = biomeOf(ageAt(d));
    for (const side of [-1, 1]) {
      const s = k * 2 + side;
      const zone = inForkZone(d);
      if (!zone && hash(s * 1.37) < 0.82) {
        const type = biome.near[Math.floor(hash(s * 3.11) * 6)];
        const tight = type === 'fence' || type === 'lamp' || type === 'lantern';
        const x = side * (ROAD / 2 + (tight ? 0.9 : 1.5 + hash(s * 7.7) * 2.6));
        const ry = type === 'lamp' ? (side > 0 ? Math.PI : 0) : type === 'fence' ? 0 : type === 'bench' || type === 'busstop' ? -side * Math.PI / 2 : hash(s * 5.1) * 6.28;
        place(list, type, Math.floor(hash(s * 9.9) * 6), d + hash(s * 2.9) * 3, x, ry);
      }
      if (!zone && (k & 1) === 0) {
        const type = biome.big[Math.floor(hash(s * 4.71) * 6)];
        const x = side * (ROAD / 2 + 8.5 + hash(s * 6.3) * 4.5);
        place(list, type, Math.floor(hash(s * 8.3) * 6), d, x, -side * Math.PI / 2);
      }
      if (k % 5 === 0) {
        const type = biome.far[Math.floor(hash(s * 2.21) * biome.far.length)];
        place(list, type, Math.floor(hash(s * 6.1) * 6), d, side * (44 + hash(s * 3.9) * 30), hash(s) * 6.28);
      }
    }
    place(list, 'pebble', k % 6, d, 0, 0);
    slots.set(k, list);
  }
  function dropSlot(k) {
    for (const it of slots.get(k)) scene.remove(it.o);
    slots.delete(k);
  }
  function clearSlots(from = -Infinity) {
    for (const k of [...slots.keys()]) if (k * SLOT >= from) dropSlot(k);
  }

  // 나이 표지와 마지막 나무
  const marks = new Map();
  function syncMarks() {
    const want = new Set();
    for (const s of stops) {
      if (!s.label && !s.final) continue;
      const d = s.dist + 5;
      if (d < S.dist - BEHIND || d > S.dist + AHEAD) continue;
      const key = s.dist + '|' + (s.label || 'final');
      want.add(key);
      if (!marks.has(key)) {
        let o;
        if (s.final) { o = makeObject('bigtree', 0); o.userData.x = -8.5; o.userData.d = s.dist + 7; } else { o = makeArch(s.label, ROAD / 2 + 0.5); o.userData.x = 0; o.userData.d = d; }
        scene.add(o); marks.set(key, o);
      }
    }
    for (const [key, o] of marks) {
      if (!want.has(key)) { scene.remove(o); if (o.userData.dispose) o.userData.dispose(); marks.delete(key); continue; }
      o.position.set(o.userData.x + lane(o.userData.d) - L0, 0, -(o.userData.d - S.dist));
    }
  }

  // ── 함께 걷는 사람들 ──
  const comps = new Map();
  function makeComp(item) {
    const r = ROLES[item.role] || ROLES.custom;
    const p = r.pet ? makePet({ color: r.color, label: item.label }) : makePerson({ color: r.color, hair: Math.floor(hash(item.id.length * 7.3 + item.label.length) * 4), label: item.label });
    scene.add(p.group);
    return { id: item.id, role: item.role, label: item.label, pet: !!r.pet, p, x: 0, z: 9, wait: null, leaving: 0, slot: 0, born: 0 };
  }
  function setParty(list, { instant = false, depart = false } = {}) {
    const ids = new Set(list.map((x) => x.id));
    for (const [id, c] of comps) {
      if (ids.has(id) || c.leaving) continue;
      if (depart && !instant && !c.pet) { c.leaving = 0.001; c.id = id + '#gone'; comps.delete(id); comps.set(c.id, c); } else { scene.remove(c.p.group); c.p.dispose(); comps.delete(id); }
    }
    let n = 0;
    for (const item of list) {
      let c = comps.get(item.id);
      const r = ROLES[item.role] || ROLES.custom;
      if (c && (c.pet !== !!r.pet)) { scene.remove(c.p.group); c.p.dispose(); comps.delete(item.id); c = null; }
      if (!c) {
        c = makeComp(item);
        comps.set(item.id, c);
        const f = FORM[n % FORM.length];
        if (item.wait != null) { c.x = 3.0; c.z = -(item.wait - S.dist); } else if (instant) { c.x = f[0]; c.z = f[1]; c.born = 1; } else { c.x = f[0] * 1.6; c.z = 11; }
      } else if (c.role !== item.role || c.label !== item.label) {
        c.role = item.role; c.label = item.label;
        c.p.setColor(r.color); c.p.setLabel(item.label);
      }
      c.wait = item.wait != null ? item.wait : null;
      if (c.wait == null) { c.slot = n; n++; if (instant) { const f = FORM[c.slot % FORM.length]; c.x = f[0]; c.z = f[1]; } }
    }
  }
  function updateParty(dt, wAge) {
    for (const [id, c] of comps) {
      const r = ROLES[c.role] || ROLES.custom;
      const p = c.p;
      p.setAge(clamp(wAge + r.rel, 3, 96));
      p.umbrella = S.wet > 0.5 && !c.pet;
      c.born = Math.min(1, c.born + dt * 2);
      if (c.leaving) {
        c.leaving += dt / 3.2;
        p.waving = true; p.walking = false;
        c.z += S.speed * dt;
        p.setOpacity(1 - smooth(c.leaving, 0.25, 1));
        if (c.leaving > 0.3 && !c.spirit) { c.spirit = true; addSpirit(c.x, c.z); }
        if (c.leaving >= 1) { scene.remove(p.group); p.dispose(); comps.delete(id); continue; }
      } else if (c.wait != null) {
        c.x = lerp(c.x, 3.0 + lane(c.wait) - L0, damp(dt, 6)); c.z = -(c.wait - S.dist);
        p.walking = false; p.waving = c.z > -16;
        p.group.rotation.y = lerp(p.group.rotation.y, Math.PI * 0.92, damp(dt, 4));
        p.setOpacity(1);
      } else {
        const f = FORM[c.slot % FORM.length];
        const dx = f[0] - c.x, dz = f[1] - c.z;
        const far = Math.hypot(dx, dz);
        c.x += dx * damp(dt, 2.4); c.z += dz * damp(dt, 2.4);
        p.walking = S.walking || far > 0.2;
        p.waving = S.fin > 0.12 && S.fin < 0.97;
        const turn = S.cam === 'front' && !S.walking ? 0 : far > 0.6 ? Math.atan2(-dx, -dz) : 0;
        p.group.rotation.y = lerp(p.group.rotation.y, turn, damp(dt, 5));
        p.setOpacity(1);
      }
      const lt = S.labels ? c.label : '';
      if (c.shownLabel !== lt) { c.shownLabel = lt; p.setLabel(lt); }
      p.group.position.set(c.x, 0, c.z);
      p.update(dt, S.t);
    }
  }
  function addSpirit(x, z) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#fff3c4', fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    s.position.set(x, 1.4, z); s.scale.setScalar(0.9);
    s.userData.t = 0;
    scene.add(s); spirits.push(s);
  }

  function setOrbs(colors) {
    while (orbs.length > colors.length) { const o = orbs.pop(); scene.remove(o); o.material.dispose(); o.children[0].material.dispose(); }
    colors.forEach((c, i) => {
      if (!orbs[i]) {
        const m = new THREE.Mesh(orbGeo, new THREE.MeshBasicMaterial({ color: c, fog: false }));
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: c, transparent: true, opacity: 0.55, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
        halo.scale.setScalar(0.85);
        m.add(halo); scene.add(m); orbs[i] = m;
      }
      orbs[i].material.color.set(c); orbs[i].children[0].material.color.set(c);
    });
  }

  // ── 하늘빛 ──
  const cA = new THREE.Color(), cB = new THREE.Color(), cTop = new THREE.Color(), cHor = new THREE.Color(), cSun = new THREE.Color(), cGray = new THREE.Color('#8f9bb5'), cG = new THREE.Color();
  const glowDay = new THREE.Color('#bfe4f7'), glowNight = new THREE.Color('#ffe7a0');
  function applySky(age) {
    const f = clamp(age / S.lifespan, 0, 1);
    let i = 1;
    while (i < SKY.length - 1 && f > SKY[i].f) i++;
    const a = SKY[i - 1], b = SKY[i];
    const t = clamp((f - a.f) / (b.f - a.f), 0, 1);
    cTop.lerpColors(cA.set(a.top), cB.set(b.top), t);
    cHor.lerpColors(cA.set(a.hor), cB.set(b.hor), t);
    cSun.lerpColors(cA.set(a.sun), cB.set(b.sun), t);
    const w = S.wet * 0.62;
    cTop.lerp(cGray, w); cHor.lerp(cA.set('#c9d2e0'), w);
    skyU.top.value.copy(cTop); skyU.hor.value.copy(cHor);
    scene.fog.color.copy(cHor).lerp(cTop, 0.3);
    const star = lerp(a.star, b.star, t) * (1 - S.wet);
    stars.material.opacity = star;
    moon.material.opacity = smooth(f, 0.8, 0.95) * (1 - S.wet);
    sun.color.copy(cSun); sun.intensity = lerp(a.sunI, b.sunI, t) * (1 - w * 0.5);
    hemi.intensity = lerp(a.amb, b.amb, t) * 1.45;
    fill.intensity = lerp(a.amb, b.amb, t) * 0.8;
    fill.color.copy(cHor).lerp(cA.set('#ffffff'), 0.5);
    hemi.color.copy(cTop).lerp(cA.set('#ffffff'), 0.55);
    const sy = Math.sin(Math.PI * clamp(f * 1.08, 0, 1));
    sunSprite.position.set(lerp(-130, 150, f), sy * 190 - 6, -360);
    sunSprite.material.color.copy(cSun);
    sunSprite.material.opacity = (1 - w) * (1 - smooth(f, 0.86, 0.96));
    sun.position.set(sunSprite.position.x * 0.4, Math.max(50, sunSprite.position.y), 70);
    cloudMat.color.copy(cA.set('#ffffff')).lerp(cHor, 0.35 + smooth(f, 0.6, 1) * 0.45).lerp(cGray, w);
    const night = Math.max(smooth(f, 0.66, 0.9), S.wet * 0.7);
    GLOW.color.lerpColors(glowDay, glowNight, night);
    // 땅 색은 계절처럼 흐른다
    let gi = 1;
    while (gi < GROUND.length - 1 && age > GROUND[gi][0]) gi++;
    const g0 = GROUND[gi - 1], g1 = GROUND[gi];
    cG.lerpColors(cA.set(g0[1]), cB.set(g1[1]), clamp((age - g0[0]) / (g1[0] - g0[0]), 0, 1));
    groundMat.color.copy(cG);
    hemi.groundColor.copy(cG).lerp(cA.set('#fff1e6'), 0.6);
    return f;
  }

  function updateParticles(dt, age) {
    const want = S.wet > 0.35 ? 'rain' : age < 20 ? 'petals' : age < 46 ? 'motes' : age < 72 ? 'leaves' : 'fireflies';
    fxMode = want;
    if (fxShown !== fxMode) { fxFade -= dt * 2.5; if (fxFade <= 0) { fxShown = fxMode; fxFade = 0; } } else fxFade = Math.min(1, fxFade + dt * 1.5);
    const m = FX[fxShown];
    pMat.color.set(m.color); pMat.size = m.size; pMat.opacity = m.op * fxFade;
    const rain = fxShown === 'rain';
    for (let i = 0; i < PN; i++) {
      const j = i * 3;
      const ph = i * 1.37;
      pPos[j] += (Math.sin(S.t * 0.9 + ph) * m.sway + (rain ? -2 : 0)) * dt;
      pPos[j + 1] -= m.fall * (0.7 + hash(i) * 0.6) * dt - (fxShown === 'fireflies' ? Math.sin(S.t * 1.7 + ph) * 0.4 * dt : 0);
      pPos[j + 2] += S.speed * dt;
      if (pPos[j + 1] < 0) { pPos[j + 1] += 11; pPos[j] = lerp(-16, 16, hash(i + S.t)); }
      if (pPos[j + 1] > 11) pPos[j + 1] -= 11;
      if (pPos[j + 2] > 8) pPos[j + 2] -= 44;
      if (pPos[j + 2] < -36) pPos[j + 2] += 44;
      if (pPos[j] > 16) pPos[j] -= 32;
      if (pPos[j] < -16) pPos[j] += 32;
    }
    pGeo.attributes.position.needsUpdate = true;
  }

  function size() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
    }
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 58 : 46;
    return [w, h];
  }

  let last = performance.now();
  let prevDist = S.dist;
  function frame(nowMs) {
    requestAnimationFrame(frame);
    let dt = Math.min(0.05, (nowMs - last) / 1000);
    last = nowMs;
    if (document.hidden) return;
    S.t += dt;

    if (tween) {
      tween.t += dt;
      const k = clamp(tween.t / tween.dur, 0, 1);
      S.dist = lerp(tween.from, tween.to, ease(k));
      S.walking = k < 0.985;
      if (k >= 1) { const r = tween.resolve; tween = null; S.walking = false; r(); }
    } else if (S.cruise) { S.dist += S.cruise * dt; S.walking = true; }
    S.speed = (S.dist - prevDist) / Math.max(dt, 0.001);
    prevDist = S.dist;
    S.wet = lerp(S.wet, S.weather === 'rain' ? 1 : 0, damp(dt, 1.2));

    const age = ageAt(S.dist);
    const f = applySky(age);
    const wTarget = S.ageOverride != null ? S.ageOverride : age;
    shownAge = camSnap || shownAge == null ? wTarget : lerp(shownAge, wTarget, damp(dt, 2.2));
    const wAge = shownAge;

    // 풍경
    const k0 = Math.floor((S.dist - BEHIND) / SLOT), k1 = Math.floor((S.dist + AHEAD) / SLOT);
    for (const k of [...slots.keys()]) if (k < k0 || k > k1) dropSlot(k);
    let made = 0;
    for (let k = k0; k <= k1; k++) if (!slots.has(k)) { fillSlot(k); if (++made > 6 && !camSnap) break; }
    L0 = lane(S.dist);
    for (const list of slots.values()) for (const it of list) it.o.position.set(it.x + lane(it.d) - L0, 0, -(it.d - S.dist));
    const rb = Math.floor(S.dist / 2) * 2 - 30;
    for (let i = 0; i <= RN; i++) {
      const d = rb + i * 2, x = lane(d) - L0, z = -(d - S.dist);
      road.set(i, x - ROAD / 2, x + ROAD / 2, 0.04, z);
      e1.set(i, x - ROAD / 2 - 0.14, x - ROAD / 2 + 0.14, 0.07, z);
      e2.set(i, x + ROAD / 2 - 0.14, x + ROAD / 2 + 0.14, 0.07, z);
    }
    road.done(); e1.done(); e2.done();
    syncForks();
    updateLights(dt);
    syncMarks();

    // 주인공
    S.fin = clamp(S.fin + (S.finaleOn ? dt / 7 : -dt * 1.5), 0, 1);
    walker.setAge(wAge);
    walker.walking = S.walking;
    walker.umbrella = S.wet > 0.5;
    walker.setOpacity(1 - smooth(S.fin, 0.2, 0.62));
    // 길이 휘는 쪽으로 몸을 돌린다
    const heading = S.walking ? -Math.atan((lane(S.dist + 2) - lane(S.dist - 2)) / 4) : 0;
    walker.group.rotation.y = lerp(walker.group.rotation.y, heading, damp(dt, 4));
    walker.update(dt, S.t);
    updateParty(dt, wAge);

    const hgt = heightOf(wAge);
    orbs.forEach((o, i) => {
      const a = S.t * 0.9 + (i * Math.PI * 2) / orbs.length;
      o.position.set(Math.cos(a) * 0.8, hgt * 2.2 + 0.55 + Math.sin(S.t * 1.6 + i) * 0.1 + ease(S.fin) * 14, Math.sin(a) * 0.8);
    });
    starSprite.material.opacity = smooth(S.fin, 0.18, 0.4);
    starSprite.position.set(0, lerp(1.6, 46, ease(smooth(S.fin, 0.2, 1))), lerp(0, -40, smooth(S.fin, 0.2, 1)));
    starSprite.scale.setScalar(lerp(1.6, 7, smooth(S.fin, 0.2, 1)) * (1 + Math.sin(S.t * 3) * 0.06));
    for (let i = spirits.length - 1; i >= 0; i--) {
      const s = spirits[i];
      s.userData.t += dt;
      s.position.y += dt * (1.2 + s.userData.t * 0.9);
      s.position.z += S.speed * dt * 0.4;
      s.material.opacity = 1 - smooth(s.userData.t, 4.5, 7);
      if (s.userData.t > 7) { scene.remove(s); s.material.dispose(); spirits.splice(i, 1); }
    }
    updateParticles(dt, age);
    clouds.forEach((c, i) => { c.position.x += dt * (0.5 + i * 0.07); if (c.position.x > 190) c.position.x = -190; });

    // 카메라
    const [w, h] = size();
    const cm = CAMS[S.cam] || CAMS.walk;
    const wide = w / h < 0.8 ? 1.1 : 1;
    const hs = lerp(0.72, 1, hgt);
    tp.set(cm.p[0] * wide, cm.p[1] * lerp(0.8, 1, hgt), cm.p[2] * wide * lerp(0.66, 1, hgt));
    tl.set(cm.l[0], cm.l[1] * hs, cm.l[2]);
    // 카드가 화면을 많이 가릴수록 물러나서 일행이 다 보이게 한다
    const zoom = 1 + 1.25 * clamp(inset.tb / h, 0, 0.7) + 0.5 * clamp(inset.tr / w, 0, 0.5);
    tp.sub(tl).multiplyScalar(zoom).add(tl);
    tp.x = clamp(tp.x, -3.7, 3.7); // 길가 나무 속으로 들어가지 않게
    scene.fog.near = 55 + tp.length(); scene.fog.far = scene.fog.near + 105;
    if (S.cam === 'finale') tl.y = lerp(1.5, 13, ease(smooth(S.fin, 0.15, 0.9)));
    if (S.cam === 'meet') { let wz = -5; for (const c of comps.values()) if (c.wait != null) wz = clamp(c.z, -14, -2); tl.z = wz * 0.6; }
    tp.y += Math.sin(S.t * 0.8) * 0.05;
    const kc = camSnap ? 1 : damp(dt, 1.9);
    camPos.lerp(tp, kc); camLook.lerp(tl, kc);
    camera.position.copy(camPos); camera.lookAt(camLook);
    const ki = camSnap ? 1 : damp(dt, 5);
    inset.b = lerp(inset.b, inset.tb, ki); inset.r = lerp(inset.r, inset.tr, ki);
    if (inset.b > 1 || inset.r > 1) camera.setViewOffset(w, h, inset.r / 2, inset.b / 2, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    camSnap = false;
    sky.position.copy(camera.position);
    void f;

    renderer.render(scene, camera);
    if (S.onFrame) S.onFrame(dt);
  }
  requestAnimationFrame(frame);

  return {
    state: S, canvas, walker,
    ageAt,
    get age() { return ageAt(S.dist); },
    setTimeline(list) {
      const changed = JSON.stringify(list) !== JSON.stringify(stops);
      stops = list.length ? list : [{ dist: 0, age: 0 }];
      if (changed) clearSlots(S.dist + 50);
    },
    setLook(look) { walker.setColor(look.color); walker.setHair(look.hair); },
    setParty, setOrbs,
    setWeather(w) { S.weather = w || 'clear'; },
    setCamera(mode) { S.cam = mode; },
    setInset(b, r) { inset.tb = b; inset.tr = r; },
    setFinale(on) { S.finaleOn = on; },
    setForks(list) {
      const sig = (x) => x.map((f) => f.id + ':' + f.dist).join(',');
      const moved = sig(list) !== sig(forks);
      forks = list;
      if (moved) clearSlots();
    },
    setDots, setLinks,
    walkTo(d, secs) {
      if (tween) { const r = tween.resolve; tween = null; r(); }
      S.cruise = 0;
      if (Math.abs(d - S.dist) < 0.05) return Promise.resolve();
      return new Promise((resolve) => { tween = { from: S.dist, to: d, t: 0, dur: secs, resolve }; });
    },
    setDist(d, walking = true) { if (tween) { const r = tween.resolve; tween = null; r(); } S.cruise = 0; S.dist = d; S.walking = walking; },
    jump(d) {
      if (tween) { const r = tween.resolve; tween = null; r(); }
      S.cruise = 0; S.dist = d; prevDist = d; S.walking = false; camSnap = true;
      S.wet = S.weather === 'rain' ? 1 : 0;
      clearSlots();
      for (const c of comps.values()) if (c.wait == null && !c.leaving) { const f = FORM[c.slot % FORM.length]; c.x = f[0]; c.z = f[1]; }
    },
    snap() { camSnap = true; },
    cruise(v) { S.cruise = v; },
  };
}
