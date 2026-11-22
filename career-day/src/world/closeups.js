// 가까이 보기 무대들. build(g) 는 물건을 짓고 { patches, movers, tool, rubY, focus, zoom, tick } 을 돌려준다.
//   patches: 문질러 지우는 얼룩. { id, y, color, blobs: [{ x, z, r, n }] }
//   movers : 집어서 옮기는 물건. { id, obj, from: [x, z], to: [x, z], r, y }
// 좌표는 무대 가운데가 (0, 0) 이고, 화면 아래쪽이 +z 예요.
import * as T from 'three';
import { box, cyl, ball, label, person, mat, reduced } from './kit.js';
import { makeFire, makeEmberGlow, makeWater } from './fx.js';
import { helmet, tank, lantern, hydrant, hoseRoll, nozzle, wrench, cone, RED, CREAM, STEEL, KHAKI, GLOW } from './firekit.js';
import { HOSP_A } from './closeups-hosp.js'; // 의사·환경미화 직원(카페 방식)의 무대. 아래 조각을 함께 쓴다
import { HOSP_B } from './closeups-hosp-b.js'; // 임상병리사·방사선사(카페 방식)의 무대

function floor(g, w = 5.6, d = 4.2, c = '#efe7d8') {
  box(g, 0, -0.1, 0, w + 0.3, 0.2, d + 0.3, '#d5c7b2'); box(g, 0, 0.005, 0, w, 0.02, d, c);
  for (let x = -w / 2 + 0.6; x < w / 2; x += 0.6) box(g, x, 0.018, 0, 0.012, 0.004, d, '#e2d6c3');
  for (let z = -d / 2 + 0.6; z < d / 2; z += 0.6) box(g, 0, 0.018, z, w, 0.004, 0.012, '#e2d6c3');
  box(g, 0, 1.3, -d / 2, w, 2.6, 0.12, '#f1e6d6');
}

function signTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 380; const x = c.getContext('2d');
  x.fillStyle = '#f2c531'; x.fillRect(0, 0, 256, 380);
  x.fillStyle = '#3d3a33'; x.beginPath(); x.moveTo(128, 30); x.lineTo(228, 200); x.lineTo(28, 200); x.closePath(); x.fill();
  x.fillStyle = '#f2c531'; x.font = 'bold 120px sans-serif'; x.textAlign = 'center'; x.fillText('!', 128, 185);
  x.fillStyle = '#3d3a33'; x.font = 'bold 64px "Gowun Dodum", sans-serif'; x.fillText('주의', 128, 280);
  x.font = 'bold 40px "Gowun Dodum", sans-serif'; x.fillText('미끄러워요', 128, 340);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

function cautionSign() {
  // 노란 A자 안내판: 앞판이 카메라 쪽으로 기울어 글씨가 보인다
  const s = new T.Group();
  const front = new T.Group(); front.position.set(0, 0, 0.2); front.rotation.x = -0.32; s.add(front);
  const back = new T.Group(); back.position.set(0, 0, -0.2); back.rotation.x = 0.32; s.add(back);
  for (const p of [front, back]) { box(p, 0, 0.5, 0, 0.62, 1.0, 0.05, '#f2c531'); box(p, 0, 0.98, 0, 0.66, 0.06, 0.07, '#3d3a33'); }
  const face = new T.Mesh(new T.PlaneGeometry(0.58, 0.86), new T.MeshBasicMaterial({ map: signTexture(), transparent: true }));
  face.position.set(0, 0.5, 0.03); front.add(face);
  return s;
}

function mop() {
  const m = new T.Group();
  const h = cyl(m, 0.35, 0.95, 0.35, 0.03, 1.9, '#9a8f7d'); h.rotation.z = -0.38; h.rotation.x = 0.38;
  box(m, 0, 0.05, 0, 0.5, 0.08, 0.18, '#d9e4e6');
  for (let i = 0; i < 7; i++) box(m, -0.21 + i * 0.07, 0.02, 0.1, 0.04, 0.03, 0.08, '#eef3f1');
  return m;
}

// 위에서 내려다봐도 읽히는 큰 이름표 (카메라 쪽으로 눕혀 세운다)
function tag(g, text, x, y, z, w = 0.75, h = 0.36) {
  const c = document.createElement('canvas'); c.width = 320; c.height = 150; const k = c.getContext('2d');
  k.fillStyle = '#fffaf0'; k.beginPath(); k.roundRect(0, 0, 320, 150, 28); k.fill(); k.strokeStyle = '#c9b49a'; k.lineWidth = 6; k.stroke();
  k.fillStyle = '#344d63'; k.font = 'bold 92px "Gowun Dodum", sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, 160, 80, 290);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, transparent: true })); m.position.set(x, y, z); m.rotation.x = -0.55; g.add(m); return m;
}

function cloth() {
  const c = new T.Group(); box(c, 0, 0.03, 0, 0.36, 0.05, 0.26, '#8fc6d8'); box(c, 0.05, 0.065, 0, 0.18, 0.02, 0.14, '#b6dbe6'); return c;
}

// 물을 쏘는 나: 방화복 차림으로 서서 관창을 손 높이로 든다. 물이 나오기 전에는 보이지 않는다.
//   tip 은 관창 끝(물이 나가는 곳), kick 은 쏘는 동안 반동으로 떨릴 것들.
function hoseHolder(g, x, z) {
  const root = new T.Group(); root.visible = false; g.add(root);
  const me = person({ coat: KHAKI, seed: 2, hair: 0, outfit: 'turnout' }); me.root.position.set(x, 0, z); me.root.rotation.y = Math.PI / 2; root.add(me.root);
  const noz = nozzle(); noz.scale.setScalar(1.25); noz.position.set(x + 0.4, 0.92, z + 0.12); root.add(noz);
  const up = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([[x - 0.25, 0.07, z + 0.3], [x - 0.05, 0.3, z + 0.28], [x + 0.12, 0.8, z + 0.16], [x + 0.2, 1.04, z + 0.12]].map((v) => new T.Vector3(...v))), 16, 0.06, 6, false), mat('#e8dfc8')); up.castShadow = true; root.add(up);
  return { root, me, tip: [x + 0.68, 1.05, z + 0.12], kick: [noz, me.root], show() { root.visible = true; } };
}

