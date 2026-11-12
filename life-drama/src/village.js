// 내 인생 마을: 걸어온 길에 생긴 것들이 떠 있는 작은 섬 하나에 모인다.
// 길은 섬 가장자리(태어난 날)에서 가운데 언덕(마지막 날)으로 감겨 들어간다.
import * as THREE from 'three';
import { makeObject, cloudGeometry } from './prefabs.js';
import { makePerson, makePet } from './people.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const backOut = (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

const BIG = { school: [0.42, 2.2], building: [0.42, 1.2], shop: [0.7, 1.6], house: [0.72, 1.5], myhome: [0.48, 2.3], car: [0.6, 1.3], balloon: [0.42, 1.2] };
const TURNS = 1.25;
const FONT = '"Jua", "Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

function textSprite(text, { bg = 'rgba(255,253,248,.94)', fg = '#4a4458', size = 40 } = {}) {
  const c = document.createElement('canvas');
  let x = c.getContext('2d');
  x.font = `${size}px ${FONT}`;
  const w = Math.ceil(x.measureText(text).width) + size * 1.1;
  c.width = w; c.height = Math.round(size * 1.7);
  x = c.getContext('2d');
  x.font = `${size}px ${FONT}`;
  x.fillStyle = bg; x.beginPath(); x.roundRect(0, 0, w, c.height, c.height / 2); x.fill();
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, c.height / 2 + size * 0.06);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.renderOrder = 9;
  sp.userData.aspect = w / c.height;
  return sp;
}

