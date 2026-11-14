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
      cyl(bin, 0, 0.42, 0, 0.36, 0.84, '#c7d7c9', 0.4); cyl(bin, 0, 0.85, 0, 0.42, 0.05, '#9cb6a0'); label(bin, '세탁', 0, 0.55, 0.42, 0.5, 0.18);
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
};