import { departmentBenches } from './department-benches.js';
export const CLOSEUPS = {
  ...departmentBenches,
  // 환경미화 직원: 로비 천장에서 샌 물. 안내판을 세우고 대걸레로 물기를 걷어 낸다.
  spill: {
    build(g) {
      floor(g);
      label(g, '로비', 1.4, 2.0, -2.03, 1.1, 0.38);
      // 천장에서 떨어지는 물방울
      const drops = [0, 1, 2].map((i) => { const d = ball(g, 0.4, 2.6, 0, 0.06, '#7fbde0'); d.userData.k = i; return d; });
      const bucket = new T.Group(); bucket.position.set(-1.9, 0, -1.35); g.add(bucket);
      cyl(bucket, 0, 0.3, 0, 0.26, 0.6, '#5f8fb0', 0.3); cyl(bucket, 0, 0.56, 0, 0.27, 0.06, '#4b7896');
      const visitor = person({ coat: '#c9b6d6', seed: 5, hair: 2 }); visitor.root.position.set(2.3, 0, -0.9); visitor.root.rotation.y = -0.9; g.add(visitor.root);
      const sign = cautionSign();
      const tool = mop(); g.add(tool); g.add(sign);
      return {
        rubY: 0.03, focus: [0, 0.2, 0.35], zoom: 4.1, tool,
        patches: [
          { id: 'puddle', y: 0.02, color: '#9fd0ea', opacity: 0.7, dot: 0.13, reach: 0.3, blobs: [{ x: 0.4, z: 0.05, r: 0.85, n: 46, squash: 0.75 }, { x: -0.7, z: 0.55, r: 0.4, n: 14 }] },
          { id: 'trail', y: 0.02, color: '#a9d6ec', opacity: 0.65, dot: 0.09, reach: 0.3, blobs: [{ x: 1.45, z: 0.95, r: 0.22, n: 6 }, { x: 1.85, z: 1.4, r: 0.2, n: 5 }] },
        ],
        movers: [{ id: 'sign', obj: sign, from: [-2.1, 1.35], to: [-1.05, 0.15], r: 0.55, y: 0 }],
        tick(dt, t) { for (const d of drops) { const ph = (t * 0.9 + d.userData.k / 3) % 1; d.position.y = 2.55 - ph * 2.5; d.visible = ph < 0.97; } visitor.update(t, false); },
      };
    },
  },
  // 간호사: 퇴원한 침대를 다음 환자를 위해 정리한다. 쓴 시트 걷기 → 매트리스 소독 → 새 시트 깔기.
  bed: {
    build(g) {
      floor(g, 5.8, 4.2, '#eadfca');
      label(g, '703호 병실', 1.3, 2.0, -2.03, 1.6, 0.38);
      const bed = new T.Group(); g.add(bed);
      box(bed, 0, 0.4, 0, 2.6, 0.16, 1.3, '#d9dedb'); box(bed, 0, 0.62, 0, 2.5, 0.28, 1.2, '#b3c8d3');
      box(bed, -1.32, 0.85, 0, 0.1, 0.8, 1.32, '#c9d6d8'); box(bed, 1.32, 0.7, 0, 0.08, 0.5, 1.32, '#c9d6d8');
      for (const a of [-1.1, 1.1]) for (const b of [-0.5, 0.5]) { box(bed, a, 0.18, b, 0.07, 0.36, 0.07, '#a5afb1'); ball(bed, a, 0.06, b, 0.08, '#697d85'); }
      // 쓴 시트 (주름진 모양)
      const used = new T.Group(); box(used, 0, 0, 0, 2.3, 0.05, 1.1, '#bcd3df'); for (let i = 0; i < 5; i++) { const w = box(used, -0.8 + i * 0.4, 0.035, (i % 2 ? 0.2 : -0.15), 0.32, 0.03, 0.5, '#a9c4d3'); w.rotation.y = i * 0.5; } g.add(used);
      // 세탁함
      const bin = new T.Group(); bin.position.set(2.25, 0, 1.15); g.add(bin);
      cyl(bin, 0, 0.42, 0, 0.36, 0.84, '#c7d7c9', 0.4); cyl(bin, 0, 0.85, 0, 0.42, 0.05, '#9cb6a0'); tag(bin, '세탁', 0, 1.15, 0, 0.7, 0.33);
      // 새 시트 (접힌 채 수레 위)
      const cart = new T.Group(); cart.position.set(-2.25, 0, 1.3); g.add(cart);
      box(cart, 0, 0.7, 0, 0.8, 0.06, 0.55, '#d9cdb6'); box(cart, 0, 0.35, 0, 0.8, 0.04, 0.55, '#d9cdb6'); for (const a of [-0.35, 0.35]) for (const b of [-0.23, 0.23]) cyl(cart, a, 0.36, b, 0.02, 0.7, '#a9a294');
      const fresh = new T.Group(); box(fresh, 0, 0.06, 0, 0.6, 0.12, 0.42, '#ffffff'); box(fresh, 0, 0.125, 0, 0.6, 0.01, 0.06, '#e6eef2'); g.add(fresh);
      const tool = cloth(); g.add(tool);
      // 소독 티슈 통
      cyl(g, -2.2, 0.35, -1.3, 0.16, 0.7, '#e8eef0'); cyl(g, -2.2, 0.72, -1.3, 0.17, 0.05, '#4fa38a');
      return {
        rubY: 0.77, focus: [0, 0.55, 0.35], zoom: 3.9, tool,
        patches: [
          { id: 'mattress', y: 0.765, color: '#b89a5e', opacity: 0.6, dot: 0.1, reach: 0.26, blobs: [{ x: -0.6, z: 0.1, r: 0.32, n: 16 }, { x: 0.35, z: -0.2, r: 0.28, n: 13 }, { x: 0.8, z: 0.3, r: 0.2, n: 8 }, { x: -0.05, z: 0.35, r: 0.18, n: 6 }] },
        ],
        movers: [
          { id: 'used', obj: used, from: [0, 0], to: [2.25, 1.15], r: 0.6, y: 0.79, restY: 0.88, lift: 0.3,
            onPlaced(o) { o.scale.set(0.3, 1, 0.5); } },
          { id: 'fresh', obj: fresh, from: [-2.25, 1.3], to: [0, 0], r: 0.7, y: 0.73, restY: 0.77, lift: 0.2,
            onPlaced(o) { o.scale.set(2.3 / 0.6, 0.4, 1.12 / 0.42); } },
        ],
      };
    },
  },
  // 임상병리사: 들어온 검체 튜브를 뚜껑 색이 같은 칸에 꽂고, 작업대에 흘린 시약을 닦는다.
  lab: {
    build(g) {
      floor(g, 5.8, 4.2, '#e9e4ef');
      label(g, '진단검사실', 1.4, 2.0, -2.03, 1.4, 0.38);
      const Y = 0.9; // 작업대 윗면
      box(g, 0, Y / 2, 0, 5.2, Y, 2.6, '#d8d1e3'); box(g, 0, Y - 0.02, 0, 5.3, 0.05, 2.7, '#f4f1f7');
      // 받침 쟁반과 튜브걸이
      box(g, -1.7, Y + 0.03, 0.55, 1.1, 0.05, 0.8, '#c4bcd6');
      const rack = new T.Group(); rack.position.set(1.2, Y, -0.35); g.add(rack);
      box(rack, 0, 0.12, 0, 2.0, 0.2, 0.6, '#9d93b8');
      const colors = { purple: '#8e6bbf', green: '#4fa36b', red: '#d0584a' };
      const slotX = { purple: 0.55, green: 1.2, red: 1.85 };
      for (const [k, c] of Object.entries(colors)) { cyl(g, slotX[k], Y + 0.23, -0.35, 0.13, 0.02, '#4a4361'); box(g, slotX[k], Y + 0.03, 0.05, 0.36, 0.04, 0.12, c); }
      // 튜브: 뚜껑 색으로 구분
      const tube = (c) => { const t = new T.Group(); cyl(t, 0, 0.32, 0, 0.09, 0.6, '#eef3f6'); cyl(t, 0, 0.66, 0, 0.11, 0.12, c); box(t, 0, 0.32, 0.09, 0.14, 0.24, 0.01, '#ffffff'); g.add(t); return t; };
      const movers = [['purple', -2.05, 0.35], ['red', -1.7, 0.75], ['green', -1.35, 0.4]].map(([k, x, z]) => ({ id: k, obj: tube(colors[k]), from: [x, z], slot: k, y: Y + 0.05, restY: Y + 0.1, lift: 0.35 }));
      // 원심분리기와 현미경 (구경거리)
      const cent = new T.Group(); cent.position.set(-0.3, Y, -0.85); g.add(cent); cyl(cent, 0, 0.22, 0, 0.42, 0.44, '#e9e9e2'); cyl(cent, 0, 0.46, 0, 0.36, 0.05, '#bfc6cf');
      const tool = cloth(); g.add(tool);
      return {
        rubY: Y + 0.01, focus: [0, 0.9, 0.3], zoom: 3.9, tool,
        slots: Object.keys(colors).map((k) => ({ id: k, at: [slotX[k], -0.35], y: Y + 0.22, r: 0.3 })),
        patches: [{ id: 'spill', y: Y + 0.005, color: '#e8b54d', opacity: 0.65, dot: 0.1, reach: 0.25, blobs: [{ x: 0.2, z: 0.75, r: 0.38, n: 18 }, { x: 0.75, z: 0.95, r: 0.18, n: 6 }] }],
        movers,
      };
    },
  },
  // 방사선사: 다음 검사 전에 촬영대를 닦고, 일회용 종이 커버를 깔고, 자세 받침을 놓는다.
  xray: {
    build(g) {
      floor(g, 5.8, 4.2, '#e3ecf1');
      label(g, '영상검사실', 1.4, 2.0, -2.03, 1.4, 0.38);
      const Y = 0.8;
      const table = new T.Group(); g.add(table);
      box(table, 0, Y / 2, 0, 0.5, Y - 0.1, 0.6, '#c5d3d9'); box(table, 0, Y - 0.05, 0, 3.0, 0.1, 1.1, '#a9c0cb');
      // 위쪽 촬영 장치
      cyl(g, -1.9, 1.5, -1.3, 0.08, 3, '#b7c2c0'); box(g, -0.9, 2.6, -1.3, 2.2, 0.12, 0.12, '#b7c2c0'); box(g, 0.1, 2.35, -0.6, 0.7, 0.4, 0.6, '#e7ecea'); box(g, 0.1, 2.12, -0.6, 0.5, 0.06, 0.45, '#9db4bf');
      // 종이 커버 두루마리 (수레 위)
      const cart = new T.Group(); cart.position.set(-2.25, 0, 1.25); g.add(cart);
      box(cart, 0, 0.7, 0, 0.8, 0.06, 0.55, '#d9cdb6'); for (const a of [-0.35, 0.35]) for (const b of [-0.23, 0.23]) cyl(cart, a, 0.36, b, 0.02, 0.7, '#a9a294');
      const paper = new T.Group(); const roll = cyl(paper, 0, 0.12, 0, 0.12, 0.6, '#ffffff'); roll.rotation.z = Math.PI / 2; g.add(paper);
      // 자세 받침 (선반 위의 쐐기 모양 스펀지)
      const shelf = new T.Group(); shelf.position.set(2.25, 0, 1.2); g.add(shelf); box(shelf, 0, 0.35, 0, 0.8, 0.7, 0.55, '#d3dfe1');
      const pad = new T.Group(); const w = box(pad, 0, 0.1, 0, 0.5, 0.2, 0.36, '#7fb3c9'); w.rotation.z = 0.25; g.add(pad);
      const tool = cloth(); g.add(tool);
      cyl(g, 2.3, 0.35, -1.3, 0.16, 0.7, '#e8eef0'); cyl(g, 2.3, 0.72, -1.3, 0.17, 0.05, '#4fa38a');
      return {
        rubY: Y + 0.01, focus: [0, 0.6, 0.35], zoom: 3.9, tool,
        patches: [{ id: 'table', y: Y + 0.005, color: '#a7946b', opacity: 0.5, dot: 0.1, reach: 0.26, blobs: [{ x: -0.8, z: 0.1, r: 0.3, n: 13 }, { x: 0.3, z: -0.15, r: 0.26, n: 11 }, { x: 1.0, z: 0.2, r: 0.22, n: 8 }] }],
        movers: [
          { id: 'paper', obj: paper, from: [-2.25, 1.25], to: [0, 0], r: 0.7, y: Y - 0.02, restY: Y - 0.06, lift: 0.25,
            onPlaced(o) { o.clear(); box(o, 0, 0.13, 0, 2.8, 0.01, 0.8, '#ffffff'); } },
          { id: 'pad', obj: pad, from: [2.25, 1.2], to: [-1.05, 0], r: 0.45, y: Y + 0.02, restY: Y + 0.02, lift: 0.25 },
        ],
      };
    },
  },
  // 물리치료사: 치료를 마친 매트를 닦고, 쓴 기구(공·밴드·아령)를 뒤쪽 정리대의 제자리에 놓는다.
  rehab: {
    build(g) {
      floor(g, 5.8, 4.2, '#efe2da');
      label(g, '재활치료실', -1.6, 2.0, -2.03, 1.4, 0.38);
      const Y = 0.55;
      box(g, -1.2, Y / 2, 0.45, 2.3, Y, 1.2, '#d9aa98'); box(g, -1.2, Y - 0.02, 0.45, 2.4, 0.05, 1.3, '#e7c4b5');
      // 뒤쪽 정리대: 왼쪽부터 공 바구니, 밴드 걸이, 아령 받침
      const SY = 0.62, SZ = -1.35, at = { ball: 0.35, band: 1.3, bell: 2.25 };
      box(g, 1.3, SY / 2, SZ, 3.0, SY, 0.9, '#e8dccb');
      cyl(g, at.ball, SY + 0.09, SZ, 0.32, 0.18, '#c9a77a', 0.36);
      box(g, at.band, SY + 0.04, SZ, 0.7, 0.08, 0.5, '#8c9677'); for (const x of [-0.12, 0.12]) cyl(g, at.band + x, SY + 0.15, SZ, 0.03, 0.18, '#6b7358');
      box(g, at.bell, SY + 0.03, SZ, 0.75, 0.06, 0.5, '#9a8f7d'); for (const z of [-0.15, 0.15]) box(g, at.bell, SY + 0.08, SZ + z, 0.6, 0.06, 0.06, '#7f7464');
      tag(g, '공', at.ball, SY + 0.6, SZ - 0.32); tag(g, '밴드', at.band, SY + 0.6, SZ - 0.32); tag(g, '아령', at.bell, SY + 0.6, SZ - 0.32);
      const ball2 = new T.Group(); ball(ball2, 0, 0.22, 0, 0.22, '#d6b1a2'); g.add(ball2);
      const bandG = new T.Group(); for (let i = 0; i < 3; i++) { const r = new T.Mesh(new T.TorusGeometry(0.16 - i * 0.02, 0.035, 8, 24), mat('#e07a6a')); r.rotation.x = Math.PI / 2; r.position.y = 0.04 + i * 0.035; bandG.add(r); } g.add(bandG);
      const bell = new T.Group(); const bar = cyl(bell, 0, 0.1, 0, 0.04, 0.4, '#8a97a5'); bar.rotation.z = Math.PI / 2; for (const x of [-0.2, 0.2]) { const w = cyl(bell, x, 0.1, 0, 0.1, 0.1, '#47566a'); w.rotation.z = Math.PI / 2; } g.add(bell);
      const tool = cloth(); g.add(tool);
      return {
        rubY: Y + 0.01, focus: [0.1, 0.4, 0.2], zoom: 3.9, tool,
        slots: Object.entries(at).map(([id, x]) => ({ id, at: [x, SZ], y: SY + 0.1, r: 0.36 })),
        patches: [{ id: 'mat', y: Y + 0.005, color: '#b98f7d', opacity: 0.55, dot: 0.1, reach: 0.26, blobs: [{ x: -1.8, z: 0.4, r: 0.28, n: 12 }, { x: -1.0, z: 0.25, r: 0.26, n: 11 }, { x: -0.5, z: 0.7, r: 0.2, n: 7 }] }],
        movers: [
          { id: 'ball', obj: ball2, from: [0.6, 1.25], slot: 'ball', y: 0.02, restY: SY + 0.1, lift: 0.3 },
          { id: 'band', obj: bandG, from: [1.4, 1.35], slot: 'band', y: 0.02, restY: SY + 0.1, lift: 0.3 },
          { id: 'bell', obj: bell, from: [2.2, 1.25], slot: 'bell', y: 0.02, restY: SY + 0.1, lift: 0.3 },
        ],
      };
    },
  },
  // 소방관 ⓪ 잘못 울린 화재경보: 감지기 아래의 물기를 살펴 불이 아닌 것을 확인하고, 가습기를 감지기에서 먼 곳으로 옮기고, 수신기를 되돌린다.
  // 실제 확인 절차를 아주 단순하게 줄인 무대다. 경보 불빛은 2초에 한 번 부드럽게 오르내린다(번쩍이지 않게).
  alarmcheck: {
    build(g) {
      floor(g, 5.8, 4.2, '#ebe6dc');
      label(g, '학원 3층 복도', -0.5, 1.45, -2.03, 1.5, 0.36); // 위쪽 띠에 가리지 않게 낮게 단다
      box(g, -1.85, 1.5, -2.02, 1.3, 0.85, 0.04, '#bcd8e4'); box(g, -1.85, 1.5, -2.0, 0.04, 0.85, 0.03, '#f3efe6'); // 창
      const Y = 0.75;
      box(g, -1.85, Y / 2, -1.6, 1.0, Y, 0.6, '#e2d6c3'); box(g, -1.85, Y - 0.02, -1.6, 1.05, 0.04, 0.65, '#f3ece1'); // 창가 선반
      box(g, 0.1, Y / 2, -1.05, 2.1, Y, 0.95, '#d7c3a6'); box(g, 0.1, Y - 0.02, -1.05, 2.2, 0.05, 1.05, '#efe3cf'); // 감지기 아래 탁자
      // 천장 가까이 벽에 단 연기 감지기 (빨간 불이 천천히 오르내린다)
      cyl(g, 0.4, 2.15, -1.96, 0.3, 0.1, '#f7f4ec').rotation.x = Math.PI / 2; cyl(g, 0.4, 2.15, -1.9, 0.18, 0.04, '#e4ded2').rotation.x = Math.PI / 2;
      const led = new T.Mesh(new T.SphereGeometry(0.07, 12, 8), new T.MeshBasicMaterial({ color: '#e2513a', transparent: true, opacity: 0.9 })); led.position.set(0.4, 2.15, -1.86); g.add(led);
      tag(g, '연기 감지기', 1.2, 2.2, -1.9, 1.05, 0.4);
      // 화재 수신기: 경보가 울린 곳을 알려 주는 상자. 복구 열쇠를 꽂으면 되돌아간다
      const P = [2.15, -1.45];
      box(g, P[0], 0.65, P[1], 0.85, 1.3, 0.55, '#f3efe6'); box(g, P[0], 1.31, P[1], 0.9, 0.04, 0.6, '#d9d3c7');
      const lamp = new T.Mesh(new T.CircleGeometry(0.09, 16), new T.MeshBasicMaterial({ color: '#e2513a' })); lamp.rotation.x = -Math.PI / 2; lamp.position.set(P[0] - 0.22, 1.335, P[1] + 0.12); g.add(lamp);
      box(g, P[0] + 0.12, 1.335, P[1] + 0.12, 0.3, 0.012, 0.12, '#5b5f66');
      tag(g, '화재 수신기', P[0], 1.95, P[1] - 0.2, 1.05, 0.4);
      // 가습기와 김
      const humid = new T.Group(); cyl(humid, 0, 0.22, 0, 0.17, 0.44, '#cfe3ea'); cyl(humid, 0, 0.46, 0, 0.08, 0.06, '#9fc1cf'); g.add(humid);
      const puffs = [0, 1, 2, 3].map((k) => { const m = new T.Mesh(new T.SphereGeometry(0.12, 10, 8), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false })); m.userData.k = k; g.add(m); return m; });
      // 복구 열쇠 (앞쪽 깔개 위)
      box(g, -0.4, 0.012, 1.35, 1.6, 0.02, 0.7, '#cfd6d8');
      const key = new T.Group(); box(key, 0, 0.04, 0, 0.36, 0.05, 0.12, '#f2c94c'); const ring = new T.Mesh(new T.TorusGeometry(0.09, 0.03, 8, 18), mat('#f2c94c')); ring.rotation.x = Math.PI / 2; ring.position.set(-0.24, 0.04, 0); key.add(ring); g.add(key);
      tag(g, '복구 열쇠', -0.4, 0.55, 1.05, 0.9, 0.36);
      // 함께 나온 팀장과 학원 선생님
      const boss = person({ coat: KHAKI, seed: 1, hair: 2, outfit: 'turnout' }); boss.root.position.set(-2.45, 0, 0.55); boss.root.rotation.y = 0.9; g.add(boss.root);
      const teacher = person({ coat: '#b5c4dc', seed: 6, hair: 1 }); teacher.root.position.set(2.45, 0, 0.75); teacher.root.rotation.y = -1.9; g.add(teacher.root);
      const tool = cloth(); g.add(tool);
      let on = true, moved = false;
      const H0 = [0.75, -1.25];
      return {
        rubY: Y + 0.01, focus: [0, 0.6, 0.2], zoom: 3.9, tool,
        patches: [{ id: 'look', y: Y + 0.005, color: '#9fd0ea', opacity: 0.7, dot: 0.1, reach: 0.26, blobs: [{ x: -0.35, z: -0.9, r: 0.3, n: 15 }, { x: 0.25, z: -0.72, r: 0.2, n: 8 }] }], // 감지기 아래 탁자에 맺힌 물기
        movers: [
          { id: 'humid', obj: humid, from: H0, to: [-1.85, -1.6], r: 0.5, y: Y, dragY: Y, restY: Y, lift: 0.25, ringY: Y + 0.01, onPlaced() { moved = true; } },
          { id: 'reset', obj: key, from: [-0.4, 1.35], to: P, r: 0.45, y: 0.03, dragY: 1.32, restY: 1.34, lift: 0.2, ringY: 1.345, onPlaced() { on = false; lamp.material.color.set('#3f9d7d'); led.material.color.set('#9fb6c4'); } },
        ],
        tick(dt, t) {
          led.material.opacity = on && !reduced ? 0.65 + 0.3 * Math.sin(t * Math.PI) : 0.9; // 2초에 한 번 부드럽게
          for (const m of puffs) {
            const ph = (t * 0.35 + m.userData.k / 4) % 1, base = humid.position;
            m.visible = !reduced || m.userData.k === 0;
            m.position.set(base.x + Math.sin(ph * 4 + m.userData.k) * 0.08, base.y + 0.5 + (reduced ? 0.25 : ph * 1.3), base.z);
            m.scale.setScalar(0.6 + ph * 1.4); m.material.opacity = (moved ? 0.25 : 0.45) * (reduced ? 0.8 : Math.sin(ph * Math.PI));
          }
          boss.update(t, false); teacher.update(t, false);
        },
      };
    },
  },
  // 소방관 ① 교대 점검: 바닥에 내려 둔 장비를 소방차 장비함의 제자리 칸에 싣고, 차고 바닥의 물기를 닦는다.
  gearcheck: {
    build(g) {
      floor(g, 5.8, 4.2, '#e6e3dc');
      label(g, '차고 · 1호차', 1.9, 2.35, -2.03, 1.5, 0.38);
      const SY = 0.62, SZ = -1.0, at = { helmet: -1.5, tank: 0, lantern: 1.5 };
      box(g, 0, 1.3, -1.66, 5.0, 1.5, 0.75, RED); box(g, 0, 0.62, -1.66, 5.02, 0.12, 0.77, CREAM); // 소방차 옆면
      box(g, 0, SY / 2, SZ, 4.7, SY, 0.62, STEEL); box(g, 0, SY - 0.01, SZ, 4.8, 0.04, 0.68, '#d8d3c8'); // 열어 둔 장비함 선반
      for (const x of [-0.75, 0.75]) box(g, x, SY + 0.18, SZ, 0.05, 0.36, 0.6, '#a39e94');
      for (const x of Object.values(at)) box(g, x, SY + 0.015, SZ, 0.8, 0.02, 0.46, '#8f8a80');
      for (const x of Object.values(at)) { box(g, x, 1.22, -1.27, 1.3, 0.95, 0.03, '#b8493a'); box(g, x, 1.74, -1.25, 1.3, 0.1, 0.05, CREAM); } // 올려 둔 장비함 문
      tag(g, '헬멧', at.helmet, SY + 0.72, SZ - 0.08, 1.05, 0.48); tag(g, '공기호흡기', at.tank, SY + 0.72, SZ - 0.08, 1.3, 0.48); tag(g, '랜턴', at.lantern, SY + 0.72, SZ - 0.08, 1.05, 0.48);
      box(g, 0.2, 0.012, 1.3, 4.6, 0.02, 0.9, '#cfd6d8'); // 점검하려고 장비를 내려 둔 깔개
      const things = { helmet: helmet(), tank: tank(), lantern: lantern() };
      for (const o of Object.values(things)) g.add(o);
      const tool = mop(); g.add(tool);
      return {
        rubY: 0.03, focus: [0, 0.45, 0.2], zoom: 3.9, tool,
        slots: Object.entries(at).map(([id, x]) => ({ id, at: [x, SZ], y: SY + 0.04, r: 0.4 })),
        patches: [{ id: 'floor', y: 0.02, color: '#9fd0ea', opacity: 0.7, dot: 0.12, reach: 0.3, blobs: [{ x: -0.5, z: 0.1, r: 0.5, n: 22, squash: 0.7 }, { x: 1.0, z: 0.3, r: 0.3, n: 10 }] }],
        movers: [['helmet', 1.7, 1.25], ['tank', -1.6, 1.3], ['lantern', 0.1, 1.4]].map(([id, x, z]) => ({ id, obj: things[id], from: [x, z], slot: id, y: 0.03, restY: SY + 0.02, lift: 0.3 })),
      };
    },
  },
  // 소방관 ② 방수 훈련: 호스를 펴고, 관창을 끼우고, 소화전을 연 뒤에야 물이 나온다. 물줄기로 바닥 표적의 불꽃 표시를 지운다.
  drill: {
    build(g) {
      floor(g, 5.8, 4.2, '#e4e2da');
      label(g, '훈련장', 1.9, 2.0, -2.03, 1.1, 0.38);
      hydrant(g, -2.2, -1.3); cone(g, -2.6, 0.2); cone(g, -2.6, 1.7);
      for (const [x, z] of [[0.9, -0.9], [2.0, 0.45]]) { cyl(g, x, 0.012, z, 0.62, 0.02, '#5b5f66'); cyl(g, x, 0.02, z, 0.5, 0.02, '#6d727a'); } // 두 원판의 윗면은 0.008 차이 (겹쳐 지글거리지 않게)
      box(g, 1.2, 0.012, 1.55, 2.6, 0.02, 0.7, '#cfd6d8'); // 장비를 내려 둔 깔개
      const hose = hoseRoll(), noz = nozzle(), key = wrench(); g.add(hose, noz, key);
      const END = [-0.4, 1.0]; // 호스를 펴면 끝이 오는 곳 (관창을 끼우는 자리)
      const mate = person({ coat: KHAKI, seed: 3, hair: 1, outfit: 'turnout' }); mate.root.position.set(-1.3, 0, -1.6); mate.root.rotation.y = 0.5; g.add(mate.root);
      const me = hoseHolder(g, END[0] - 0.15, END[1]);
      const water = makeWater(g, me.tip, { kick: me.kick }), tool = water.pointer; // 소화전을 열기 전에는 물이 나오지 않는다
      return {
        rubY: 0.03, focus: [0, 0.3, 0.15], zoom: 3.9, tool,
        patches: [{ id: 'fire', y: 0.03, color: '#f08a3c', opacity: 0.9, dot: 0.1, reach: 0.16, blobs: [{ x: 0.9, z: -0.9, r: 0.42, n: 30 }, { x: 2.0, z: 0.45, r: 0.42, n: 30 }] }], // 물이 지나간 길만 조금씩 지워지게 닿는 폭을 좁히고 점을 늘린다
        movers: [
          { id: 'hose', obj: hose, from: [0.3, 1.55], to: [-1.6, -0.75], r: 0.55, y: 0.03, lift: 0.3,
            onPlaced(o) { o.clear(); const t = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([[-0.45, 0.07, -0.5], [0, 0.07, 0.2], [0.5, 0.07, 0.6], [0.8, 0.07, 1.4], [1.2, 0.07, 1.75]].map((v) => new T.Vector3(...v))), 30, 0.065, 6, false), mat('#e8dfc8')); t.castShadow = true; o.add(t); } },
          { id: 'nozzle', obj: noz, from: [1.3, 1.55], to: END, r: 0.5, y: 0.03, restY: 0.2, lift: 0.3 },
          { id: 'valve', obj: key, from: [2.2, 1.55], to: [-2.2, -1.3], r: 0.5, y: 0.03, restY: 0.86, lift: 0.3, onPlaced() { noz.visible = false; me.show(); water.setOn(true); } }, // 물이 들어오면 관창을 들고 선다
        ],
        stop() { water.stop(); },
        tick(dt, t) {
          mate.update(t, false); if (tool.visible) me.me.act('hold'); me.me.update(t, false); water.tick(dt, t);
        },
      };
    },
  },
  // 소방관 ③ 출동에서 돌아와: 방화복의 그을음을 닦고, 다 쓴 공기통을 충전대로 보내고, 채운 공기통을 차에 싣는다.
  washdown: {
    build(g) {
      floor(g, 5.8, 4.2, '#e6e3dc');
      label(g, '차고 · 세척대', 0, 2.0, -2.03, 1.6, 0.38);
      const Y = 0.8;
      box(g, 0, Y / 2, 0.3, 2.5, Y, 1.25, '#c9d3d6'); box(g, 0, Y - 0.02, 0.3, 2.6, 0.05, 1.35, '#e9eff0'); // 세척대
      box(g, 0, Y + 0.035, 0.3, 1.5, 0.06, 1.0, KHAKI); for (const z of [0.0, 0.6]) box(g, 0, Y + 0.068, z, 1.5, 0.008, 0.07, GLOW); // 펼쳐 둔 방화복
      for (const s of [-1, 1]) { const arm = box(g, s * 0.95, Y + 0.035, 0.05, 0.6, 0.06, 0.3, KHAKI); arm.rotation.y = s * 0.5; }
      cyl(g, -1.0, Y + 0.1, 0.75, 0.13, 0.2, '#8fc6d8'); // 물통
      const L = [-2.25, -0.85], R = [2.3, -0.85], R2 = [2.3, 0.75];
      box(g, L[0], 0.3, L[1], 1.1, 0.6, 1.1, RED); box(g, L[0], 0.61, L[1], 1.14, 0.04, 1.14, CREAM); tag(g, '1호차', L[0], 1.5, L[1] - 0.45); // 소방차 뒤 발판
      box(g, 2.3, 0.25, -0.05, 0.95, 0.5, 2.5, STEEL); box(g, 2.72, 0.75, -0.05, 0.08, 1.0, 2.5, '#a39e94'); tag(g, '충전대', 2.3, 1.45, -1.3); // 공기 충전대
      for (const p of [R, R2]) box(g, p[0], 0.51, p[1], 0.6, 0.02, 0.6, '#8f8a80');
      const used = tank('#d0584a'), fresh = tank('#4fa36b'); g.add(used, fresh);
      const tool = cloth(); g.add(tool);
      return {
        rubY: Y + 0.075, focus: [0, 0.55, 0.3], zoom: 3.9, tool,
        patches: [{ id: 'soot', y: Y + 0.072, color: '#4a443c', opacity: 0.7, dot: 0.1, reach: 0.26, blobs: [{ x: -0.4, z: 0.15, r: 0.3, n: 15 }, { x: 0.35, z: 0.5, r: 0.28, n: 13 }, { x: 0.3, z: -0.05, r: 0.18, n: 7 }, { x: -0.3, z: 0.6, r: 0.16, n: 6 }] }],
        movers: [
          { id: 'used', obj: used, from: L, to: R2, r: 0.55, y: 0.63, restY: 0.52, lift: 0.3 },
          { id: 'fresh', obj: fresh, from: R, to: L, r: 0.6, y: 0.52, restY: 0.63, lift: 0.3 },
        ],
      };
    },
  },
  // 소방관 ④ 출동 현장: 식당 뒤 골목의 상자 더미에 붙은 불. 안전선 → 호스 → 물줄기 → 탄 상자 걷기 → 속의 불씨까지.
  // 실제 진압을 아주 단순하게 줄인 무대다. 불꽃은 지운 만큼 작아진다.
  firescene: {
    build(g) {
      floor(g, 5.8, 4.2, '#e2ded6');
      label(g, '식당 뒤 골목', -0.1, 2.05, -2.03, 1.6, 0.38);
      box(g, -1.0, 1.0, -2.02, 0.9, 2.0, 0.06, '#c9a77a'); ball(g, -0.7, 1.0, -1.97, 0.05, '#8f8a80'); // 식당 뒷문
      box(g, -2.45, 0.75, -1.35, 0.9, 1.5, 1.3, RED); box(g, -2.45, 0.5, -1.35, 0.92, 0.12, 1.32, CREAM); // 골목 어귀에 댄 소방차
      const Y = 0.3, PX = 0.5, PZ = -0.5;
      const pile = box(g, PX, 0.14, PZ, 2.0, 0.28, 1.3, '#7a5c44'); pile.material = pile.material.clone(); const WOOD = new T.Color('#7a5c44'), CHAR = new T.Color('#463a34'); // 불을 끌수록 그을린 색이 드러난다
      for (const dx of [-0.66, 0, 0.66]) box(g, PX + dx, 0.285, PZ, 0.03, 0.01, 1.3, '#5f463a'); // 불이 붙은 상자·깔판 더미
      box(g, PX - 0.75, 0.2, PZ + 0.72, 0.4, 0.4, 0.3, '#b08a62'); box(g, PX + 0.8, 0.17, PZ + 0.75, 0.34, 0.34, 0.3, '#b08a62');
      // 불꽃 자리 여섯: 왼쪽 셋, 오른쪽 셋. 물이 닿은 쪽부터 줄어든다.
      const spots = [[-0.82, -0.05, 1], [-0.55, 0.12, 0.8], [-0.62, -0.25, 0.9], [0.5, -0.02, 0.85], [0.8, 0.1, 1], [0.68, -0.24, 0.8]].map(([dx, dz, sz]) => ({ x: PX + dx, y: Y, z: PZ + dz, s: sz }));
      const fire = makeFire(g, spots, { smokeAt: [PX, 0.75, PZ] });
      const glow = makeEmberGlow(g, PX, Y + 0.02, PZ + 0.25);
      const debris = new T.Group(); box(debris, 0, 0.13, 0, 0.5, 0.26, 0.5, '#4f423a'); box(debris, 0.06, 0.33, -0.03, 0.32, 0.14, 0.32, '#5f5048').rotation.y = 0.4; g.add(debris);
      const line = new T.Group(); for (const s of [-0.8, 0.8]) { box(line, s, 0.02, 0, 0.3, 0.04, 0.3, '#e98a4a'); cyl(line, s, 0.24, 0, 0.12, 0.42, '#f09a5a', 0.03); } box(line, 0, 0.36, 0, 1.6, 0.09, 0.02, '#f2c94c'); g.add(line);
      const hose = hoseRoll(); g.add(hose);
      const TO = [-1.35, 0.45];
      const me = hoseHolder(g, TO[0] - 0.1, TO[1]);
      const water = makeWater(g, me.tip, { kick: me.kick, hot: (x, z) => fire.near(x, z), puddle: [PX, 0.03, PZ + 1.05], wetY: (x, z) => (Math.abs(x - PX) < 1.0 && Math.abs(z - PZ) < 0.65 ? Y : 0.024) }), tool = water.pointer; // 호스를 끌어오기 전에는 물이 나오지 않는다. 젖은 자국은 더미 위면 더미 높이에, 밖이면 바닥에 둔다
      // 팀장은 뒷문 곁에서 안쪽을 살핀다 (물을 쏘는 나와 겹쳐 보이지 않게)
      const boss = person({ coat: KHAKI, seed: 1, hair: 2, outfit: 'turnout' }); boss.root.position.set(-0.35, 0, -1.55); boss.root.rotation.y = 0.5; g.add(boss.root);
      // 구경하는 사람들은 불을 가리지 않게 오른쪽에 선다. 처음에는 너무 가깝고, 안전선을 세우면 물러선다.
      const crowd = [[1.95, -0.35, '#c9b6d6', 5], [2.1, 0.5, '#a9c7b9', 6]].map(([x, z, c, s]) => { const p = person({ coat: c, seed: s, hair: s % 3 }); p.root.position.set(x, 0, z); p.root.rotation.y = -Math.PI / 2; g.add(p.root); return p; });
      glow.set(1); fire.setEmber(1);
      return {
        rubY: Y + 0.01, focus: [0, 0.4, 0.05], zoom: 3.9, tool,
        patches: [
          { id: 'flame', y: Y + 0.005, color: '#f08a3c', opacity: 0.9, dot: 0.1, reach: 0.16, blobs: [{ x: PX - 0.65, z: PZ, r: 0.32, n: 30 }, { x: PX + 0.65, z: PZ, r: 0.32, n: 30 }] }, // 닿는 폭을 좁혀, 물을 뿌린 길을 따라 조금씩 줄어든다. // 가운데의 탄 상자(집는 물건)와 겹치지 않게 양옆에 둔다
          { id: 'ember', y: Y + 0.005, color: '#e2513a', opacity: 0.95, dot: 0.08, reach: 0.15, blobs: [{ x: PX, z: PZ + 0.25, r: 0.2, n: 18 }] },
        ],
        movers: [
          { id: 'line', obj: line, from: [-1.55, 1.7], to: [1.95, 0.1], r: 0.65, y: 0.02, lift: 0.3, onPlaced(o) { o.rotation.y = Math.PI / 2; for (const p of crowd) p.root.position.x += 0.5; } },
          { id: 'hose', obj: hose, from: [-1.75, -0.2], to: TO, r: 0.6, y: 0.03, lift: 0.3,
            onPlaced(o) { o.clear(); const t = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([[-1.2, 0.07, -1.0], [-0.8, 0.07, -0.3], [-0.45, 0.07, 0.25], [-0.35, 0.07, 0.3]].map((v) => new T.Vector3(...v))), 30, 0.065, 6, false), mat('#e8dfc8')); t.castShadow = true; o.add(t); me.show(); water.setOn(true); } }, // 호스를 끌어오면 관창을 들고 선다
          { id: 'debris', obj: debris, from: [PX, PZ + 0.25], to: [-0.6, 1.45], r: 0.6, y: Y, restY: 0.02, lift: 0.3, onPlaced() { glow.show(true); } },
        ],
        // 물이 닿아 지워진 만큼, 그 가까이의 불꽃만 줄어든다
        onRub(id, v, dots) {
          if (id === 'ember') { glow.set(1 - v); fire.setEmber(1 - v); return; }
          spots.forEach((sp, i) => { const near = dots.filter((d) => Math.hypot(d.mesh.position.x - sp.x, d.mesh.position.z - sp.z) < 0.42); fire.set(i, v >= 1 || !near.length ? 0 : near.filter((d) => !d.clean).length / near.length); });
        },
        stop() { water.stop(); },
        tick(dt, t) { fire.tick(dt, t); glow.tick(dt, t); if (tool.visible) me.me.act('hold'); me.me.update(t, false); water.tick(dt, t); pile.material.color.lerpColors(CHAR, WOOD, 0.35 + 0.65 * fire.level()); boss.update(t, false); for (const p of crowd) p.update(t, false); },
      };
    },
  },

  // ── 간호사 (7층 병동). 의료 처치는 다루지 않는다: 손 위생, 환자 확인, 침대 곁 살피기, 모니터 값 옮겨 적기 ──
  // 간호사 ① 702호 문 앞: 손 소독제로 손을 문지르고, 차트 둘 가운데 팔찌와 이름·생년월일이 모두 같은 것을 팔찌 옆에 대어 본다
  idcheck: {
    build(g) {
      floor(g, 5.8, 4.2, '#eadfca');
      label(g, '702호 병실', 1.6, 2.0, -2.03, 1.5, 0.38);
      const B = [0.75, -1.0]; const pt = wardBed(g, B[0], B[1], { skin: '#e6bfa1', hair: '#66534a' });
      // 이불 위로 나온 팔과 팔찌
      const arm = cyl(g, B[0] + 0.05, 0.9, B[1] + 0.48, 0.065, 0.62, '#e6bfa1'); arm.rotation.z = Math.PI / 2; ball(g, B[0] + 0.4, 0.9, B[1] + 0.48, 0.08, '#e6bfa1');
      const band = cyl(g, B[0] + 0.24, 0.9, B[1] + 0.48, 0.078, 0.09, '#f6efe0'); band.rotation.z = Math.PI / 2;
      tag2(g, ['팔찌', '박다온 · 1958.03.14'], B[0] + 0.2, 1.5, B[1] + 0.2, 1.3, 0.5);
      const ok = tag2(g, ['이름 ✓', '생년월일 ✓'], B[0] + 1.55, 1.5, B[1] + 0.2, 1.0, 0.5, '#2f8f6c'); ok.visible = false;
      const say = tag2(g, ['“네, 박다온이에요.”'], B[0] - 0.55, 1.75, B[1] - 0.2, 1.5, 0.36); say.visible = false;
      // 문 앞 손 소독제와 내 손 (손바닥에 묻은 것을 문질러 소독한다)
      box(g, -2.75, 1.0, 0.6, 0.12, 2.0, 1.3, '#e6dac8'); // 문틀
      cyl(g, -2.3, 0.55, 0.15, 0.05, 1.1, '#a5afb1'); cyl(g, -2.3, 1.2, 0.15, 0.12, 0.3, '#d6ecf2'); cyl(g, -2.3, 1.39, 0.15, 0.04, 0.08, '#4fa38a'); box(g, -2.22, 1.42, 0.15, 0.16, 0.03, 0.05, '#4fa38a');
      tag(g, '손 소독제', -2.15, 1.85, 0.2, 0.95, 0.36);
      const SH = [-1.35, 1.05]; box(g, SH[0], 0.27, SH[1], 1.5, 0.54, 0.85, '#efe3cf'); box(g, SH[0], 0.555, SH[1], 1.55, 0.03, 0.9, '#f6efe3'); // 손을 올려 둔 낮은 선반
      hands(g, SH[0], 0.57, SH[1]);
      tag(g, '내 손', SH[0] - 0.55, 0.95, SH[1] + 0.55, 0.62, 0.3);
      // 차트 수레: 차트 둘 (이름은 같고 생년월일이 다르다)
      const CT = [1.75, 1.3]; box(g, CT[0], 0.36, CT[1], 2.2, 0.72, 0.72, '#e3d6c3'); box(g, CT[0], 0.735, CT[1], 2.25, 0.03, 0.78, '#f3ece1');
      const chart = clip(['박다온', '1958.03.14']), other = clip(['박다온', '1962.07.02']); g.add(chart, other);
      const foam = new T.Group(); for (const [x, z, r] of [[0, 0, 0.11], [0.09, 0.05, 0.08], [-0.08, 0.06, 0.07]]) ball(foam, x, 0.03, z, r, '#f6fbfc', [1, 0.45, 1]); g.add(foam);
      let checked = false;
      return {
        rubY: 0.64, tool: foam,
        patches: [{ id: 'rub', y: 0.635, color: '#9bbf7f', opacity: 0.6, dot: 0.055, reach: 0.2, blobs: [{ x: SH[0] - 0.28, z: SH[1], r: 0.26, n: 10, squash: 1.3 }, { x: SH[0] + 0.28, z: SH[1], r: 0.26, n: 10, squash: 1.3 }] }],
        movers: [
          { id: 'chart', obj: chart, from: [CT[0] + 0.55, CT[1]], to: [B[0] + 0.3, B[1] + 0.95], r: 0.42, y: 0.76, dragY: 0.9, restY: 0.92, lift: 0.2, ringY: 0.92, onPlaced() { checked = true; ok.visible = true; say.visible = true; } },
          { id: 'chartB', obj: other, from: [CT[0] - 0.55, CT[1]], to: [B[0] + 0.3, B[1] + 0.95], r: 0.42, y: 0.76, dragY: 0.9, restY: 0.92, lift: 0.2, ringY: 0.92 },
        ],
        tick(dt, t) { pt.update(t, checked); },
      };
    },
  },
  // 간호사 ② 701호 호출: 내려간 베개를 머리 쪽으로, 바닥에 떨어진 호출 벨을 잘 쓰는 손 곁으로, 내려간 난간을 올린다
  bedside: {
    build(g) {
      floor(g, 5.8, 4.2, '#eadfca');
      label(g, '701호 병실', 1.6, 2.0, -2.03, 1.5, 0.38);
      const B = [0.35, -0.95]; const pt = wardBed(g, B[0], B[1], { skin: '#f1d4b7', hair: '#9a948c', low: true, pillow: false });
      // 오른팔(앞쪽)은 붕대, 왼팔(뒤쪽)은 이불 위에. 누운 사람의 오른쪽이 화면 앞쪽이다
      const right = cyl(g, B[0] - 0.05, 0.9, B[1] + 0.5, 0.1, 0.6, '#eef2f4'); right.rotation.z = Math.PI / 2;
      const left = cyl(g, B[0] - 0.05, 0.9, B[1] - 0.5, 0.065, 0.6, '#f1d4b7'); left.rotation.z = Math.PI / 2; ball(g, B[0] + 0.3, 0.9, B[1] - 0.5, 0.08, '#f1d4b7');
      tag(g, '오른팔 · 붕대', B[0] + 0.8, 1.12, B[1] + 0.45, 1.15, 0.32); tag(g, '왼손', B[0] + 0.95, 1.4, B[1] - 0.65, 0.6, 0.3);
      const say = tag2(g, ['“이제 편해요. 벨도 손에 닿네요.”'], B[0] - 0.4, 1.85, B[1] - 0.1, 2.0, 0.36); say.visible = false;
      // 협탁
      box(g, -2.2, 0.38, -1.25, 0.6, 0.76, 0.55, '#efe4d4'); cyl(g, -2.2, 0.85, -1.25, 0.07, 0.16, '#c1d4dc');
      // 베개 (침대 발치로 밀려 내려가 있다)
      const pillow = new T.Group(); box(pillow, 0, 0.05, 0, 0.42, 0.13, 0.78, '#ffffff'); box(pillow, 0, 0.12, 0, 0.36, 0.02, 0.7, '#f1f4f6'); g.add(pillow);
      // 호출 벨: 바닥에 떨어져 있다
      const bell = new T.Group(); box(bell, 0, 0.05, 0, 0.16, 0.1, 0.3, '#e8eef0'); cyl(bell, 0, 0.11, -0.05, 0.05, 0.03, '#e2513a'); g.add(bell);
      const bellTag = tag(g, '떨어진 호출 벨', 2.1, 0.45, 0.85, 1.1, 0.3);
      // 침대 난간: 내려가 앞쪽에 처져 있다
      const rail = new T.Group(); box(rail, 0, 0.0, 0, 1.3, 0.06, 0.06, '#8fa3a8'); box(rail, 0, 0.16, 0, 1.3, 0.05, 0.05, '#8fa3a8'); for (const x of [-0.55, 0, 0.55]) box(rail, x, 0.08, 0, 0.04, 0.2, 0.04, '#8fa3a8'); g.add(rail);
      const railTag = tag(g, '내려간 난간', -0.95, 0.45, B[1] + 1.4, 1.05, 0.3);
      let comfy = false;
      return {
        slots: [
          { id: 'bell', at: [B[0] + 0.2, B[1] - 0.38], y: 0.9, r: 0.34 }, // 왼손 곁 (이불 위)
          { id: 'right', at: [B[0] + 0.2, B[1] + 0.32], y: 0.9, r: 0.34 }, // 붕대 감은 오른손 곁
        ],
        movers: [
          { id: 'pillow', obj: pillow, from: [B[0] + 1.0, B[1]], to: [B[0] - 0.98, B[1]], r: 0.45, y: 0.88, restY: 0.78, lift: 0.2, ringY: 0.9, onPlaced() { comfy = true; pt.lift(); } },
          { id: 'bell', obj: bell, slot: 'bell', from: [2.1, 1.3], y: 0.02, dragY: 0.9, restY: 0.92, lift: 0.18, onPlaced() { bellTag.visible = false; } },
          { id: 'rail', obj: rail, from: [B[0] + 0.1, B[1] + 1.15], to: [B[0] + 0.1, B[1] + 0.68], r: 0.3, y: 0.3, dragY: 0.9, restY: 0.9, lift: 0.15, ringY: 0.95, onPlaced() { say.visible = true; railTag.visible = false; } },
        ],
        tick(dt, t) { pt.update(t, comfy); },
      };
    },
  },
  // 간호사 ③ 702호 검사 전: 침대 곁 모니터에 뜬 값을 읽고, 숫자 카드를 기록지의 알맞은 칸에 옮겨 적는다
  vitals: {
    build(g) {
      floor(g, 5.8, 4.2, '#eadfca');
      label(g, '702호 병실', 1.6, 2.0, -2.03, 1.5, 0.38);
      const B = [0.45, -1.15]; const pt = wardBed(g, B[0], B[1], { skin: '#e6bfa1', hair: '#66534a' });
      // 침대 옆 모니터 (값이 화면에 떠 있다)
      cyl(g, -1.75, 0.75, -1.35, 0.035, 1.5, '#a5afb1'); cyl(g, -1.75, 0.02, -1.35, 0.25, 0.04, '#8f9a9c');
      const scr = new T.Group(); scr.position.set(-1.75, 1.55, -1.25); scr.rotation.x = -0.35; g.add(scr);
      box(scr, 0, 0, 0, 1.35, 0.95, 0.08, '#364e61');
      const face = new T.Mesh(new T.PlaneGeometry(1.25, 0.85), new T.MeshBasicMaterial({ map: screenTexture(false) })); face.position.z = 0.045; scr.add(face);
      // 숫자 카드: 모니터에서 읽은 값 (기록지 칸과 다른 차례로 놓는다)
      box(g, -1.6, 0.25, 0.85, 1.3, 0.5, 1.95, '#e3d6c3'); box(g, -1.6, 0.515, 0.85, 1.35, 0.03, 2.0, '#f3ece1');
      tag(g, '모니터에서 읽은 값', -1.6, 0.85, -0.35, 1.25, 0.3);
      const cards = { bp: valueCard('118/76 mmHg'), temp: valueCard('36.8 ℃'), pulse: valueCard('78 회/분') }; for (const c of Object.values(cards)) g.add(c);
      // 기록지 (침대 앞 탁자 위): 체온 · 맥박 · 혈압 칸
      box(g, 1.15, 0.35, 0.85, 1.9, 0.7, 2.0, '#d9cdb6'); box(g, 1.15, 0.715, 0.85, 1.95, 0.03, 2.05, '#efe6d6');
      box(g, 1.15, 0.74, 0.85, 1.65, 0.02, 1.95, '#fffdf8'); tag(g, '기록지 · 박다온', 1.15, 1.1, -0.3, 1.3, 0.3);
      const ROWS = { temp: 0.15, pulse: 0.85, bp: 1.55 }, NAME = { temp: '체온', pulse: '맥박', bp: '혈압' };
      for (const [id, z] of Object.entries(ROWS)) { tag(g, NAME[id], 0.65, 0.8, z, 0.55, 0.28); box(g, 1.4, 0.755, z, 1.0, 0.008, 0.6, '#eef1ee'); }
      let left = 3;
      return {
        slots: Object.entries(ROWS).map(([id, z]) => ({ id, at: [1.4, z], y: 0.76, r: 0.32 })),
        movers: [['bp', 0.15], ['temp', 0.85], ['pulse', 1.55]].map(([id, z]) => ({ id, obj: cards[id], slot: id, from: [-1.6, z], y: 0.54, dragY: 0.76, restY: 0.77, lift: 0.15,
          onPlaced() { if (--left === 0) { face.material.map.dispose(); face.material.map = screenTexture(true); pt.lift(); } } })),
        tick(dt, t) { pt.update(t, left === 0); },
      };
    },
  },
};

