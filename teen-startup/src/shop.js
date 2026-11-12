// 앞벽을 뗀 인형의 집 같은 치킨집. 외부 모델 없이 상자·원기둥·공만 이어 붙여 만든다.
import * as THREE from 'three';

const MATS = new Map();
function mat(c, flat = true) {
  const k = c + flat;
  if (!MATS.has(k)) MATS.set(k, new THREE.MeshLambertMaterial({ color: c, flatShading: flat }));
  return MATS.get(k);
}
function add(p, geo, c, x, y, z, flat = true) {
  const m = new THREE.Mesh(geo, typeof c === 'string' ? mat(c, flat) : c);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m;
}
const box = (p, w, h, d, c, x, y, z) => add(p, new THREE.BoxGeometry(w, h, d), c, x, y, z);
const cyl = (p, rt, rb, h, c, x, y, z, seg = 12) => add(p, new THREE.CylinderGeometry(rt, rb, h, seg), c, x, y, z);
const blob = (p, r, c, x, y, z) => add(p, new THREE.IcosahedronGeometry(r, 1), c, x, y, z);
const orb = (p, r, c, x, y, z) => add(p, new THREE.SphereGeometry(r, 18, 14), c, x, y, z, false);
const group = (p, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };
const glow = (c) => new THREE.MeshBasicMaterial({ color: c });

const FONT = '"Jua", "Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function fitText(g, text, maxW, size) {
  do { g.font = `${size}px ${FONT}`; size -= 4; } while (g.measureText(text).width > maxW && size > 20);
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }

function signTex(name, neon) {
  return canvasTex(768, 192, (g, w, h) => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (neon) {
      g.fillStyle = '#2d2748'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#ffd166'; g.lineWidth = 8; g.shadowColor = '#ffd166'; g.shadowBlur = 18; rr(g, 16, 16, w - 32, h - 32, 36); g.stroke();
      fitText(g, name, w - 120, 108);
      g.shadowColor = '#ff6fa5'; g.shadowBlur = 30; g.fillStyle = '#ff9cc2'; g.fillText(name, w / 2, h / 2 + 6);
      g.shadowBlur = 10; g.fillStyle = '#fff6fa'; g.fillText(name, w / 2, h / 2 + 6);
    } else {
      g.fillStyle = '#d6b48a'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#c29e73'; g.lineWidth = 4;
      for (let y = 64; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      fitText(g, name, w - 100, 100);
      g.fillStyle = '#6f4c2c'; g.fillText(name, w / 2, h / 2 + 6);
    }
  });
}
function labelTex(text, bg, fg, w = 256, h = 128) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg;
    const lines = text.split('\n'); fitText(g, lines[0], w - 30, h / lines.length * 0.62);
    lines.forEach((l, i) => g.fillText(l, w / 2, h * (i + 0.5) / lines.length + 4));
  });
}
function iconTex(kind) {
  return canvasTex(128, 128, (g) => {
    g.translate(64, 64); g.lineJoin = 'round';
    const disc = (r, c) => { g.fillStyle = c; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); };
    if (kind === 'coin') {
      disc(52, '#f2a900'); disc(44, '#ffd23f'); g.fillStyle = '#c98500'; g.font = 'bold 56px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('₩', 0, 4);
    } else if (kind === 'star') {
      g.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 24 : 54, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fillStyle = '#ffd23f'; g.strokeStyle = '#fff'; g.lineWidth = 8; g.stroke(); g.fill();
    } else if (kind === 'heart') {
      g.beginPath(); g.moveTo(0, 44); g.bezierCurveTo(-70, -6, -34, -62, 0, -24); g.bezierCurveTo(34, -62, 70, -6, 0, 44);
      g.fillStyle = '#ff7fa3'; g.strokeStyle = '#fff'; g.lineWidth = 8; g.stroke(); g.fill();
    } else {
      const sad = kind === 'sad';
      disc(52, '#fff'); disc(46, sad ? '#bcd3f2' : '#ffe27a');
      g.fillStyle = '#5a4a5f'; g.beginPath(); g.arc(-17, -8, 6, 0, 7); g.arc(17, -8, 6, 0, 7); g.fill();
      g.strokeStyle = '#5a4a5f'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath();
      if (sad) g.arc(0, 30, 16, Math.PI * 1.15, Math.PI * 1.85); else g.arc(0, 4, 20, Math.PI * 0.15, Math.PI * 0.85);
      g.stroke();
    }
  });
}

const SHIRTS = ['#8ecae6', '#ffb4a2', '#b8e0a8', '#cdb4f6', '#ffd97d', '#f7a8c4', '#9ad8c7', '#f4b183'];
const HAIRS = ['#4a3b3b', '#6b4a3a', '#2f2a3a', '#8a5a3c', '#3d3550'];