export function createVillage(canvas, data, { still = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(still ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  scene.add(root);
  scene.add(new THREE.HemisphereLight('#ffffff', '#ffe6d0', 1.75));
  const sun = new THREE.DirectionalLight('#fff4e0', 1.9);
  sun.position.set(-14, 26, 18);
  scene.add(sun);
  const trash = []; // 이 화면만 쓰는 도형과 재질
  const own = (o) => { trash.push(o); return o; };

  const n = data.items.length;
  const smalls = data.items.filter((x) => !x.big), bigs = data.items.filter((x) => x.big);
  // 담을 것이 많을수록 섬이 넓어진다
  const need = Math.max(bigs.reduce((s, x) => s + (BIG[x.kind] || [1, 1.6])[1] * 2 + 0.7, 0), smalls.length * 2.2, data.people.length * 1.5 + 4);
  const R0 = clamp(need / (2 * Math.PI * TURNS * 0.6) + 1.5, 6.6, 14);
  const R = R0 + 3.2;

  // ── 섬 ──
  const lam = (c) => own(new THREE.MeshLambertMaterial({ color: c }));
  const mesh = (geo, mat, y = 0) => { const m = new THREE.Mesh(own(geo), mat); m.position.y = y; root.add(m); return m; };
  mesh(new THREE.CylinderGeometry(R, R * 0.97, 0.9, 48), lam('#bfe8ae'), -0.45);
  mesh(new THREE.CylinderGeometry(R * 0.97, R * 0.8, 1.5, 48), lam('#f1cfa0'), -1.65);
  mesh(new THREE.CylinderGeometry(R * 0.8, R * 0.3, 3.4, 48), lam('#e2b384'), -4.1);
  mesh(new THREE.ConeGeometry(R * 0.3, 2, 24).rotateX(Math.PI), lam('#cf9c72'), -6.8);
  const mound = mesh(new THREE.SphereGeometry(2.4, 24, 12), lam('#a8dba0'), -1.45);
  mound.scale.set(1, 0.72, 1);

  // ── 감겨 들어가는 길 ──
  const A0 = Math.PI * 0.62;
  const at = (t) => { const a = A0 + t * TURNS * 2 * Math.PI, r = R0 * (1 - 0.8 * t); return [Math.cos(a) * r, Math.sin(a) * r, a, r]; };
  const N = 160;
  const len = [0];
  for (let i = 1; i <= N; i++) { const p = at((i - 1) / N), q = at(i / N); len.push(len[i - 1] + Math.hypot(q[0] - p[0], q[1] - p[1])); }
  const L = len[N];
  const tOfLen = (s) => { s = clamp(s, 0, L); let i = 1; while (i < N && len[i] < s) i++; return (i - 1 + (s - len[i - 1]) / Math.max(1e-6, len[i] - len[i - 1])) / N; };
  const lenOfT = (t) => { const f = clamp(t, 0, 1) * N, i = Math.min(N - 1, Math.floor(f)); return lerp(len[i], len[i + 1], f - i); };
  const tOfAge = (age) => clamp(age / Math.max(1, data.life), 0, 1) * 0.97;
  {
    const pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const [x, z, , r] = at(i / N), w = 0.8;
      const nx = x / r, nz = z / r;
      pos.push(x - nx * w, 0.04, z - nz * w, x + nx * w, 0.04, z + nz * w);
      if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(own(g), own(new THREE.MeshLambertMaterial({ color: '#fdebd8', side: THREE.DoubleSide })));
    root.add(m);
  }
  // 열 살마다 작은 팻말
  for (let a = 10; a < data.life; a += 10) {
    const [x, z, , r] = at(tOfAge(a));
    const sp = textSprite(String(a), { size: 34, bg: 'rgba(255,253,248,.8)', fg: '#a08f86' });
    sp.scale.set(0.62 * sp.userData.aspect, 0.62, 1);
    sp.position.set(x - (x / r) * 0.1, 0.5, z - (z / r) * 0.1);
    root.add(sp); trash.push(sp.material.map, sp.material);
  }

  // ── 물건과 건물: 나이 순서대로 길가에 놓고, 겹치면 조금씩 민다 ──
  const pops = []; // { o, s, delay, bob }
  function layout(list, side, off, gapOf) {
    let prev = -1e9;
    const spots = list.map((it) => { const g = gapOf(it); const s = Math.max(lenOfT(tOfAge(it.age)), prev + g); prev = s; return s; });
    const over = prev - (L - 2.5);
    if (over > 0 && spots.length) { const k = (L - 2.5 - spots[0]) / Math.max(1e-6, prev - spots[0]); for (let i = 0; i < spots.length; i++) spots[i] = spots[0] + (spots[i] - spots[0]) * Math.max(0.2, k); }
    return list.map((it, i) => {
      const [x, z, a, r] = at(tOfLen(spots[i]));
      const o = typeof off === 'function' ? off(it) : off;
      return { it, x: x + (x / r) * side * o, z: z + (z / r) * side * o, a };
    });
  }
  for (const p of layout(bigs, 1, (it) => 1.5 + (BIG[it.kind] || [1, 1.6])[1] * 0.75, (it) => (BIG[it.kind] || [1, 1.6])[1] * 2 + 0.6)) {
    const [sc] = BIG[p.it.kind] || [0.6];
    const o = makeObject(p.it.kind, p.it.v || 0);
    o.position.set(p.x, p.it.kind === 'balloon' ? 1.6 : 0, p.z);
    o.rotation.y = p.it.kind === 'car' ? -p.a : Math.atan2(-p.x, -p.z); // 길 쪽을 바라본다
    root.add(o);
    pops.push({ o, s: sc, age: p.it.age, bob: p.it.kind === 'balloon' ? 1 : 0, y: o.position.y });
  }
  for (const p of layout(smalls, -1, 1.7, () => 2.05)) {
    const o = makeObject(p.it.kind, 0);
    o.position.set(p.x, 0, p.z);
    o.rotation.y = Math.atan2(p.x, p.z) + hash(p.x) - 0.5;
    root.add(o);
    pops.push({ o, s: 1.45, age: p.it.age, bob: 0, y: 0 });
  }

  // ── 사람들: 처음 만난 나이의 길 위에 선다 ──
  const folks = [];
  const stand = (p, t, off, sc) => {
    const [x, z, a, r] = at(t);
    p.group.position.set(x + (x / r) * off, 0.04, z + (z / r) * off);
    p.group.rotation.y = -a + Math.PI; // 길이 나아가는 쪽
    p.group.scale.setScalar(sc);
    root.add(p.group);
    folks.push(p);
  };
  let prevS = -1e9;
  data.people.forEach((q, i) => {
    const s = Math.max(lenOfT(tOfAge(Math.max(q.age, 1))) + 0.6, prevS + 1.25); prevS = s;
    const p = q.pet ? makePet({ color: q.color }) : makePerson({ color: q.color, hair: i % 4 });
    p.setAge(q.pet ? 5 : clamp(q.role === 'child' ? 9 : q.role === 'junior' ? 16 : (q.role === 'grandma' || q.role === 'grandpa') ? 72 : 34, 3, 90));
    stand(p, tOfLen(Math.min(s, L - 1)), i % 2 ? 0.35 : -0.35, 0.8);
    pops.push({ o: p.group, s: 0.8, age: q.age, bob: 0, y: 0.04, person: p });
  });
  // 나: 지금 나이의 자리에
  const me = makePerson({ color: (data.look || {}).color || '#ff9f8a', hair: (data.look || {}).hair || 0 });
  me.setAge(clamp(data.now, 6, 90));
  stand(me, tOfAge(data.now), 0, 1.05);
  me.waving = true;
  const tag = textSprite(data.name, { size: 44, bg: '#ff8f7a', fg: '#ffffff' });
  tag.scale.set(0.95 * tag.userData.aspect, 0.95, 1);
  tag.position.copy(me.group.position).add(new THREE.Vector3(0, 3.0, 0));
  root.add(tag); trash.push(tag.material.map, tag.material);
  // 소중한 것은 내 머리 위를 맴도는 빛
  const orbGeo = own(new THREE.SphereGeometry(0.2, 12, 10));
  const orbs = (data.values || []).map((c) => { const m = new THREE.Mesh(orbGeo, own(new THREE.MeshBasicMaterial({ color: c }))); root.add(m); return m; });

  // ── 가운데 언덕: 마지막 날의 큰 나무. 아직 걷지 않았다면 작은 새싹 ──
  const top = makeObject(data.finished ? 'bigtree' : 'sprout', 0);
  top.position.set(0, 0.25, 0);
  root.add(top);
  pops.push({ o: top, s: data.finished ? 0.4 : 1.5, age: data.life + 1, bob: 0, y: 0.25 });

  // ── 섬 가장자리의 나무와 꽃: 답이 쌓일수록 풍성해진다 ──
  const green = Math.min(30, 7 + n);
  for (let i = 0; i < green; i++) {
    const a = (i / green) * Math.PI * 2 + hash(i) * 0.25, r = R - 0.9 - hash(i * 3.1) * 0.9;
    const type = ['round', 'blossom', 'bush', 'flowers', 'pine', 'autumn', 'flowers', 'rock'][Math.floor(hash(i * 7.7) * 8)];
    const o = makeObject(type, i % 6);
    o.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    o.rotation.y = hash(i * 5.3) * 6.28;
    root.add(o);
    pops.push({ o, s: type === 'flowers' || type === 'bush' || type === 'rock' ? 1 : 0.55 + hash(i) * 0.15, age: -1, bob: 0, y: 0 });
  }
  // 구름
  const cloudMat = own(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95 }));
  const clouds = [0, 1, 2, 3].map((i) => {
    const m = new THREE.Mesh(cloudGeometry(i), cloudMat);
    m.scale.setScalar(0.75 + hash(i * 2.2) * 0.5);
    m.userData = { a: i * 1.7 + 0.4, r: R + 2 + hash(i) * 4, y: -4.5 - i * 1.3 };
    scene.add(m); trash.push(m.geometry);
    return m;
  });

  // 나이 순서대로 하나씩 뿅
  const order = [...pops].sort((a, b) => a.age - b.age);
  order.forEach((p, i) => { p.delay = p.age < 0 ? hash(i) * 0.5 : 0.5 + (i / Math.max(1, order.length)) * Math.min(3, 0.5 + order.length * 0.12); });

  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  let rot = -0.5, drag = null, auto = 1, t = still ? 99 : 0, raf = 0, last = 0;
  function render(dt = 0) {
    t += dt;
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
    if (!still) { const pr = renderer.getPixelRatio(); if (canvas.width !== Math.floor(w * pr) || canvas.height !== Math.floor(h * pr)) renderer.setSize(w, h, false); }
    const asp = w / h;
    const half = Math.max((R + 1.2) / asp, R * 0.62 + 3.4); // 섬 너비가 다 들어오게
    cam.left = -half * asp; cam.right = half * asp; cam.top = half; cam.bottom = -half;
    cam.position.set(60, 46, 60); cam.lookAt(0, -0.6, 0); cam.updateProjectionMatrix();
    if (!drag && !still) rot += dt * 0.09 * auto;
    root.rotation.y = rot;
    for (const p of pops) {
      const k = clamp((t - p.delay) / 0.5, 0, 1);
      p.o.scale.setScalar(Math.max(0.0001, p.s * backOut(k)));
      p.o.position.y = p.y + (1 - k) * 1.2 + (p.bob ? Math.sin(t * 1.1 + p.age) * 0.3 : 0);
    }
    for (const f of folks) f.update(still ? 0 : dt, t);
    orbs.forEach((o, i) => { const a = t * 0.9 + (i * Math.PI * 2) / orbs.length; o.position.copy(me.group.position).add(new THREE.Vector3(Math.cos(a) * 0.7, 2.45 + Math.sin(t * 1.6 + i) * 0.08, Math.sin(a) * 0.7)); });
    tag.position.y = (orbs.length ? 3.45 : 3.0) + Math.sin(t * 2) * 0.05;
    clouds.forEach((c) => { const a = c.userData.a + t * 0.03; c.position.set(Math.cos(a) * c.userData.r, c.userData.y, Math.sin(a) * c.userData.r); });
    renderer.render(scene, cam);
  }
  function loop(now) { raf = requestAnimationFrame(loop); const dt = Math.min(0.25, (now - last) / 1000 || 0); last = now; render(dt); } // 느린 기기에서도 제때 다 나타나게
  // 손가락으로 돌려 본다
  const down = (e) => { drag = { x: e.clientX, r: rot }; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); };
  const move = (e) => { if (drag) rot = drag.r + (e.clientX - drag.x) * 0.012; };
  const up = () => { drag = null; auto = 0.4; };
  if (!still) { canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); }

  return {
    renderer,
    start() { last = performance.now(); raf = requestAnimationFrame(loop); },
    render,
    setSize(w, h) { renderer.setSize(w, h, false); },
    dispose() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up);
      for (const f of folks) f.dispose();
      for (const x of trash) x.dispose && x.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

/** 마을을 그림 한 장으로. 하늘빛 바탕 위에 섬을 얹는다. */
export function villageImage(data, w = 1080, h = 1080) {
  const gl = document.createElement('canvas');
  gl.width = w; gl.height = h;
  const v = createVillage(gl, data, { still: true });
  v.setSize(w, h);
  v.render(0);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#bfe3fb'); g.addColorStop(0.62, '#ffeede'); g.addColorStop(1, '#ffd8c9');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.drawImage(gl, 0, 0);
  v.dispose();
  return c;
}