// ── 간호사 무대의 조각 ──
// 누운 환자가 있는 병실 침대 (머리는 -x 쪽). low 면 베개 없이 아래로 미끄러져 누운 모습. lift() 하면 베개에 기대 앉는다.
function wardBed(g, x, z, { skin, hair, low = false, pillow = true }) {
  const b = new T.Group(); b.position.set(x, 0, z); g.add(b);
  box(b, 0, 0.4, 0, 2.6, 0.16, 1.3, '#d9dedb'); box(b, 0, 0.62, 0, 2.5, 0.28, 1.2, '#e6eae8');
  box(b, -1.32, 0.85, 0, 0.1, 0.8, 1.32, '#c9d6d8'); box(b, 1.32, 0.7, 0, 0.08, 0.5, 1.32, '#c9d6d8');
  for (const a of [-1.1, 1.1]) for (const c of [-0.5, 0.5]) { box(b, a, 0.18, c, 0.07, 0.36, 0.07, '#a5afb1'); ball(b, a, 0.06, c, 0.08, '#697d85'); }
  if (pillow) box(b, -0.98, 0.82, 0, 0.42, 0.12, 0.78, '#ffffff');
  box(b, 0.35, 0.83, 0, 1.75, 0.12, 1.18, '#a9c9db'); // 덮은 이불
  const head = new T.Group(); head.position.set(low ? -0.55 : -0.92, low ? 0.9 : 1.0, 0); b.add(head);
  ball(head, 0, 0, 0, 0.2, skin, [1, 0.9, 1]); ball(head, -0.06, 0.05, 0, 0.205, hair, [0.85, 0.75, 1]);
  for (const s of [-1, 1]) ball(head, 0.12, 0.13, s * 0.08, 0.022, '#35434d');
  let up = 0;
  return {
    lift() { up = 1; },
    update(t, happy) {
      head.position.x += ((up ? -0.92 : low ? -0.55 : -0.92) - head.position.x) * 0.1;
      head.position.y += ((up ? 1.05 : low ? 0.9 : 1.0) - head.position.y) * 0.1;
      head.rotation.z = reduced ? 0 : (happy ? Math.sin(t * 2.2) * 0.06 : 0); // 고개를 천천히 끄덕인다 (동작 줄이기면 가만히)
    },
  };
}
// 위에서 내려다봐도 읽히는 이름표. 두 줄이면 첫 줄은 작게(무엇인지), 둘째 줄은 크게. color 를 주면 그 색으로 한 줄
function tag2(g, lines, x, y, z, w, h, color, even = false) {
  const c = document.createElement('canvas'); c.width = 520; c.height = Math.round(520 * h / w); const k = c.getContext('2d'); const H = c.height;
  k.fillStyle = color ? '#eaf6f0' : '#fffaf0'; k.beginPath(); k.roundRect(0, 0, 520, H, 26); k.fill(); k.strokeStyle = color || '#c9b49a'; k.lineWidth = 6; k.stroke();
  k.textAlign = 'center'; k.textBaseline = 'middle';
  if (lines.length === 1) { k.fillStyle = color || '#344d63'; k.font = `bold ${Math.round(H * 0.5)}px "Gowun Dodum", sans-serif`; k.fillText(lines[0], 260, H / 2 + 3, 490); }
  else { k.fillStyle = even ? '#344d63' : '#6f7875'; k.font = `bold ${Math.round(H * (even ? 0.38 : 0.3))}px "Gowun Dodum", sans-serif`; k.fillText(lines[0], 260, H * 0.3, 490); k.fillStyle = '#344d63'; k.font = `bold ${Math.round(H * 0.38)}px "Gowun Dodum", sans-serif`; k.fillText(lines[1], 260, H * 0.7, 490); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, transparent: true })); m.position.set(x, y, z); m.rotation.x = -0.55; g.add(m); return m;
}
// 차트(클립보드): 이름과 생년월일이 적힌 종이
function clip(lines) {
  const c = new T.Group(); box(c, 0, 0.02, 0, 0.62, 0.04, 0.72, '#b59674'); box(c, 0, 0.045, 0.03, 0.55, 0.01, 0.6, '#fffaf0'); box(c, 0, 0.055, -0.33, 0.2, 0.03, 0.06, '#8d8f8f');
  tag2(c, lines, 0, 0.34, 0.05, 1.05, 0.6, null, true); return c; // 이름과 생년월일을 같은 크기로 크게 (작은 폰에서도 읽히게)
}
// 내 두 손 (손바닥이 위로). 손가락 넷과 엄지
function hands(g, x, y, z) {
  for (const s of [-1, 1]) {
    const h = new T.Group(); h.position.set(x + s * 0.28, y, z); h.rotation.y = s * 0.12; g.add(h);
    box(h, 0, 0.03, 0.05, 0.36, 0.06, 0.4, '#e6bfa1');
    for (let i = 0; i < 4; i++) { const f = cyl(h, -0.12 + i * 0.08, 0.03, -0.27, 0.03, 0.22, '#e6bfa1'); f.rotation.x = Math.PI / 2; }
    const th = cyl(h, -s * 0.22, 0.03, 0.02, 0.032, 0.2, '#e6bfa1'); th.rotation.x = Math.PI / 2; th.rotation.y = -s * 0.7;
    box(h, 0, 0.02, 0.33, 0.3, 0.05, 0.14, '#e8b1a1'); // 간호복 소매
  }
}
// 숫자 카드 (모니터에서 읽은 값)
function valueCard(text) {
  const c = new T.Group(); box(c, 0, 0.015, 0, 0.92, 0.03, 0.38, '#fff6d8');
  const m = tag2(c, [text], 0, 0.2, 0.02, 0.95, 0.36); m.rotation.x = -0.75; return c;
}
// 침대 옆 모니터 화면: 체온 · 맥박 · 혈압. done 이면 '기록함 ✓'
function screenTexture(done) {
  const c = document.createElement('canvas'); c.width = 500; c.height = 340; const k = c.getContext('2d');
  k.fillStyle = '#1f3442'; k.fillRect(0, 0, 500, 340); k.textBaseline = 'middle';
  [['체온', '36.8 ℃', '#f2c94c'], ['맥박', '78 회/분', '#7fe0b0'], ['혈압', '118/76', '#8fc6f0']].forEach(([a, b, col], i) => {
    const y = 58 + i * 100; k.fillStyle = '#c9d6dc'; k.font = 'bold 44px "Gowun Dodum", sans-serif'; k.textAlign = 'left'; k.fillText(a, 24, y);
    k.fillStyle = col; k.font = 'bold 62px "Jua", sans-serif'; k.textAlign = 'right'; k.fillText(b, 480, y);
  });
  if (done) { k.fillStyle = '#3f9d7d'; k.fillRect(300, 300, 200, 40); k.fillStyle = '#fff'; k.font = 'bold 30px "Gowun Dodum", sans-serif'; k.textAlign = 'center'; k.fillText('기록함 ✓', 400, 321); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

// 의사·환경미화 직원의 무대(closeups-hosp.js)가 함께 쓰는 조각, 그리고 그 무대를 목록에 더한다
export { floor, tag, tag2, clip, cloth };
Object.assign(CLOSEUPS, HOSP_A);
Object.assign(CLOSEUPS, HOSP_B);