// 머리가 큰 2등신 사람. 얼굴은 +z 쪽을 본다.
function person(p, i = 0, staff = false) {
  const g = group(p);
  const shirt = staff ? '#ffcf5c' : SHIRTS[i % SHIRTS.length];
  cyl(g, 0.075, 0.075, 0.2, '#5d5673', -0.1, 0.1, 0, 8); cyl(g, 0.075, 0.075, 0.2, '#5d5673', 0.1, 0.1, 0, 8);
  cyl(g, 0.19, 0.27, 0.46, shirt, 0, 0.42, 0, 12);
  if (staff) box(g, 0.3, 0.3, 0.05, '#fffaf0', 0, 0.36, 0.22);
  const armL = cyl(g, 0.06, 0.06, 0.3, shirt, -0.27, 0.46, 0, 8); armL.rotation.z = -0.35;
  const armR = cyl(g, 0.06, 0.06, 0.3, shirt, 0.27, 0.46, 0, 8); armR.rotation.z = 0.35;
  const head = group(g, 0, 0.96, 0);
  orb(head, 0.34, '#ffdfc8', 0, 0, 0);
  const hair = add(head, new THREE.SphereGeometry(0.365, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), HAIRS[i % HAIRS.length], 0, 0.02, -0.03, false);
  hair.rotation.x = -0.25;
  orb(head, 0.04, '#3f3447', -0.12, -0.02, 0.31); orb(head, 0.04, '#3f3447', 0.12, -0.02, 0.31);
  const ck = mat('#ffb3b3', false);
  for (const sx of [-1, 1]) { const c = add(head, new THREE.SphereGeometry(0.055, 10, 8), ck, sx * 0.21, -0.1, 0.25, false); c.scale.z = 0.4; }
  if (staff) { cyl(head, 0.3, 0.33, 0.14, '#ff8f7a', 0, 0.27, 0, 14); box(head, 0.4, 0.04, 0.2, '#ff8f7a', 0, 0.21, 0.3); }
  const boxInHand = group(g, 0, 0.5, 0.3); box(boxInHand, 0.42, 0.14, 0.34, '#fff3d6', 0, 0, 0); box(boxInHand, 0.2, 0.02, 0.34, '#ff8f7a', 0, 0.08, 0);
  boxInHand.visible = false;
  g.userData = { head, boxInHand, phase: i * 1.7 };
  return g;
}

