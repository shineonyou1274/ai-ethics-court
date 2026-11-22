// 임상병리사와 방사선사의 가까이 보기 무대 (카페 방식). closeups.js 의 목록에 더해진다.
// 무대 짓는 법은 closeups.js 맨 위와 같다: build(g) 가 { patches, movers, slots, tool, rubY, frame, onRub, tick } 을 돌려준다.
// 좌표는 무대 가운데가 (0, 0) 이고, 화면 아래쪽이 +z 예요. 문질러 지우는 얼룩은 한 무대 안에서 모두 같은 높이(rubY)에 둔다.
// 모두 단순하게 줄인 체험이라 실제 절차를 정답처럼 보여 주지 않는다. 바늘과 피는 그리지 않는다.
import * as T from 'three';
import { box, cyl, ball, label, person, reduced } from './kit.js';
import { floor, tag, tag2 } from './closeups.js';

const SKIN = '#e6bfa1', OLD = '#d9b49a';
// 옮기는 물건에 붙인 이름표: 손가락이 닿지 않는 것으로 한다 (물건 자체만 잡힌다)
const quiet = (m) => { m.raycast = () => {}; m.userData.tag = true; return m; };
const untag = (o) => o.traverse((c) => { if (c.userData.tag) c.visible = false; }); // 놓은 뒤에는 이름표를 감춘다 (놓인 자리를 가리지 않게)
const mtag = (o, ...a) => quiet(tag(o, ...a));
const mtag2 = (o, ...a) => quiet(tag2(o, ...a));
// 그림판 하나를 판에 붙인다 (화면, 사진). draw(k, w, h) 로 그린다
function canvasPlane(w, h, draw, px = 512) {
  const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w); const k = c.getContext('2d');
  draw(k, c.width, c.height);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t })); m.userData.redraw = (fn) => { k.clearRect(0, 0, c.width, c.height); fn(k, c.width, c.height); t.needsUpdate = true; };
  return m;
}
// 뚜껑 색이 있는 채혈 튜브 (서 있다)
function tube(g, x, y, z, cap, h = 0.62) { const t = new T.Group(); t.position.set(x, y, z); g.add(t); cyl(t, 0, h / 2, 0, 0.09, h, '#eef3f6'); cyl(t, 0, h + 0.05, 0, 0.105, 0.1, cap); return t; }

// ── 엑스선 사진 그리기 (뼈는 밝게, 바탕은 어둡게). kind: wrist · chest · ankle. blur 면 두 겹으로 흐리게, cut 이면 아래가 잘린다
function xray(k, W, H, kind) {
  k.fillStyle = '#10171d'; k.fillRect(0, 0, W, H);
  const bone = (fn) => { k.fillStyle = 'rgba(226,232,236,0.92)'; k.strokeStyle = 'rgba(226,232,236,0.92)'; fn(); };
  const draw = (dx, a) => {
    k.save(); k.translate(dx, 0); k.globalAlpha = a;
    if (kind === 'wrist') bone(() => {
      k.beginPath(); k.roundRect(W * 0.32, H * 0.62, W * 0.12, H * 0.4, 18); k.roundRect(W * 0.52, H * 0.6, W * 0.13, H * 0.42, 18); k.fill(); // 팔뼈 둘
      for (let i = 0; i < 8; i++) { k.beginPath(); k.ellipse(W * (0.36 + (i % 4) * 0.08), H * (0.5 - Math.floor(i / 4) * 0.08), W * 0.035, H * 0.035, 0, 0, 7); k.fill(); } // 손목뼈
      for (let i = 0; i < 5; i++) { k.beginPath(); k.roundRect(W * (0.27 + i * 0.1), H * (0.06 + (i === 0 ? 0.12 : 0)), W * 0.05, H * 0.3, 10); k.fill(); } // 손허리뼈
    });
    if (kind === 'chest') bone(() => {
      k.fillRect(W * 0.48, H * 0.05, W * 0.04, H * 0.9); k.lineWidth = W * 0.018;
      for (let i = 0; i < 7; i++) for (const s of [-1, 1]) { k.beginPath(); k.ellipse(W * 0.5, H * (0.2 + i * 0.1), W * 0.36, H * 0.08, 0, s < 0 ? Math.PI * 0.55 : Math.PI * 0.05, s < 0 ? Math.PI * 0.95 : Math.PI * 0.45); k.stroke(); }
    });
    if (kind === 'ankle') bone(() => {
      k.beginPath(); k.roundRect(W * 0.38, -H * 0.1, W * 0.14, H * 0.62, 18); k.roundRect(W * 0.56, -H * 0.1, W * 0.07, H * 0.6, 12); k.fill(); // 정강뼈·종아리뼈
      k.beginPath(); k.ellipse(W * 0.47, H * 0.68, W * 0.13, H * 0.1, 0, 0, 7); k.fill(); k.beginPath(); k.roundRect(W * 0.3, H * 0.8, W * 0.5, H * 0.3, 20); k.fill(); // 발 (아래가 잘림)
    });
    k.restore();
  };
  if (kind === 'chest') { k.filter = `blur(${Math.max(3, Math.round(W * 0.02))}px)`; draw(-W * 0.06, 0.55); draw(W * 0.06, 0.55); k.filter = 'none'; } else draw(0, 1); // 흐린 가슴 사진: 두 겹
  k.fillStyle = '#f2c94c'; k.font = `bold ${Math.round(H * 0.12)}px "Jua", sans-serif`; k.textAlign = 'left'; k.textBaseline = 'top'; k.fillText(kind === 'wrist' ? 'R' : kind === 'ankle' ? 'L' : 'PA', W * 0.05, H * 0.04);
}

