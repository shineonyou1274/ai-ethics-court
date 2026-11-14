// 가까이 보기 무대들. build(g) 는 물건을 짓고 { patches, movers, tool, rubY, focus, zoom, tick } 을 돌려준다.
//   patches: 문질러 지우는 얼룩. { id, y, color, blobs: [{ x, z, r, n }] }
//   movers : 집어서 옮기는 물건. { id, obj, from: [x, z], to: [x, z], r, y }
// 좌표는 무대 가운데가 (0, 0) 이고, 화면 아래쪽이 +z 예요.
import * as T from 'three';
import { box, cyl, ball, label, person, mat } from './kit.js';

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

export const CLOSEUPS = {
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
      label(g, '병동 · 3호실', 1.3, 2.0, -2.03, 1.6, 0.38);
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
};