export function createShop(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff8ee', '#f6cdb6', 1.55));
  const sun = new THREE.DirectionalLight('#fff0d8', 1.9);
  sun.position.set(7, 15, 9); sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 45 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; scene.add(sun);

  const cam = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
  cam.position.set(20, 17, 20); cam.lookAt(0, 1, 0); cam.updateMatrixWorld();

  // ── 켜고 끄는 조각들: 조건이 맞으면 "뿅" 하고 튀어나온다 ──
  const toggles = [];
  const when = (obj, test) => { obj.userData.pop = { s: 0, v: 0, t: 0, test }; toggles.push(obj); return obj; };

  // ── 떠 있는 섬 ──
  const land = group(scene);
  box(land, 15, 1, 12.6, '#f7e6cf', 0.9, -0.5, 1.1);
  box(land, 13.4, 1, 11, '#f0c9a8', 0.9, -1.5, 1.1);
  box(land, 11, 1.1, 8.6, '#e6b294', 0.9, -2.5, 1.1);
  box(land, 15, 0.06, 2.4, '#fbf3e6', 0.9, 0.03, 4.9); // 가게 앞 길
  for (let i = 0; i < 9; i++) box(land, 0.9, 0.02, 0.12, '#f0dcc4', -5.5 + i * 1.6, 0.07, 6.3);
  box(land, 2.2, 0.08, 4, '#bfe6b4', -5.4, 0.04, -3.1); box(land, 3, 0.08, 1.4, '#bfe6b4', 6.6, 0.04, -4.2);
  // 늘 있는 나무와 가로등
  const tree = (p, x, z, cols, s = 1) => {
    const g = group(p, x, 0, z); g.scale.setScalar(s);
    cyl(g, 0.13, 0.19, 1.3, '#a98463', 0, 0.65, 0, 7);
    blob(g, 0.95, cols[0], 0, 1.9, 0); blob(g, 0.65, cols[1], 0.55, 1.55, 0.2); blob(g, 0.6, cols[1], -0.5, 1.65, -0.15); blob(g, 0.5, cols[0], 0.1, 2.55, 0.05);
    return g;
  };
  tree(land, -5.5, -3.6, ['#8fd6a0', '#a8e0ae'], 1.15); tree(land, 7, -4.2, ['#9bdcb0', '#86cf9c'], 0.9);
  const lamp = group(land, 7.3, 0, 6.4);
  cyl(lamp, 0.07, 0.1, 2.6, '#6f6a8a', 0, 1.3, 0, 8); add(lamp, new THREE.SphereGeometry(0.26, 14, 10), glow('#fff2b8'), 0, 2.7, 0);
  const bench = group(land, 4.9, 0, 6.5); box(bench, 1.5, 0.1, 0.45, '#e9b98c', 0, 0.42, 0); box(bench, 0.1, 0.42, 0.4, '#b98f6a', -0.6, 0.21, 0); box(bench, 0.1, 0.42, 0.4, '#b98f6a', 0.6, 0.21, 0);
  // 구름
  const clouds = [];
  for (const [x, y, z, s] of [[-9, 6.5, -6, 1.2], [9, 8.5, -9, 1], [-3, 10, -11, 0.8]]) {
    const c = group(scene, x, y, z); c.scale.setScalar(s);
    const cm = new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true });
    for (const [bx, by, r] of [[0, 0, 1], [1, -0.1, 0.75], [-1, -0.15, 0.7], [0.4, 0.45, 0.65]]) { const m = add(c, new THREE.IcosahedronGeometry(r, 1), cm, bx, by, 0); m.castShadow = false; }
    clouds.push(c);
  }

  // ── 가게 ──
  const room = group(scene, 0, 0.06, 0);
  const lv = (n) => (s) => s.level === n, lvUp = (n) => (s) => s.level >= n;

  // 1단계 껍데기: 낡은 골목 가게
  const shell1 = when(group(room), lv(1));
  box(shell1, 8.25, 0.12, 6.25, '#d9c3a3', -0.125, 0, -0.125);
  for (let i = 0; i < 7; i++) box(shell1, 0.03, 0.005, 6, '#c9b08d', -3 + i * 1.1, 0.065, 0);
  box(shell1, 8.25, 3, 0.25, '#efe3d0', -0.125, 1.5, -3.125); box(shell1, 0.25, 3, 6, '#e6d8c2', -4.125, 1.5, 0);
  box(shell1, 1.2, 0.5, 0.02, '#e2d3bb', 2.6, 2.2, -2.99); box(shell1, 0.7, 0.9, 0.02, '#e2d3bb', 0.9, 0.9, -2.99); // 얼룩
  cyl(shell1, 0.02, 0.02, 0.5, '#6f6a8a', 1.6, 2.6, -2.7, 6); add(shell1, new THREE.SphereGeometry(0.14, 12, 8), glow('#ffe9a8'), 1.6, 2.3, -2.7);
  box(shell1, 1.5, 0.9, 0.05, '#5b7a6a', -1.9, 2.1, -2.98); // 칠판 메뉴
  for (let i = 0; i < 3; i++) box(shell1, 1.0 - i * 0.2, 0.05, 0.02, '#f3efe2', -2.0, 2.35 - i * 0.22, -2.94);

  // 2단계부터의 껍데기: 민트색 벽과 체크 바닥
  const shell2 = when(group(room), lvUp(2));
  box(shell2, 8.25, 0.12, 6.25, '#fff4e3', -0.125, 0, -0.125);
  for (let ix = 0; ix < 8; ix++) for (let iz = 0; iz < 6; iz++) if ((ix + iz) % 2) box(shell2, 1, 0.01, 1, '#ffd9c7', -3.5 + ix, 0.066, -2.5 + iz).castShadow = false;
  box(shell2, 8.25, 3, 0.25, '#cdeedd', -0.125, 1.5, -3.125); box(shell2, 0.25, 3, 6, '#bfe6d3', -4.125, 1.5, 0);
  box(shell2, 8, 0.9, 0.04, '#fff4e3', 0, 0.5, -2.98); box(shell2, 0.04, 0.9, 6, '#fff4e3', -3.98, 0.5, 0);
  for (let i = 0; i < 3; i++) { box(shell2, 1.1, 0.8, 0.05, '#fffaf0', -3 + i * 1.3, 2.15, -2.97); box(shell2, 0.8, 0.3, 0.02, ['#ffb4a2', '#ffd97d', '#b8e0a8'][i], -3 + i * 1.3, 2.25, -2.93); }
  const bulbs = [];
  for (let i = 0; i < 12; i++) bulbs.push(add(shell2, new THREE.SphereGeometry(0.09, 10, 8), glow(['#ffd166', '#ff9cc2', '#9be3d0'][i % 3]), -3.6 + i * 0.66, 2.82 - Math.sin(i / 11 * Math.PI) * 0.12, -2.92));
  // 창문(왼쪽 벽) — 두 단계 공통
  const win = group(room, -3.98, 1.7, 1.2); box(win, 0.06, 1.2, 1.7, '#fffaf0', 0, 0, 0); box(win, 0.07, 1.0, 0.72, '#bfe6ff', 0, 0, -0.4); box(win, 0.07, 1.0, 0.72, '#bfe6ff', 0, 0, 0.4);
  // 잘라 낸 앞벽·옆벽의 밑동과 문틀
  const stub = '#f3e3cf';
  box(room, 1.4, 0.3, 0.25, stub, -3.4, 0.2, 3.125); box(room, 5.4, 0.3, 0.25, stub, 1.4, 0.2, 3.125); box(room, 0.25, 0.3, 6.5, stub, 4.125, 0.2, 0);
  box(room, 0.18, 2.5, 0.25, '#f2b79a', -2.75, 1.3, 3.125); box(room, 0.18, 2.5, 0.25, '#f2b79a', -1.25, 1.3, 3.125); box(room, 1.9, 0.2, 0.3, '#f2b79a', -2, 2.6, 3.125);
  const door = group(room, -1.3, 0, 3.2); const dp = box(door, 1.1, 2.2, 0.08, '#ff9f8a', 0.55, 1.2, 0); box(door, 0.6, 0.8, 0.1, '#ffe9df', 0.55, 1.55, 0); orb(door, 0.06, '#ffd166', 0.15, 1.1, 0.07); door.rotation.y = -1.25; void dp;
  const awning = when(group(room, -2, 2.75, 3.5), lvUp(2));
  for (let i = 0; i < 6; i++) { const a = box(awning, 0.34, 0.06, 0.9, i % 2 ? '#fffaf0' : '#ff9f8a', -0.85 + i * 0.34, 0, 0); a.rotation.x = 0.45; }

  // 계산대와 주방
  const counter = group(room, -2.2, 0.06, -1);
  when(box(counter, 3.4, 1, 0.7, '#c9a37a', 0, 0.5, 0), lv(1)); when(box(counter, 3.6, 0.1, 0.86, '#a9835f', 0, 1.05, 0), lv(1));
  const c2 = when(group(counter), lvUp(2)); box(c2, 3.4, 1, 0.7, '#ffcfbf', 0, 0.5, 0); box(c2, 3.6, 0.1, 0.86, '#fffaf0', 0, 1.05, 0); box(c2, 3.4, 0.18, 0.02, '#ff9f8a', 0, 0.75, 0.36);
  when(box(counter, 0.5, 0.3, 0.4, '#8c8aa3', 1.2, 1.25, 0), lv(1));
  const pos = when(group(counter, 1.2, 1.1, 0), lvUp(2)); box(pos, 0.1, 0.3, 0.1, '#6f6a8a', 0, 0.15, 0); const scr = box(pos, 0.6, 0.4, 0.05, '#4b4566', 0, 0.45, 0.02); scr.rotation.x = -0.3; add(pos, new THREE.BoxGeometry(0.5, 0.3, 0.01), glow('#bff0ff'), 0, 0.45, 0.06).rotation.x = -0.3;
  // 친환경 포장 상자 / 일반 상자
  const packs = group(counter, -1.1, 1.1, 0);
  const packN = when(group(packs), (s) => !s.flags.eco); const packE = when(group(packs), (s) => !!s.flags.eco);
  for (let i = 0; i < 3; i++) { box(packN, 0.5, 0.14, 0.4, '#fffaf0', 0, 0.07 + i * 0.15, 0); box(packE, 0.5, 0.14, 0.4, '#c9a878', 0, 0.07 + i * 0.15, 0); }
  blob(packE, 0.13, '#7fcf8f', 0, 0.52, 0);

  const fryers = [];
  const fryer = (x, test) => {
    const g = when(group(room, x, 0.06, -2.55), test);
    const body = box(g, 0.9, 0.9, 0.7, '#cfd6e4', 0, 0.45, 0); box(g, 0.74, 0.08, 0.54, '#e9a23b', 0, 0.9, 0);
    box(g, 0.9, 0.5, 0.08, '#b9c1d3', 0, 1.15, -0.31); cyl(g, 0.02, 0.02, 0.5, '#6f6a8a', 0.2, 1.0, 0.1, 6).rotation.x = 0.9;
    const puffs = [];
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 })); m.userData.o = i / 5; g.add(m); puffs.push(m); }
    fryers.push({ g, body, puffs });
  };
  fryer(-3.3, () => true); fryer(-2.2, lvUp(2)); fryer(-1.1, lvUp(3));
  const fridge = group(room, 0.1, 0.06, -2.6); box(fridge, 0.85, 1.9, 0.7, '#dbeeff', 0, 0.95, 0); box(fridge, 0.04, 0.5, 0.04, '#9fb6d6', 0.3, 1.2, 0.37); box(fridge, 0.85, 0.03, 0.72, '#b9d3ee', 0, 1.0, 0);
  const frozen = when(group(room, 0.95, 0.06, -2.6), (s) => !!s.flags.frozen);
  box(frozen, 0.6, 0.4, 0.5, '#9fc4e8', 0, 0.2, 0); box(frozen, 0.55, 0.36, 0.48, '#b3d2ef', 0.03, 0.58, 0);
  add(frozen, new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: labelTex('냉동 수입', '#eef6ff', '#4a6fa5') }), 0, 0.22, 0.26);

  // 탁자와 의자
  const seats = { 1: [], 2: [], 3: [] };
  const table = (p, x, z, nice, list, y = 0) => {
    const g = group(p, x, 0.06, z);
    if (nice) { cyl(g, 0.5, 0.5, 0.07, '#fffaf0', 0, 0.74, 0, 16); cyl(g, 0.07, 0.07, 0.7, '#f2b79a', 0, 0.37, 0, 8); cyl(g, 0.26, 0.3, 0.05, '#f2b79a', 0, 0.03, 0, 12); }
    else { box(g, 1, 0.06, 0.7, '#bfc5d2', 0, 0.72, 0); for (const [a, b] of [[-0.42, -0.28], [0.42, -0.28], [-0.42, 0.28], [0.42, 0.28]]) cyl(g, 0.025, 0.025, 0.7, '#8c8aa3', a, 0.36, b, 6); }
    for (const sx of [-1, 1]) {
      const sxp = sx * (nice ? 0.78 : 0.82);
      cyl(g, 0.2, 0.2, 0.08, nice ? ['#ffb4a2', '#9be3d0', '#ffd97d'][list.length % 3] : '#9d9bb5', sxp, 0.44, 0, 12); cyl(g, 0.04, 0.06, 0.42, nice ? '#f2b79a' : '#8c8aa3', sxp, 0.21, 0, 6);
      list.push({ x: x + sxp, y: y + 0.36, z, ry: -sx * Math.PI / 2 });
    }
    return g;
  };
  const t1 = when(group(room), lv(1)); table(t1, 1.2, -1.3, false, seats[1]); table(t1, 2.6, 0.9, false, seats[1]);
  const t2 = when(group(room), lvUp(2)); for (const [x, z] of [[0.9, -1.4], [2.7, -1.4], [0.9, 1.1], [2.7, 1.1]]) table(t2, x, z, true, seats[2]);
  // 주문 기계와 화분
  const kiosk = when(group(room, -3.45, 0.06, 1.9), lvUp(2));
  box(kiosk, 0.5, 0.1, 0.4, '#6f6a8a', 0, 0.05, 0); box(kiosk, 0.14, 0.9, 0.14, '#8c8aa3', 0, 0.5, 0); box(kiosk, 0.55, 0.8, 0.12, '#fffaf0', 0, 1.3, 0);
  add(kiosk, new THREE.BoxGeometry(0.45, 0.6, 0.02), glow('#aee9ff'), 0, 1.33, 0.07); kiosk.rotation.y = Math.PI / 2;
  const plant = (p, x, z, s = 1, cols = ['#7fcf8f', '#9bdcab']) => { const g = group(p, x, 0.06, z); g.scale.setScalar(s); cyl(g, 0.24, 0.18, 0.4, '#ffb38a', 0, 0.2, 0, 10); blob(g, 0.36, cols[0], 0, 0.7, 0); blob(g, 0.26, cols[1], 0.2, 0.95, 0.05); blob(g, 0.22, cols[1], -0.2, 0.9, -0.05); return g; };
  when(plant(room, 3.55, -2.55, 1.2), lvUp(2));

  // 3단계: 2층(뒤쪽 절반)과 떠 있는 계단
  const up = when(group(room, 0, 3, 0), lvUp(3));
  box(up, 8.25, 0.25, 2.75, '#fff4e3', -0.125, 0.125, -1.75);
  box(up, 8.25, 2.7, 0.25, '#ffe1d3', -0.125, 1.6, -3.125); box(up, 0.25, 2.7, 6, '#ffd6c6', -4.125, 1.6, 0);
  box(up, 0.06, 1.3, 2.2, '#bfe6ff', -3.98, 1.6, 1.3); box(up, 2.4, 1.2, 0.06, '#bfe6ff', 1.5, 1.6, -2.98); box(up, 2.4, 1.2, 0.06, '#bfe6ff', -1.8, 1.6, -2.98);
  for (let i = 0; i < 9; i++) cyl(up, 0.03, 0.03, 0.6, '#f2b79a', -3.9 + i * 0.95, 0.55, -0.45, 6);
  box(up, 7.7, 0.06, 0.08, '#f2b79a', -0.1, 0.86, -0.45);
  for (const x of [-2.6, -0.2, 2.2]) table(up, x, -1.8, true, seats[3], 3.25).position.y = 0.25;
  when(plant(up, -3.5, -2.5, 1.1, ['#ffb3c8', '#ffd1dc']), lvUp(3)).position.y = 0.25;
  const stairs = when(group(room), lvUp(3));
  for (let i = 0; i < 10; i++) box(stairs, 0.7, 0.1, 0.3, i % 2 ? '#ffd9c7' : '#fffaf0', 3.55, 0.3 + i * 0.3, 2.5 - i * 0.3);

  // 간판: 낡은 나무판 → 네온
  const signG = group(room, -0.1, 3.5, -3.1);
  const side = mat('#b98f6a'), sideN = mat('#2d2748');
  const plankM = new THREE.MeshLambertMaterial({ color: '#ffffff' }), neonM = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const plank = when(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.85, 0.14), [side, side, side, side, plankM, side]), lv(1)); plank.castShadow = true; plank.rotation.z = -0.04; signG.add(plank);
  const neon = when(new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.4, 0.18), [sideN, sideN, sideN, sideN, neonM, sideN]), lvUp(2)); neon.position.y = 0.35; neon.castShadow = true; signG.add(neon);
  let shopName = '우리 치킨';
  function paintSigns() {
    for (const [m, n] of [[plankM, false], [neonM, true]]) { if (m.map) m.map.dispose(); m.map = signTex(shopName, n); m.needsUpdate = true; }
  }
  paintSigns();
  if (document.fonts && document.fonts.load) document.fonts.load(`40px "Jua"`).then(paintSigns).catch(() => {});

  // 가게 밖: 배달 오토바이, 꽃, 현판
  const scooter = (x, z, c) => {
    const g = when(group(land, x, 0, z), lvUp(3));
    for (const dz of [-0.5, 0.5]) { const w = cyl(g, 0.2, 0.2, 0.12, '#4b4566', 0, 0.2, dz, 14); w.rotation.z = Math.PI / 2; }
    box(g, 0.3, 0.16, 1.0, c, 0, 0.36, 0); box(g, 0.34, 0.14, 0.5, '#4b4566', 0, 0.56, -0.2); box(g, 0.28, 0.5, 0.14, c, 0, 0.6, 0.42);
    box(g, 0.6, 0.05, 0.05, '#6f6a8a', 0, 0.9, 0.42); box(g, 0.5, 0.46, 0.46, '#fffaf0', 0, 0.82, -0.52); box(g, 0.52, 0.1, 0.48, '#ff8f7a', 0, 1.02, -0.52);
    g.rotation.y = -0.25;
  };
  scooter(5.1, 0.8, '#ff9f8a'); scooter(6.0, 0.8, '#9be3d0'); scooter(6.9, 0.8, '#ffd97d');
  const flower = (p, x, z, c, y = 0) => { cyl(p, 0.025, 0.025, 0.3, '#7fcf8f', x, y + 0.15, z, 5); blob(p, 0.11, c, x, y + 0.34, z); };
  const pots = when(group(land), (s) => s.impact >= 25);
  for (const x of [-3.5, -0.5]) { cyl(pots, 0.26, 0.2, 0.36, '#ffb38a', x, 0.18, 3.75, 10); for (let i = 0; i < 4; i++) flower(pots, x + Math.cos(i * 1.6) * 0.12, 3.75 + Math.sin(i * 1.6) * 0.12, ['#ff9cc2', '#ffd166', '#ffffff', '#ff8f7a'][i], 0.3); }
  const garden = when(group(land), (s) => s.impact >= 50);
  tree(garden, -5.6, 6.2, ['#ffc2d4', '#ffd6e2'], 1); tree(garden, 3.2, 6.6, ['#ffb8cd', '#ffd1dc'], 0.85);
  for (let i = 0; i < 12; i++) flower(garden, -4 + i * 0.55, 6.9 + (i % 2) * 0.18, ['#ff9cc2', '#ffd166', '#fff6fa', '#c9b6ff'][i % 4]);
  const plaque = when(group(land, 1.1, 0, 4.1), (s) => s.impact >= 75);
  cyl(plaque, 0.05, 0.07, 1.1, '#b98f6a', 0, 0.55, 0, 8);
  const pm = new THREE.MeshLambertMaterial({ map: labelTex('골드\n착한 가게', '#ffd23f', '#8a5a00', 256, 256), emissive: '#6b4a00', emissiveIntensity: 0.25 });
  const pg = mat('#f2a900'); const pq = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.1), [pg, pg, pg, pg, pm, pg]); pq.position.y = 1.45; pq.castShadow = true; plaque.add(pq);
  plaque.rotation.y = 0.5;
  const famous = when(group(land, 3.4, 0, 4.1), (s) => s.trust >= 70);
  const fm = new THREE.MeshLambertMaterial({ map: labelTex('동네\n맛집', '#fffaf0', '#ff7a66', 256, 256) });
  const fb = mat('#ff9f8a'); const fa = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.0, 0.06), [fb, fb, fb, fb, fm, fb]); fa.position.set(0, 0.52, 0.12); fa.rotation.x = -0.22; fa.castShadow = true; famous.add(fa);
  const fa2 = box(famous, 0.75, 1.0, 0.06, '#ff9f8a', 0, 0.52, -0.12); fa2.rotation.x = 0.22; famous.rotation.y = 0.55;

  // ── 사람들 ──
  const people = group(scene, 0, 0.12, 0);
  const STAFF_AT = [[-3.1, -1.75], [-1.9, -1.75], [-0.9, -1.75], [1.8, -0.2], [-3.2, 0.9]];
  const staff = STAFF_AT.map(([x, z], i) => {
    const g = person(people, i + 2, true); g.position.set(x, 0, z); g.rotation.y = 0.6; when(g, (s) => s.staff > i);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false })); sp.scale.setScalar(0.55); sp.position.y = 1.75; sp.visible = false; g.add(sp);
    g.userData.mood = sp; return g;
  });
  const icons = {}; for (const k of ['coin', 'star', 'heart', 'smile', 'sad']) icons[k] = iconTex(k);
  const sitters = []; for (let i = 0; i < 14; i++) { const g = person(people, i + 3); g.userData.seat = i; when(g, () => false); sitters.push(g); }
  const custs = []; let nextShirt = 0;
  const slot = (i) => (i < 5 ? [-2.35, -0.15 + i * 0.8] : i === 5 ? [-2.35, 3.9] : [-0.9 + (i - 6) * 0.8, 4.5]);
  const OUT = [[-1.65, -0.15], [-1.65, 5.5], [-7, 5.5]];

  const sparks = [];
  function burst(kind, n = 6) {
    for (let i = 0; i < n; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: icons[kind], transparent: true, depthTest: false }));
      sp.position.set(-2 + (Math.random() - 0.3) * 5, 1.2 + Math.random() * 1.5, -0.5 + (Math.random() - 0.5) * 3);
      sp.scale.setScalar(0.01); sp.userData = { t: -i * 0.09, s: 0.5 + Math.random() * 0.3 }; scene.add(sp); sparks.push(sp);
    }
  }

  // ── 상태 맞추기 ──
  let st = { level: 1, trust: 50, team: 60, impact: 10, staff: 2, flags: {} }, first = true, busy = false, queueWant = 3;
  function update(s, snap = false) {
    const lvChanged = s.level !== st.level;
    st = { level: s.level, trust: s.trust, team: s.team, impact: s.impact, staff: s.staff, flags: { ...s.flags } };
    const list = [...seats[Math.min(2, st.level)], ...(st.level >= 3 ? seats[3] : [])];
    const fill = Math.min(list.length, Math.round(list.length * Math.max(0, st.trust - 18) / 75));
    sitters.forEach((g, i) => {
      const on = i < fill; g.userData.pop.test = () => on;
      if (on) { const p = list[i]; g.position.set(p.x, p.y, p.z); g.rotation.y = p.ry; }
    });
    for (const o of toggles) { const p = o.userData.pop; p.t = p.test(st) ? 1 : 0; if (snap || first) { p.s = p.t; p.v = 0; } }
    fryers[0].body.material = mat(st.flags.oldFryer && st.level === 1 ? '#c4a78f' : '#cfd6e4');
    queueWant = Math.max(0, Math.min(8, Math.round((st.trust - 12) / 11)));
    staff.forEach((g) => { const m = g.userData.mood; const k = st.team >= 75 ? 'smile' : st.team <= 35 ? 'sad' : null; m.visible = !!k; if (k) { m.material.map = icons[k]; m.material.needsUpdate = true; } });
    signT = st.level >= 3 ? 6.15 : 3.5;
    if (lvChanged && !first && !snap) burst('star', 14);
    first = false; fit();
  }
  let signT = 3.5;

  // ── 화면에 맞추기 ──
  const view = { l: -10, r: 10, t: 10, b: -10 }, goal = { ...view };
  const v3 = new THREE.Vector3();
  function fit() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1, top = st.level >= 3 ? 7.6 : 4.9;
    let l = 1e9, r = -1e9, t = -1e9, b = 1e9;
    // 좁은 화면에서는 섬 전체 대신 가게와 앞길만 크게 잡는다
    const pts = w < 700
      ? [[-4.6, 0, -3.4], [4.6, 0, -3.4], [-4.6, 0, 5.4], [5.2, 0, 5.4], [-4.2, top, -3.2], [4, top, -3.2], [-4.2, top - 1, 3]]
      : [[-6.6, -1.6, -5.2], [8.4, -1.6, -5.2], [-6.6, -1.6, 7.4], [8.4, -1.6, 7.4], [-6.6, 0, -5.2], [8.4, 0, 7.4], [-4.2, top, -3.2], [4, top, -3.2], [-4.2, top - 1, 3]];
    for (const p of pts) {
      v3.set(p[0], p[1], p[2]).applyMatrix4(cam.matrixWorldInverse);
      l = Math.min(l, v3.x); r = Math.max(r, v3.x); t = Math.max(t, v3.y); b = Math.min(b, v3.y);
    }
    const cx = (l + r) / 2, cy = (t + b) / 2; let hw = (r - l) / 2 * 1.04, hh = (t - b) / 2 * 1.04;
    const padTop = Math.min(h * 0.3, w < 700 ? 44 : 64), uh = h - padTop; // 위쪽 지표가 가게를 가리지 않게 비워 둔다
    if (hw / hh < w / uh) hw = hh * w / uh; else hh = hw * uh / w;
    Object.assign(goal, { l: cx - hw, r: cx + hw, t: cy + hh + padTop * (2 * hh / uh), b: cy - hh });
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); fit(); Object.assign(view, goal);
  }
  new ResizeObserver(resize).observe(canvas);

  // ── 움직임 ──
  let last = performance.now(), T = 0, spawnT = 0, serveT = 0;
  function moveTo(g, x, z, sp, dt) {
    const dx = x - g.position.x, dz = z - g.position.z;
    let mx = 0, mz = 0;
    if (Math.abs(dx) > 0.03) mx = Math.sign(dx) * Math.min(Math.abs(dx), sp * dt); else if (Math.abs(dz) > 0.03) mz = Math.sign(dz) * Math.min(Math.abs(dz), sp * dt);
    g.position.x += mx; g.position.z += mz;
    const moving = mx || mz;
    if (moving) g.rotation.y = Math.atan2(mx, mz);
    g.position.y = moving ? Math.abs(Math.sin(T * 11 + g.userData.phase)) * 0.07 : 0;
    return !moving;
  }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
    // 뿅 튀어나오기
    for (const o of toggles) {
      const p = o.userData.pop;
      p.v += (p.t - p.s) * 110 * dt; p.v *= Math.max(0, 1 - 11 * dt); p.s += p.v * dt;
      if (p.t === 0 && p.s < 0.02) { p.s = 0; p.v = 0; }
      o.visible = p.s > 0.01; if (o.visible) o.scale.setScalar(p.s);
    }
    signG.position.y += (signT - signG.position.y) * Math.min(1, dt * 5);
    neonM.color.setScalar(0.9 + Math.sin(T * 3) * 0.06 + (Math.sin(T * 23) > 0.96 ? -0.25 : 0));
    bulbs.forEach((b, i) => b.scale.setScalar(1 + Math.sin(T * 4 + i) * 0.18));
    clouds.forEach((c, i) => { c.position.x += dt * (0.12 + i * 0.05); if (c.position.x > 14) c.position.x = -14; });
    // 튀김기 김
    const smoke = st.flags.frozen ? 0.62 : 1;
    for (const f of fryers) for (const m of f.puffs) {
      const k = (T * (busy ? 0.9 : 0.45) + m.userData.o) % 1;
      m.position.set(Math.sin(k * 5 + m.userData.o * 9) * 0.14, 1.0 + k * 1.3, 0); m.scale.setScalar(0.4 + k * 0.9);
      m.material.opacity = (1 - k) * 0.75; m.material.color.setRGB(smoke, smoke * (st.flags.frozen ? 0.93 : 1), smoke * (st.flags.frozen ? 0.85 : 1));
    }
    // 알바생: 기분에 따라 통통 뛰거나 축 처진다
    const joy = st.team / 100;
    staff.forEach((g, i) => {
      if (!g.visible) return;
      g.position.y = Math.abs(Math.sin(T * (2 + joy * 5) + i * 1.3)) * 0.1 * joy * (busy ? 1.6 : 1);
      g.userData.head.rotation.x = st.team <= 35 ? 0.35 : Math.sin(T * 2 + i) * 0.08;
      g.rotation.y = 0.6 + Math.sin(T * 0.8 + i * 2) * 0.35;
    });
    sitters.forEach((g, i) => { if (g.visible) g.userData.head.rotation.z = Math.sin(T * 1.6 + i) * 0.12; });
    // 손님 줄
    const speed = busy ? 4.2 : 1.7;
    const waiting = custs.filter((c) => !c.out);
    spawnT -= dt;
    if (waiting.length < queueWant + (busy ? 1 : 0) && spawnT <= 0) {
      const g = person(people, nextShirt++); g.position.set(8.2, 0, 4.5); g.scale.setScalar(0.01);
      custs.push({ g, out: false, i: 0, s: 0 }); spawnT = busy ? 0.35 : 1.3;
    }
    serveT += dt;
    let q = 0;
    for (const c of custs) {
      c.s = Math.min(1, c.s + dt * 4);
      if (!c.out) {
        const [x, z] = slot(q); const there = moveTo(c.g, x, z, speed, dt);
        if (there) c.g.rotation.y = Math.PI + Math.sin(T * 0.9 + c.g.userData.phase) * 0.9;
        if (q === 0 && there && serveT > (busy ? 0.45 : 3.2)) { c.out = true; c.i = 0; c.g.userData.boxInHand.visible = true; serveT = 0; if (busy) burst('coin', 1); }
        q++;
      } else {
        const [x, z] = OUT[c.i];
        if (moveTo(c.g, x, z, speed, dt)) c.i++;
        if (c.i >= OUT.length) { c.dead = true; people.remove(c.g); }
        else if (c.g.position.x < -6) c.s = Math.max(0.01, (c.g.position.x + 7));
      }
      c.g.scale.setScalar(Math.max(0.01, c.s));
    }
    for (let i = custs.length - 1; i >= 0; i--) if (custs[i].dead) custs.splice(i, 1);
    // 떠오르는 아이콘
    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i], u = sp.userData; u.t += dt;
      if (u.t < 0) continue;
      const k = u.t / 1.3; sp.position.y += dt * 1.5; sp.scale.setScalar(u.s * Math.min(1, k * 6)); sp.material.opacity = 1 - Math.max(0, k - 0.5) * 2;
      if (k >= 1) { scene.remove(sp); sp.material.dispose(); sparks.splice(i, 1); }
    }
    for (const k in view) view[k] += (goal[k] - view[k]) * Math.min(1, dt * 4);
    cam.left = view.l; cam.right = view.r; cam.top = view.t; cam.bottom = view.b; cam.updateProjectionMatrix();
    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  }
  resize(); update(st, true); requestAnimationFrame(frame);

  return {
    update, burst,
    setBusy(b) { busy = b; },
    setName(n) { shopName = n || '우리 치킨'; paintSigns(); },
  };
}