export const HOSP_B = {
  // ── 임상병리사 ① 채혈실: 새봄 님이 말한 이름·생년월일과 같은 라벨을, 검사에 맞는 뚜껑 색 튜브에. 튜브 셋 모두에 같은 초록 원 ──
  drawlabel: {
    build(g) {
      floor(g, 5.8, 4.2, '#f2e6dc');
      label(g, '채혈실', 1.6, 2.05, -2.02, 1.1, 0.36);
      box(g, 0, 0.4, 0.15, 5.2, 0.8, 2.3, '#efe4d4'); box(g, 0, 0.815, 0.15, 5.3, 0.03, 2.4, '#f7f1e8'); // 채혈 책상
      const pt = person({ coat: '#c9b6d6', hair: 2, seed: 1 }); pt.root.position.set(-1.0, -0.25, -1.55); g.add(pt.root); // 새봄 님 (책상 뒤에 앉아 있다)
      const arm = cyl(g, -0.4, 0.88, -0.75, 0.075, 0.95, SKIN); arm.rotation.z = Math.PI / 2; ball(g, 0.12, 0.88, -0.75, 0.09, SKIN, [1.2, 0.6, 1]); // 책상에 올린 팔
      box(g, -0.4, 0.84, -0.75, 0.8, 0.05, 0.3, '#d9c3b3'); // 팔 받침
      const cotton = ball(g, -0.6, 0.97, -0.75, 0.07, '#ffffff'); cotton.visible = false; // 채혈 뒤 솜 (바늘은 그리지 않는다)
      tag2(g, ['새봄 님이 말한 이름·생년월일', '김새봄 · 1958.03.14'], -0.9, 2.3, -1.25, 2.4, 0.62);
      tag2(g, ['오늘 검사', '생화학 (칼륨)'], 1.7, 1.25, -1.0, 1.4, 0.48);
      // 튜브 꽂이와 빈 튜브 셋: 뚜껑 색이 검사를 알려 준다
      const RACK = [['purple', 0.75, '#8e6bbf', '보라 · 혈구'], ['sst', 1.5, '#e2b93b', '노랑 · 생화학'], ['blue', 2.25, '#7fb7d9', '하늘 · 응고']];
      box(g, 1.5, 0.88, -0.2, 2.2, 0.12, 0.42, '#c9bfae');
      const tubes = {}; for (const [id, x, c, t] of RACK) { tubes[id] = tube(g, x, 0.9, -0.2, c, 0.55); tag2(g, [t], x, 1.0, 0.3, 0.74, 0.32); }
      const band = box(tubes.sst, 0, 0.3, 0.06, 0.2, 0.26, 0.04, '#ffffff'); band.visible = false; // 붙인 라벨
      const named = tag2(g, ['김새봄 1958.03.14 ✓'], 1.5, 1.82, -0.35, 1.6, 0.3, '#2f8f6c'); named.visible = false;
      // 라벨 둘: 같은 이름, 다른 생년월일
      const sticker = (birth) => { const o = new T.Group(); box(o, 0, 0.012, 0, 0.82, 0.024, 0.34, '#ffffff'); box(o, -0.3, 0.026, 0, 0.12, 0.006, 0.26, '#344d63'); tag2(o, ['김새봄 · 생화학', birth], 0, 0.3, 0.08, 1.05, 0.5, null, true); g.add(o); return o; };
      const lab = sticker('1958.03.14'), labB = sticker('1987.06.02');
      tag(g, '라벨', -2.25, 1.1, 0.25, 0.55, 0.26);
      const okTag = tag2(g, ['꾹 눌렀어요 ✓'], -0.6, 1.45, -0.4, 1.3, 0.3, '#2f8f6c'); okTag.visible = false;
      const presser = new T.Group(); ball(presser, 0, 0.05, 0, 0.09, '#ffffff'); ball(presser, 0, 0.16, 0.05, 0.08, SKIN, [1.2, 0.7, 1.5]); g.add(presser); // 솜을 누르는 손가락
      let nod = 0;
      return {
        rubY: 1.0, tool: presser, frame: { top: 2.3, tilt: [0.8, 1.1] },
        slots: RACK.map(([id, x]) => ({ id, at: [x, -0.2], y: 1.55, r: 0.33 })),
        patches: [{ id: 'press', y: 1.0, color: '#7fb7d9', opacity: 0.85, dot: 0.04, reach: 0.2, blobs: [{ x: -0.6, z: -0.75, r: 0.15, n: 7 }] }],
        movers: [
          { id: 'label', obj: lab, slot: 'sst', from: [-1.75, 0.85], y: 0.84, dragY: 1.55, restY: 1.55, lift: 0.1, onPlaced(o) { o.visible = false; band.visible = true; named.visible = true; cotton.visible = true; } },
          { id: 'labelB', obj: labB, slot: 'sst', from: [-0.4, 0.85], y: 0.84, dragY: 1.55, restY: 1.55, lift: 0.1 },
        ],
        onRub(id, v) { if (v >= 1) { okTag.visible = true; nod = 1; } },
        tick(dt, t) { pt.update(t, false); if (nod && !reduced) pt.root.rotation.x = Math.sin(t * 3) * 0.03; },
      };
    },
  },

  // ── 임상병리사 ② 검체 처리실: 원심분리기 칸 여섯. 같은 양의 튜브끼리 마주 보게 넣고, 다 넣은 뒤에 뚜껑을 덮는다 ──
  centrifuge: {
    build(g) {
      floor(g, 5.8, 4.2, '#ebe6f1');
      label(g, '검체 처리실', 1.6, 2.05, -2.02, 1.3, 0.36);
      box(g, 0, 0.4, 0.1, 5.4, 0.8, 3.6, '#d8d1e3'); box(g, 0, 0.815, 0.1, 5.5, 0.03, 3.7, '#f4f1f7'); // 작업대
      const C = [-0.75, -0.3], R = 0.74;
      cyl(g, C[0], 1.0, C[1], 1.3, 0.36, '#e9e9e2'); cyl(g, C[0], 1.185, C[1], 1.12, 0.02, '#bfc6cf');
      const rotor = new T.Group(); rotor.position.set(C[0], 1.2, C[1]); g.add(rotor); cyl(rotor, 0, 0, 0, 0.98, 0.02, '#a9b2bd'); cyl(rotor, 0, 0.02, 0, 0.16, 0.04, '#7d8794');
      const HOLE = [0, 1, 2, 3, 4, 5].map((k) => { const a = -Math.PI / 2 + k * Math.PI / 3; return [C[0] + R * Math.cos(a), C[1] + R * Math.sin(a)]; });
      for (const [x, z] of HOLE) cyl(g, x, 1.215, z, 0.14, 0.012, '#4a4361');
      const loaded = (x, z, text, h) => { const t = new T.Group(); t.position.set(x, 1.22, z); g.add(t); cyl(t, 0, 0.05, 0, 0.1, 0.1, h > 4 ? '#e2b93b' : '#8e6bbf'); tag2(g, [text], x, 1.62, z + 0.15, 0.62, 0.26); };
      loaded(...HOLE[0], '5 mL', 5); loaded(...HOLE[1], '3 mL', 3);
      tag2(g, ['같은 양끼리 마주 보게'], C[0], 2.15, -1.7, 2.0, 0.32);
      // 넣을 튜브 둘 (쟁반 위)
      const mk = (cap, text) => { const o = new T.Group(); cyl(o, 0, 0.3, 0, 0.1, 0.6, '#eef3f6'); cyl(o, 0, 0.65, 0, 0.115, 0.1, cap); mtag2(o, [text], 0, 1.0, 0.1, 0.95, 0.3); g.add(o); return o; };
      const full = mk('#e2b93b', '새봄 님 · 5 mL'), half = mk('#8e6bbf', '응급실 · 3 mL');
      box(g, 1.8, 0.86, 1.05, 2.0, 0.05, 0.8, '#c4bcd6');
      // 뚜껑
      const lid = new T.Group(); cyl(lid, 0, 0.03, 0, 1.25, 0.06, '#cfd6de'); box(lid, 0, 0.09, 0, 0.5, 0.06, 0.12, '#8f9aa6'); const spinMark = box(lid, 0.8, 0.075, 0, 0.3, 0.02, 0.08, '#2f8f6c'); mtag(lid, '뚜껑', 0, 0.6, 0.5, 0.75, 0.34); lid.scale.setScalar(0.5); g.add(lid); // 놓기 전에는 작게 (튜브를 가리지 않게)
      const done = tag2(g, ['혈청과 혈구가 나뉘었어요 ✓'], 1.6, 1.85, -1.2, 2.3, 0.32, '#2f8f6c'); done.visible = false;
      let spin = 0;
      return {
        frame: { top: 2.2, tilt: [0.8, 1.1] },
        slots: [2, 3, 4, 5].map((k) => ({ id: `h${k}`, at: HOLE[k], y: 1.24, r: 0.27 })),
        movers: [
          { id: 'full', obj: full, slot: 'h3', from: [1.15, 1.05], y: 0.88, dragY: 1.24, restY: 1.0, lift: 0.3 },
          { id: 'half', obj: half, slot: 'h4', from: [2.45, 1.05], y: 0.88, dragY: 1.24, restY: 1.0, lift: 0.3 },
          { id: 'lid', obj: lid, from: [1.9, -0.9], to: C, r: 0.75, y: 0.83, dragY: 1.3, restY: 1.32, lift: 0.15, onPlaced(o) { untag(o); o.scale.setScalar(1); spin = 1; done.visible = true; } },
        ],
        tick(dt) { if (spin && !reduced) lid.rotation.y += dt * 9; else if (spin) spinMark.material.color.set('#3f9d7d'); },
      };
    },
  },

  // ── 임상병리사 ③ 자동화 검사실: 꽂이를 분석기에 → 칼륨 6.8 빨간 표시 → 튜브를 불빛에 비춰 용혈이 없는지 → 위급값 칸으로 ──
  analyzer: {
    build(g) {
      floor(g, 5.8, 4.2, '#e7edf0');
      label(g, '자동화 검사실', 1.7, 2.1, -2.02, 1.4, 0.36);
      box(g, -0.4, 0.6, -1.5, 4.4, 1.2, 1.0, '#e3e8ec'); box(g, -0.4, 1.22, -1.5, 4.45, 0.05, 1.05, '#c8d2d8'); // 분석기
      box(g, 0, 0.4, 0.55, 5.4, 0.8, 2.6, '#dfe4e8'); box(g, 0, 0.815, 0.55, 5.5, 0.03, 2.7, '#f3f6f8'); // 앞 작업대
      const screen = canvasPlane(2.2, 1.25, (k, W, H) => drawScreen(k, W, H, false)); screen.position.set(0.55, 1.65, -1.45); screen.rotation.x = -0.75; g.add(screen);
      box(g, 0.55, 1.65, -1.48, 2.3, 1.35, 0.04, '#364e61').rotation.x = -0.75;
      box(g, -1.55, 0.84, -0.4, 1.1, 0.02, 0.6, '#b9d6c9'); tag(g, '넣는 곳', -2.4, 1.05, -0.4, 0.7, 0.28); // 검체 넣는 곳
      // 확인대(불빛)와 새봄 님 튜브
      box(g, 0.55, 0.86, 0.45, 1.2, 0.08, 0.7, '#fffbe6'); const tb = cyl(g, 0.55, 0.96, 0.45, 0.09, 0.8, '#f3dc8a'); tb.rotation.z = Math.PI / 2; cyl(g, 1.0, 0.96, 0.45, 0.1, 0.12, '#e2b93b').rotation.z = Math.PI / 2;
      tag2(g, ['확인대 · 새봄 님 튜브'], 0.55, 1.3, -0.15, 1.6, 0.28);
      const clear = tag2(g, ['맑은 노란색 · 용혈 없음 ✓'], 0.55, 1.7, 0.2, 2.0, 0.3, '#2f8f6c'); clear.visible = false;
      // 위급값 칸
      box(g, 2.1, 0.85, -0.35, 1.0, 0.06, 0.7, '#f2c3bb'); tag2(g, ['위급값 · 바로 전화'], 2.1, 1.15, 0.1, 1.3, 0.3, '#c9524a');
      // 옮길 것: 검체 꽂이, 결과표
      const rack = new T.Group(); box(rack, 0, 0.06, 0, 0.9, 0.12, 0.32, '#9d93b8'); ['#e2b93b', '#e2b93b', '#8e6bbf', '#e2b93b'].forEach((c, i) => { cyl(rack, -0.3 + i * 0.2, 0.3, 0, 0.06, 0.4, '#eef3f6'); cyl(rack, -0.3 + i * 0.2, 0.53, 0, 0.07, 0.06, c); }); mtag(rack, '검체 꽂이', 0, 0.9, 0.1, 0.8, 0.26); g.add(rack);
      const card = new T.Group(); box(card, 0, 0.01, 0, 0.7, 0.02, 0.45, '#fffdf8'); mtag2(card, ['새봄 님 결과표', '칼륨 6.8 ▲'], 0, 0.32, 0.08, 1.0, 0.48, null, true); g.add(card);
      const sent = tag2(g, ['전화하러 가요 ✓'], 2.1, 1.75, -0.7, 1.5, 0.3, '#2f8f6c'); sent.visible = false;
      const tool = new T.Group(); cyl(tool, 0, 0.02, 0, 0.16, 0.02, '#fff3b0'); g.add(tool); // 비춰 보는 불빛
      return {
        rubY: 1.06, tool, frame: { top: 2.0, tilt: [0.8, 1.1] },
        patches: [{ id: 'look', y: 1.06, color: '#c9c3b6', opacity: 0.8, dot: 0.07, reach: 0.2, blobs: [{ x: 0.55, z: 0.45, r: 0.42, n: 12, squash: 0.45 }] }],
        movers: [
          { id: 'rack', obj: rack, from: [-1.55, 1.3], to: [-1.55, -0.4], r: 0.5, y: 0.83, restY: 0.86, lift: 0.2, onPlaced(o) { untag(o); screen.userData.redraw((k, W, H) => drawScreen(k, W, H, true)); } },
          { id: 'flag', obj: card, from: [2.1, 1.3], to: [2.1, -0.35], r: 0.45, y: 0.83, restY: 0.9, lift: 0.15, onPlaced() { sent.visible = true; } },
        ],
        onRub(id, v) { if (v >= 1) clear.visible = true; },
      };
    },
  },

  // ── 임상병리사 ④ 현미경실: 유리판을 올리고, 흐린 곳을 문질러 초점을 맞추고, 보라색 핵이 있는 백혈구에 핀. 세포 셋 모두에 같은 초록 원 ──
  microscope: {
    build(g) {
      floor(g, 5.8, 4.2, '#eee7dc');
      label(g, '현미경실', 1.9, 2.05, -2.02, 1.1, 0.36);
      box(g, 0, 0.4, 0.1, 5.4, 0.8, 3.4, '#e5d9c4'); box(g, 0, 0.815, 0.1, 5.5, 0.03, 3.5, '#f3ebdc'); // 책상
      const senior = person({ coat: '#c7bedc', outfit: 'scrub', hair: 2, seed: 3 }); senior.root.position.set(-2.35, 0, -1.75); senior.root.rotation.y = 0.5; g.add(senior.root);
      // 현미경
      const M = [-1.45, -0.55];
      box(g, M[0], 0.88, M[1] - 0.15, 0.8, 0.1, 0.7, '#5c6a7a'); const arm = box(g, M[0], 1.35, M[1] - 0.45, 0.16, 0.9, 0.16, '#5c6a7a'); arm.rotation.x = 0.2;
      box(g, M[0], 1.12, M[1], 0.75, 0.04, 0.55, '#3f4a57'); cyl(g, M[0], 1.55, M[1] - 0.05, 0.1, 0.5, '#3f4a57'); cyl(g, M[0], 1.88, M[1] - 0.25, 0.06, 0.3, '#2f3944');
      tag(g, '현미경', M[0], 2.1, M[1] - 0.2, 0.75, 0.28);
      // 현미경으로 보이는 모습 (커다란 원)
      const V = [1.15, -0.05];
      cyl(g, V[0], 0.85, V[1], 1.2, 0.03, '#2f3944'); cyl(g, V[0], 0.865, V[1], 1.12, 0.012, '#fbf1ee');
      tag2(g, ['현미경으로 보이는 모습'], V[0], 1.2, -1.45, 2.0, 0.3);
      const cells = new T.Group(); g.add(cells); cells.visible = false;
      const rbc = (x, z) => { cyl(cells, x, 0.872, z, 0.17, 0.012, '#e49a9a'); cyl(cells, x, 0.879, z, 0.07, 0.004, '#f6cfcb'); };
      for (const [x, z] of [[0.35, -0.55], [0.6, 0.75], [1.55, -0.75], [1.95, -0.15], [0.3, 0.2], [1.25, 0.85], [1.0, -0.2], [1.75, 0.5]]) rbc(x, z);
      const C = { c1: [0.7, -0.45], c2: [1.65, 0.12], c3: [0.95, 0.5] }; // c2 가 백혈구
      rbc(...C.c1); rbc(...C.c3);
      cyl(cells, C.c2[0], 0.872, C.c2[1], 0.22, 0.012, '#d9cde6'); for (const [a, b] of [[-0.06, -0.04], [0.06, -0.02], [0, 0.07]]) ball(cells, C.c2[0] + a, 0.88, C.c2[1] + b, 0.075, '#6b3f9c', [1, 0.25, 1]);
      // 유리판 (보라색으로 물들인 혈액)
      const slide = new T.Group(); box(slide, 0, 0.01, 0, 0.7, 0.02, 0.24, '#e6f2f5'); box(slide, 0.08, 0.022, 0, 0.32, 0.004, 0.16, '#c9a3d6'); mtag(slide, '혈액 유리판', 0, 0.42, 0.12, 0.95, 0.28); g.add(slide);
      const pin = new T.Group(); cyl(pin, 0, 0.18, 0, 0.02, 0.36, '#8f9aa6'); ball(pin, 0, 0.38, 0, 0.08, '#6b3f9c'); mtag(pin, '백혈구 핀', 0, 0.72, 0.1, 0.85, 0.26); g.add(pin);
      const found = tag2(g, ['백혈구 · 보라색 핵 ✓'], 1.65, 1.6, -0.3, 1.8, 0.3, '#2f8f6c'); found.visible = false;
      const tool = new T.Group(); cyl(tool, 0, 0.01, 0, 0.13, 0.02, '#cfd6de'); g.add(tool);
      return {
        rubY: 0.9, tool, frame: { top: 2.2, tilt: [0.8, 1.1] },
        patches: [{ id: 'focus', y: 0.9, color: '#e6e3ee', opacity: 0.92, dot: 0.15, reach: 0.3, blobs: [{ x: V[0], z: V[1], r: 1.0, n: 46 }] }],
        slots: Object.entries(C).map(([id, at]) => ({ id, at, y: 0.92, r: 0.3 })),
        movers: [
          { id: 'slide', obj: slide, from: [-0.6, 1.25], to: M, r: 0.45, y: 0.83, dragY: 1.14, restY: 1.15, lift: 0.15, onPlaced(o) { untag(o); cells.visible = true; } },
          { id: 'wbc', obj: pin, slot: 'c2', from: [2.35, 1.35], y: 0.83, dragY: 0.92, restY: 0.9, lift: 0.2, onPlaced(o) { untag(o); found.visible = true; } },
        ],
        tick(dt, t) { senior.update(t, false); },
      };
    },
  },

  // ── 방사선사 ① 일반촬영실: 판을 손목 아래 → 모래주머니로 받침 → 판 귀퉁이에 R → 손목 밖으로 퍼진 빛을 줄인다 ──
  positioning: {
    build(g) {
      floor(g, 5.8, 4.2, '#e8eef0');
      label(g, '일반촬영실', -1.4, 2.1, -2.02, 1.3, 0.36);
      box(g, 1.15, 0.4, -0.35, 2.9, 0.8, 1.5, '#c5d7df'); box(g, 1.15, 0.815, -0.35, 3.0, 0.03, 1.6, '#e8f0f3'); // 촬영대
      const W = [0.85, -0.3]; // 손목 자리
      // 로운 님: 촬영대 왼쪽 끝에 앉아, 오른팔을 촬영대 위로 뻗고 계신다
      const pt = person({ coat: '#b9c6a8', hair: 2, seed: 4 }); pt.root.position.set(-0.75, -0.32, -0.3); pt.root.rotation.y = Math.PI / 2; g.add(pt.root);
      box(g, -0.8, 0.2, -0.3, 0.7, 0.4, 0.7, '#9aa4a8'); // 의자
      const arm = cyl(g, 0.2, 0.9, -0.3, 0.075, 1.15, OLD); arm.rotation.z = Math.PI / 2; ball(g, W[0], 0.9, W[1], 0.1, OLD, [1.35, 0.55, 1.1]); // 오른팔과 손
      for (const s of [-1, 1]) { const f = cyl(g, W[0] + 0.15, 0.9, W[1] + s * 0.05, 0.025, 0.16, OLD); f.rotation.z = Math.PI / 2; }
      // 천장에서 내려온 X선관과 빛
      cyl(g, W[0], 2.75, -0.65, 0.04, 0.5, '#a5afb1'); box(g, W[0], 2.35, -0.45, 0.55, 0.32, 0.5, '#d9dedb'); box(g, W[0], 2.17, -0.35, 0.4, 0.05, 0.4, '#f2e6a6');
      const glow = box(g, W[0], 0.985, W[1], 0.62, 0.004, 0.62, '#fff3b0'); glow.material.transparent = true; glow.material.opacity = 0.55; // 손목에 맞춘 빛
      tag2(g, ['로운 님 · 오른 손목'], -0.9, 2.25, -1.3, 1.7, 0.3);
      // 수레 위 물건
      box(g, -1.95, 0.36, 1.3, 1.7, 0.72, 0.9, '#d9cdb6'); box(g, -1.95, 0.735, 1.3, 1.75, 0.03, 0.95, '#efe6d6');
      const plate = new T.Group(); box(plate, 0, 0.02, 0, 0.82, 0.04, 0.72, '#7d8a8f'); box(plate, 0, 0.042, 0, 0.7, 0.004, 0.6, '#9aa7ad'); mtag(plate, '검출기 판', 0, 0.42, 0.25, 0.85, 0.28); g.add(plate);
      const bag = new T.Group(); ball(bag, 0, 0.08, 0, 0.22, '#c4a27f', [1.4, 0.45, 0.8]); mtag(bag, '모래주머니', 0, 0.42, 0.2, 0.85, 0.28); g.add(bag);
      const letter = (ch) => { const o = new T.Group(); box(o, 0, 0.03, 0, 0.16, 0.06, 0.16, '#e9d9a0'); mtag2(o, [ch], 0, 0.14, 0.12, 0.3, 0.3, '#344d63'); g.add(o); return o; };
      const R = letter('R'), L = letter('L');
      box(g, 1.9, 0.35, 1.0, 1.4, 0.7, 0.6, '#d9cdb6'); tag(g, '좌우 표시', 1.9, 1.15, 1.45, 0.8, 0.26);
      const ok = tag2(g, ['X선은 손목에만 ✓'], 1.9, 1.75, -1.3, 1.7, 0.32, '#2f8f6c'); ok.visible = false;
      const tool = new T.Group(); box(tool, 0, 0.01, 0, 0.18, 0.02, 0.18, '#5c6a7a'); g.add(tool);
      const L0 = { y: 1.0, color: '#f6e27a', opacity: 0.6, dot: 0.08, reach: 0.2 };
      return {
        rubY: 1.0, tool, frame: { top: 2.5, tilt: [0.8, 1.1] },
        patches: [{ id: 'light', ...L0, blobs: [[-0.62, 0], [0.62, 0], [0, -0.62], [0, 0.62], [-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].map(([a, b]) => ({ x: W[0] + a, z: W[1] + b, r: 0.16, n: 4 })) }],
        movers: [
          { id: 'plate', obj: plate, from: [-2.4, 1.3], to: W, r: 0.45, y: 0.75, dragY: 0.84, restY: 0.835, lift: 0.15, onPlaced: untag },
          { id: 'bag', obj: bag, from: [-1.5, 1.3], to: [0.25, -0.68], r: 0.4, y: 0.75, dragY: 0.84, restY: 0.84, lift: 0.2, onPlaced: untag },
          { id: 'mark', obj: R, from: [1.6, 1.0], to: [W[0] + 0.05, W[1] + 0.2], r: 0.25, y: 0.72, dragY: 0.88, restY: 0.88, lift: 0.15 },
          { id: 'markL', obj: L, from: [2.2, 1.0], to: [W[0] + 0.05, W[1] + 0.2], r: 0.25, y: 0.72, dragY: 0.88, restY: 0.88, lift: 0.15 },
        ],
        onRub(id, v) { glow.scale.setScalar(1 - 0.1 * v); if (v >= 1) ok.visible = true; },
        tick(dt, t) { pt.update(t, false); },
      };
    },
  },

  // ── 방사선사 ② 조정실: 나는 납유리 창 뒤로 → 촬영실 문을 닫고 → 노출 스위치. 복도에는 가람 님이 기다린다 ──
  expose: {
    build(g) {
      floor(g, 5.8, 4.2, '#e8eef0');
      box(g, 1.5, 0.006, -0.85, 2.8, 0.012, 2.4, '#dfe6ea'); // 조정실 바닥
      box(g, 0, 0.007, 1.2, 5.8, 0.012, 1.6, '#efe4d0'); // 복도 바닥
      label(g, '촬영실', -1.6, 2.1, -2.02, 1.0, 0.34); label(g, '조정실', 1.6, 2.1, -2.02, 1.0, 0.34);
      // 촬영실과 조정실 사이 벽, 납유리 창
      box(g, 0.1, 0.55, -0.85, 0.14, 1.1, 2.4, '#e6dac8'); const glass = box(g, 0.1, 1.5, -0.85, 0.08, 0.8, 2.4, '#8fb7cc'); glass.material.transparent = true; glass.material.opacity = 0.45; glass.castShadow = false; box(g, 0.1, 2.0, -0.85, 0.14, 0.2, 2.4, '#e6dac8');
      tag(g, '납유리 창', 0.1, 2.35, -0.6, 0.9, 0.26);
      // 촬영실 앞 낮은 벽과 미닫이 문 자리 (방 안이 보이게 낮게 그렸다)
      box(g, -2.05, 0.3, 0.4, 1.7, 0.6, 0.1, '#e6dac8'); box(g, 0.05, 0.3, 0.4, 0.2, 0.6, 0.1, '#e6dac8');
      box(g, -0.6, 0.01, 0.4, 1.2, 0.02, 0.12, '#b9a184'); // 문 자리 (문턱)
      const lamp = box(g, -0.6, 2.2, -2.0, 0.6, 0.22, 0.08, '#7a3a32'); tag(g, '촬영 중', -0.6, 2.5, -1.95, 0.75, 0.28);
      // 촬영대와 로운 님
      box(g, -1.2, 0.4, -1.0, 1.4, 0.8, 1.0, '#c5d7df'); box(g, -1.2, 0.815, -1.0, 1.45, 0.03, 1.05, '#e8f0f3');
      const pt = person({ coat: '#b9c6a8', hair: 2, seed: 4 }); pt.root.position.set(-2.4, -0.32, -1.0); pt.root.rotation.y = Math.PI / 2; g.add(pt.root); box(g, -2.45, 0.2, -1.0, 0.7, 0.4, 0.7, '#9aa4a8');
      const arm = cyl(g, -1.55, 0.9, -1.0, 0.075, 1.1, OLD); arm.rotation.z = Math.PI / 2; ball(g, -0.95, 0.9, -1.0, 0.1, OLD, [1.35, 0.55, 1.1]); box(g, -0.95, 0.835, -1.0, 0.6, 0.04, 0.5, '#7d8a8f');
      // 조정실 조작대와 화면, 노출 스위치
      box(g, 1.95, 0.45, -1.65, 1.6, 0.9, 0.7, '#d6e2ea'); box(g, 1.95, 0.915, -1.65, 1.65, 0.03, 0.75, '#eef3f6');
      const scr = canvasPlane(0.9, 0.62, (k, W, H) => { k.fillStyle = '#10171d'; k.fillRect(0, 0, W, H); k.fillStyle = '#7f8c95'; k.font = `${Math.round(H * 0.13)}px "Gowun Dodum", sans-serif`; k.textAlign = 'center'; k.fillText('촬영 준비', W / 2, H / 2); });
      scr.position.set(1.65, 1.35, -1.85); scr.rotation.x = -0.35; g.add(scr); box(g, 1.65, 1.35, -1.88, 0.98, 0.7, 0.04, '#364e61').rotation.x = -0.35;
      box(g, 2.4, 0.95, -1.3, 0.42, 0.05, 0.42, '#e8eef0'); cyl(g, 2.4, 1.0, -1.3, 0.14, 0.06, '#d2553f');
      tag(g, '노출 스위치', 2.4, 1.35, -0.85, 0.9, 0.26);
      // 복도의 가람 님
      const gr = person({ coat: '#e7b4a4', hair: 1, seed: 5 }); gr.root.position.set(2.55, 0, 1.45); gr.root.rotation.y = -0.6; g.add(gr.root); tag2(g, ['가람 님 · 복도'], 2.2, 2.55, 1.3, 1.3, 0.28);
      // 옮길 것: 나, 미닫이 문
      const me = person({ coat: '#a9c6d9', outfit: 'scrub', hair: 2, seed: 2 }); g.add(me.root); quiet(tag2(me.root, ['나'], 0, 2.5, 0, 0.5, 0.36, '#2f8f6c'));
      const door = new T.Group(); box(door, 0, 0.45, 0, 1.1, 0.9, 0.07, '#c9ac85'); box(door, 0.42, 0.5, 0.05, 0.06, 0.2, 0.04, '#8f9aa6'); mtag(door, '문', 0, 1.15, 0.1, 0.45, 0.26); g.add(door);
      const done = tag2(g, ['찰칵 ✓ 사진이 떴어요'], 1.65, 2.05, -1.2, 1.9, 0.3, '#2f8f6c'); done.visible = false;
      const tool = new T.Group(); ball(tool, 0, 0.06, 0, 0.07, SKIN, [1.2, 0.7, 1.5]); g.add(tool);
      let on = 0;
      return {
        rubY: 1.04, tool, frame: { top: 2.5, tilt: [0.8, 1.1] },
        patches: [{ id: 'shoot', y: 1.04, color: '#ffffff', opacity: 0.85, dot: 0.035, reach: 0.18, blobs: [{ x: 2.4, z: -1.3, r: 0.12, n: 6 }] }],
        movers: [
          { id: 'me', obj: me.root, from: [-0.55, -0.35], to: [1.0, -1.0], r: 0.55, y: 0, lift: 0.15 },
          { id: 'door', obj: door, from: [-1.9, 0.62], to: [-0.6, 0.48], r: 0.4, y: 0.02, lift: 0.05, onPlaced: untag },
        ],
        onRub(id, v) { if (v >= 1) { on = 1.2; done.visible = true; scr.userData.redraw((k, W, H) => xray(k, W, H, 'wrist')); } },
        tick(dt, t) {
          pt.update(t, false); gr.update(t, false); me.update(t, false);
          if (on > 0) { on -= dt; lamp.material.color.set(on > 0 ? '#ff5a4a' : '#7a3a32'); }
        },
      };
    },
  },

  // ── 방사선사 ③ 판독실: 사진 셋. 그 사진 아래 '보내기'나 '다시 찍기' 칸에. 칸 여섯 모두에 같은 초록 원 ──
  imagecheck: {
    build(g) {
      floor(g, 5.8, 4.2, '#dfe5ea');
      label(g, '판독실', 1.9, 2.1, -2.02, 1.0, 0.34);
      box(g, 0, 0.4, 0.1, 5.6, 0.8, 3.6, '#93a4b2'); box(g, 0, 0.815, 0.1, 5.7, 0.03, 3.7, '#aebdc8');
      const COL = [['wrist', -1.85, '로운 님 · 손목'], ['chest', 0, '외래 · 가슴'], ['ankle', 1.85, '응급실 · 발목']];
      const movers = [], slots = [];
      for (const [id, x, name] of COL) {
        const card = new T.Group(); box(card, 0, 0.02, 0, 1.2, 0.04, 0.5, '#2b3a46');
        const pic = canvasPlane(1.2, 0.95, (k, W, H) => xray(k, W, H, id)); pic.position.set(0, 0.55, -0.05); pic.rotation.x = -0.55; card.add(pic);
        box(card, 0, 0.55, -0.09, 1.28, 1.03, 0.03, '#2b3a46').rotation.x = -0.55;
        mtag2(card, [name], 0, 1.18, -0.3, 1.25, 0.28); g.add(card);
        const sendId = `${id[0]}_send`, retakeId = `${id[0]}_retake`;
        for (const [sid, dx, t, c] of [[sendId, -0.42, '보내기', '#b9d6c9'], [retakeId, 0.42, '다시 찍기', '#f2c3bb']]) {
          box(g, x + dx, 0.84, 1.15, 0.74, 0.04, 0.7, c); tag2(g, [t], x + dx, 1.0, 1.65, 0.78, 0.28);
          slots.push({ id: sid, at: [x + dx, 1.15], y: 0.88, r: 0.34 });
        }
        movers.push({ id, obj: card, slot: id === 'wrist' ? sendId : retakeId, from: [x, -0.65], y: 0.84, dragY: 0.88, restY: 0.88, lift: 0.12, onPlaced(o) { untag(o); o.scale.setScalar(0.55); } });
      }
      return { frame: { top: 2.0, tilt: [0.8, 1.1] }, slots, movers };
    },
  },
};

// 분석기 화면: 결과가 오기 전과 뒤
function drawScreen(k, W, H, ready) {
  k.fillStyle = '#1f3442'; k.fillRect(0, 0, W, H); k.textBaseline = 'middle';
  k.fillStyle = '#c9d6dc'; k.font = `bold ${Math.round(H * 0.11)}px "Gowun Dodum", sans-serif`; k.textAlign = 'left'; k.fillText('김새봄 · 1958.03.14', W * 0.05, H * 0.12);
  if (!ready) { k.fillStyle = '#8fa3ad'; k.textAlign = 'center'; k.fillText('검체를 기다려요…', W / 2, H * 0.55); return; }
  [['나트륨', '139', '#7fe0b0', ''], ['칼륨', '6.8 ▲', '#ff6b5a', '위급값'], ['포도당', '102', '#7fe0b0', '']].forEach(([a, b, c, note], i) => {
    const y = H * (0.36 + i * 0.22);
    if (note) { k.fillStyle = 'rgba(255,107,90,0.18)'; k.fillRect(W * 0.02, y - H * 0.1, W * 0.96, H * 0.2); }
    k.fillStyle = '#c9d6dc'; k.font = `bold ${Math.round(H * 0.12)}px "Gowun Dodum", sans-serif`; k.textAlign = 'left'; k.fillText(a, W * 0.05, y);
    k.fillStyle = c; k.font = `bold ${Math.round(H * 0.15)}px "Jua", sans-serif`; k.textAlign = 'right'; k.fillText(b, W * 0.7, y);
    if (note) { k.font = `bold ${Math.round(H * 0.1)}px "Gowun Dodum", sans-serif`; k.fillText(note, W * 0.96, y); }
  });
}
