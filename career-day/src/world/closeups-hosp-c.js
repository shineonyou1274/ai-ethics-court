// 약사(오후 상담)와 원무행정 직원(바뀐 진료실 안내)의 가까이 보기 무대 (카페 방식). closeups.js 의 목록에 더해진다.
// 무대 짓는 법은 closeups.js 맨 위와 같다: build(g) 가 { movers, slots, taps, frame, onTap, tick } 을 돌려준다.
// taps(누를 곳)는 closeup.js 가 손가락 아래의 물체(obj)를 보고 알린다. 좌표는 무대 가운데가 (0, 0), 화면 아래쪽이 +z.
// 모두 단순하게 줄인 체험이다. 약 이름·복용법은 가상이고, 약을 정답처럼 가르치지 않는다.
import * as T from 'three';
import { box, cyl, ball, label, person, reduced } from './kit.js';
import { floor, tag, tag2 } from './closeups.js';

const quiet = (m) => { m.raycast = () => {}; m.userData.tag = true; return m; };
const untag = (o) => o.traverse((c) => { if (c.userData.tag) c.visible = false; });
// 손가락이 닿는 보이지 않는 판 (누를 곳의 과녁)
const pad = (w, h) => new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
// 그림판 하나 (봉투 라벨, 수첩 쪽). draw(k, W, H)
function canvasPlane(w, h, draw, px = 640) {
  const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w); const k = c.getContext('2d');
  draw(k, c.width, c.height);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, transparent: true }));
}
// 따로 색을 바꿀 수 있는 판 (공용 재질을 건드리지 않게 새 재질을 쓴다)
function glow(g, w, h, color, opacity) {
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })); m.renderOrder = 2; g.add(m); return m;
}
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

// 약 봉투 라벨의 세 줄 (위에서 아래로). 손가락으로 짚는 줄이다. 약 이름과 복용법은 가상이다
const LINES = [['name', '오가온 님 · 모아정'], ['dose', '하루 2번 · 아침 저녁'], ['days', '5일분 · 서늘한 곳']];
const ROW_Z = [-0.2, 0.17, 0.54]; // 봉투 안에서 줄의 자리 (봉투 가운데 기준, 앞쪽이 +)
const BAG = { x: 0.35, y: 1.08, z: 0.6, tilt: 0.28 }; // 봉투는 뒤쪽을 살짝 받쳐 라벨이 카메라를 향한다

export const HOSP_C = {
  // ── 약사 · 오후 상담: 가온 님 앞에서 질문 수첩을 펼치고 → 약 봉투 라벨에서 답이 적힌 줄을 짚고 → 확인이 필요한 질문은 봉투에 담아 의료진 문의함으로 ──
  rxhandoff: {
    build(g) {
      floor(g, 5.8, 4.2, '#efe6da');
      label(g, '복약 상담실', -2.05, 2.1, -2.02, 1.3, 0.36);
      // 가온 님: 상담 탁자 건너편 의자에 앉아 있다
      box(g, -0.7, 0.5, -2.0, 0.95, 1.0, 0.14, '#a3896b'); box(g, -0.7, 0.42, -1.75, 0.95, 0.1, 0.6, '#b89c7c');
      const gaon = person({ coat: '#c9b6d6', hair: 1, seed: 3 }); gaon.root.position.set(-0.7, -0.2, -1.6); g.add(gaon.root);
      // 상담 탁자
      box(g, 0, 0.4, 0.05, 5.4, 0.8, 2.9, '#cdb193'); box(g, 0, 0.815, 0.05, 5.5, 0.03, 3.0, '#f6eee2');
      // 가온 님의 말 (단계마다 바뀐다): 수첩을 펼치면 적어 온 질문을 하나씩 읽는다
      const say = ['“궁금한 걸 수첩에 적어 왔어요.”', '“① 이 약, 하루에 몇 번 먹어요?”', '“② 다른 병원 약이랑 같이 먹어도 돼요?”', '“그럼 확인되면 알려 주세요.”']
        .map((text) => tag2(g, ['가온 님', text], 0.85, 2.45, -1.3, 3.0, 0.6)); // 가온 님 얼굴을 가리지 않게 오른쪽 위에
      const speak = (i) => say.forEach((m, k) => { m.visible = k === i; }); speak(0);

      // ① 질문 수첩: 눌러서 펼친다. 표지가 뒤쪽 경첩을 따라 일어선다 (안쪽에 질문이 적혀 있다)
      const NB = [-1.6, 0.6], nb = new T.Group(); nb.position.set(NB[0], 0.83, NB[1]); g.add(nb);
      box(nb, 0, 0.03, 0, 1.2, 0.06, 1.0, '#f4efe2'); // 속지 묶음
      const lines = (k, W, H, rows) => { k.fillStyle = '#fffdf6'; k.fillRect(0, 0, W, H); k.strokeStyle = '#d7e3ea'; k.lineWidth = 4; for (let y = H * 0.25; y < H; y += H * 0.25) { k.beginPath(); k.moveTo(W * 0.05, y); k.lineTo(W * 0.95, y); k.stroke(); } k.fillStyle = '#344d63'; k.font = `bold ${Math.round(H * 0.17)}px "Gowun Dodum", sans-serif`; k.textBaseline = 'bottom'; rows.forEach((r, i) => k.fillText(r, W * 0.07, H * (0.24 + i * 0.25), W * 0.88)); };
      const page = canvasPlane(1.14, 0.94, (k, W, H) => lines(k, W, H, ['다음에 물어볼 것', '· 식사를 걸렀을 때?']));
      page.rotation.x = -Math.PI / 2; page.position.set(0, 0.062, 0); nb.add(page);
      const hinge = new T.Group(); hinge.position.set(0, 0.07, -0.5); nb.add(hinge);
      const cover = new T.Group(); cover.position.set(0, 0, 0.5); hinge.add(cover);
      box(cover, 0, 0.014, 0, 1.2, 0.028, 1.0, '#5f8292'); box(cover, 0, 0.03, -0.44, 1.2, 0.006, 0.08, '#4b6b79');
      const face = canvasPlane(0.95, 0.6, (k, W, H) => { k.fillStyle = '#fff8e6'; k.beginPath(); k.roundRect(0, 0, W, H, 30); k.fill(); k.fillStyle = '#344d63'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.font = `bold ${Math.round(H * 0.3)}px "Gowun Dodum", sans-serif`; k.fillText('가온 님', W / 2, H * 0.32); k.fillText('질문 수첩', W / 2, H * 0.72); });
      face.rotation.x = -Math.PI / 2; face.position.set(0, 0.03, 0.05); cover.add(face);
      // 표지 안쪽: 펼치면 일어서서 카메라 쪽을 본다
      const inside = canvasPlane(1.14, 0.94, (k, W, H) => lines(k, W, H, ['① 하루에 몇 번?', '② 다른 병원 약이랑?']));
      inside.rotation.x = Math.PI / 2; inside.position.set(0, -0.002, 0); cover.add(inside);
      const nbHit = pad(1.35, 1.2); nbHit.rotation.x = -Math.PI / 2; nbHit.position.set(0, 0.12, 0); nb.add(nbHit);
      const nbTag = quiet(tag(g, '눌러서 펼치기', NB[0], 1.45, NB[1] + 0.15, 1.1, 0.32));

      // ② 약 봉투: 뒤쪽을 받쳐 라벨이 잘 보인다. 라벨의 세 줄을 손가락으로 짚는다 (세 줄이 모두 똑같이 반짝인다)
      const bag = new T.Group(); bag.position.set(BAG.x, BAG.y, BAG.z); bag.rotation.x = BAG.tilt; g.add(bag);
      box(g, BAG.x, 0.95, BAG.z - 0.6, 2.2, 0.24, 0.2, '#d9c7a4'); // 받침
      box(bag, 0, 0, 0, 2.4, 0.08, 1.55, '#f3e4c2'); box(bag, 0, 0.01, -0.74, 2.4, 0.09, 0.07, '#e2cfa5');
      const flat = (m, z) => { m.rotation.x = -Math.PI / 2; m.position.set(0, 0.045, z); bag.add(m); return m; };
      flat(canvasPlane(2.3, 0.3, (k, W, H) => { k.fillStyle = '#7aa89a'; k.beginPath(); k.roundRect(0, 0, W, H, 18); k.fill(); k.fillStyle = '#fff'; k.font = `bold ${Math.round(H * 0.6)}px "Jua", sans-serif`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('약 봉투 (가상)', W / 2, H * 0.55); }), -0.56);
      const rows = {};
      LINES.forEach(([id, text], i) => {
        flat(canvasPlane(2.3, 0.33, (k, W, H) => { k.fillStyle = '#fffdf6'; k.beginPath(); k.roundRect(0, 0, W, H, 14); k.fill(); k.fillStyle = '#263c52'; k.font = `bold ${Math.round(H * 0.62)}px "Gowun Dodum", sans-serif`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, W / 2, H * 0.54, W * 0.94); }), ROW_Z[i]);
        const hl = glow(bag, 2.36, 0.35, '#f2c94c', 0); hl.rotation.x = -Math.PI / 2; hl.position.set(0, 0.05, ROW_Z[i]); // 짚은 줄 (형광펜)
        const hit = pad(2.4, 0.37); hit.rotation.x = -Math.PI / 2; hit.position.set(0, 0.07, ROW_Z[i]); bag.add(hit);
        rows[id] = { hl, hit };
      });
      const finger = new T.Group(); ball(finger, 0, 0, 0, 0.08, '#e6bfa1', [1, 0.7, 1.7]); finger.visible = false; bag.add(finger);
      const bagTag = quiet(tag(g, '답이 적힌 줄 짚기', BAG.x, 1.75, BAG.z - 0.95, 1.4, 0.3)); bagTag.visible = false;

      // ③ 문의 봉투와 놓을 곳 둘 (가온 님 앞 · 의료진 문의함). 끄는 동안 두 곳 모두에 같은 초록 원이 뜬다
      const env = new T.Group(); box(env, 0, 0.03, 0, 0.8, 0.06, 0.55, '#e7cf98'); box(env, 0, 0.065, -0.13, 0.8, 0.01, 0.22, '#d8bb7e');
      quiet(tag2(env, ['문의 봉투', '질문 ②'], 0, 0.62, 0.05, 0.95, 0.42)); g.add(env);
      box(g, -0.5, 0.835, -0.75, 1.25, 0.02, 0.7, '#e5d6c3'); tag(g, '가온 님 앞', -0.3, 1.02, -0.62, 0.9, 0.27);
      box(g, 1.85, 0.87, -0.75, 1.2, 0.1, 0.75, '#9db8b0'); for (const sd of [-1, 1]) box(g, 1.85 + sd * 0.6, 0.95, -0.75, 0.05, 0.18, 0.75, '#87a59c'); box(g, 1.85, 0.95, -1.1, 1.2, 0.18, 0.05, '#87a59c');
      tag(g, '의료진 문의함', 1.85, 1.35, -0.42, 1.25, 0.3);
      const sent = tag2(g, ['의료진에게 넘겼어요 ✓'], 1.85, 1.8, -0.75, 1.7, 0.3, '#2f8f6c'); sent.visible = false;

      let opening = false, t0 = 0;
      const taps = [{ id: 'notebook', obj: nb }, ...LINES.map(([id]) => ({ id, obj: rows[id].hit }))];
      return {
        frame: { w: 4.85, d: 3.5, top: 2.55, tilt: [0.72, 1.0] }, taps,
        slots: [{ id: 'gaon', at: [-0.5, -0.75], y: 0.86, r: 0.42 }, { id: 'inbox', at: [1.85, -0.75], y: 0.95, r: 0.42 }],
        movers: [{ id: 'envelope', obj: env, slot: 'inbox', from: [2.0, 1.2], y: 0.84, restY: 0.93, lift: 0.12, onPlaced(o) { untag(o); o.scale.setScalar(0.85); sent.visible = true; speak(3); } }],
        onTap(id, ok) {
          if (!ok) return;
          if (id === 'notebook') { opening = true; t0 = 0; taps[0].off = true; nbTag.visible = false; bagTag.visible = true; speak(1); return; }
          for (const [r] of LINES) rows[r].hl.material.opacity = 0;
          rows[id].hl.material.opacity = 0.6; finger.visible = true; finger.position.set(1.0, 0.13, ROW_Z[LINES.findIndex((l) => l[0] === id)]);
          taps.forEach((tp) => { tp.off = true; }); bagTag.visible = false; speak(2);
        },
        tick(dt, t) {
          gaon.update(t, false);
          if (opening) { t0 += dt; const k = reduced ? 1 : Math.min(1, t0 / 0.6); hinge.rotation.x = -1.75 * ease(k); if (k >= 1) opening = false; }
          else if (!taps[0].off && !reduced) nb.position.y = 0.83 + Math.max(0, Math.sin(t * 3)) * 0.05; // 누를 수첩은 살짝 들썩인다
          // 수첩을 펼친 뒤, 짚을 줄 셋이 모두 똑같이 반짝인다 (어느 줄이 답인지 드러내지 않는다)
          if (taps[0].off && !taps[1].off) for (const [id] of LINES) rows[id].hl.material.opacity = reduced ? 0.14 : 0.06 + Math.max(0, Math.sin(t * 3)) * 0.14;
          if (finger.visible && !reduced) finger.position.y = 0.13 + Math.abs(Math.sin(t * 4)) * 0.06;
        },
      };
    },
  },

  // ── 원무행정 직원 · 바뀐 진료실 안내: 작은 복도 모형. 2층(앞)과 3층(뒤), 왼쪽 끝의 승강기.
  //    ‘↑ 3층’ 표지는 2층 승강기 앞에, ‘도착’ 표지는 3층 새 진료실 문 앞에. 놓을 곳 넷 모두에 같은 초록 원 ──
  adminroute: {
    build(g) {
      floor(g, 5.8, 4.2, '#ece6dc');
      label(g, '안내 모형 · 2번 진료실 가는 길', 0.6, 2.15, -2.02, 2.8, 0.38);
      const F = { 3: -1.0, 2: 0.45 }; // 층마다 복도의 가운데 z
      for (const [fl, z] of Object.entries(F)) {
        const top = fl === '3';
        box(g, 0.35, 0.06, z, 4.7, 0.12, 1.2, top ? '#dbe6ec' : '#efe2cc'); // 복도 바닥
        box(g, 0.35, top ? 0.32 : 0.22, z - 0.62, 4.7, top ? 0.52 : 0.32, 0.06, top ? '#c7d6de' : '#e2cfb0'); // 복도 뒤 벽 (앞층은 낮게)
        // 층 이름: 복도 왼쪽 끝. 2층은 승강기 바로 앞, 3층은 2층 벽에 가리지 않게 3층 뒤 벽 위에 (놓을 곳의 원을 가리지 않게)
        tag2(g, [`${fl}층`], top ? -1.3 : -1.85, top ? 0.85 : 0.3, top ? z - 0.55 : z + 0.5, 0.55, 0.32, top ? '#4b7a92' : '#9a6b3c');
        box(g, -1.85, 0.4, z - 0.2, 0.62, 0.8, 0.5, '#8b9ba7'); box(g, -1.85, 0.4, z + 0.055, 0.5, 0.7, 0.02, '#b9c6cf'); box(g, -1.85, 0.4, z + 0.07, 0.012, 0.7, 0.01, '#6f7f8a'); // 승강기
      }
      box(g, -1.85, 0.4, (F[3] + F[2]) / 2 - 0.2, 0.42, 0.5, 0.95, '#7c8b96'); // 두 층을 잇는 승강기 통로
      tag(g, '승강기', -1.85, 1.05, F[3] + 0.1, 0.72, 0.27); tag(g, '승강기', -1.85, 1.05, F[2] + 0.1, 0.72, 0.27);
      // 2층: 옛 2번 진료실 (오늘부터 비어 있음) · 3층: 새 2번 진료실
      box(g, 0.25, 0.3, F[2] - 0.57, 0.66, 0.46, 0.04, '#a89a8a'); box(g, 0.25, 0.3, F[2] - 0.545, 0.06, 0.34, 0.02, '#8c7e70');
      tag2(g, ['옛 2번 진료실', '오늘부터 비어 있어요'], 0.15, 0.78, F[2] - 0.38, 1.45, 0.42);
      box(g, 2.05, 0.3, F[3] - 0.57, 0.66, 0.46, 0.04, '#7fae9a'); box(g, 2.05, 0.3, F[3] - 0.545, 0.06, 0.34, 0.02, '#5f8d7a');
      tag2(g, ['새 2번 진료실', '3층 복도 끝'], 1.95, 1.1, F[3] - 0.4, 1.35, 0.46);
      // 이든 님: 옛 진료실 앞에서 기다린다
      const eden = person({ coat: '#e0b48a', hair: 2, seed: 4 }); eden.root.scale.setScalar(0.45); eden.root.position.set(1.3, 0.12, F[2] + 0.25); g.add(eden.root);
      const say = [
        // 말풍선은 이든 님 오른쪽, 2층 복도 위에 낮게 둔다 (3층 문 앞의 놓을 곳을 가리지 않게)
        tag2(g, ['이든 님', '“여기가 2번 진료실 아닌가요?”'], 2.0, 1.0, F[2] + 0.4, 1.3, 0.56),
        tag2(g, ['이든 님', '“3층으로 가면 되는군요.”'], 2.0, 1.0, F[2] + 0.4, 1.3, 0.56),
        tag2(g, ['이든 님', '“찾았어요! 여기네요.”'], 1.25, 1.55, F[3] + 0.05, 1.9, 0.48, '#2f8f6c'),
      ];
      const speak = (i) => say.forEach((m, k) => { m.visible = k === i; }); speak(0);
      // 세울 표지 둘: 받침 + 기둥 + 판 (판은 카메라 쪽으로 눕혀 글이 읽힌다)
      const sign = (text, color) => {
        const o = new T.Group(); cyl(o, 0, 0.03, 0, 0.18, 0.06, '#6d7b84'); cyl(o, 0, 0.32, 0, 0.03, 0.58, '#6d7b84');
        const board = canvasPlane(0.86, 0.44, (k, W, H) => { k.fillStyle = color; k.beginPath(); k.roundRect(0, 0, W, H, 28); k.fill(); k.strokeStyle = '#263c52'; k.lineWidth = 6; k.stroke(); k.fillStyle = '#263c52'; k.font = `bold ${Math.round(H * 0.52)}px "Jua", sans-serif`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, W / 2, H * 0.55, W * 0.9); });
        board.position.set(0, 0.72, 0.02); board.rotation.x = -0.5; o.add(board);
        g.add(o); return o;
      };
      const up = sign('↑ 3층으로', '#f2c94c'), arrive = sign('도착 · 2번', '#a8dcc4');
      box(g, -0.65, 0.04, 1.6, 2.6, 0.06, 0.7, '#d9ccb8'); tag(g, '세울 표지', 1.15, 0.45, 1.6, 0.8, 0.26);
      const S = { s2e: [-1.0, F[2] + 0.1], s2d: [0.4, F[2] + 0.1], s3e: [-1.0, F[3] + 0.1], s3d: [2.05, F[3] + 0.1] };
      // 이든 님이 걷는 길: 옛 진료실 앞 → 2층 승강기 → (승강기) → 3층 승강기 → 새 진료실 앞
      const PATH = [[1.3, F[2] + 0.25], [-1.0, F[2] + 0.3], [-1.85, F[2] + 0.1], null, [-1.85, F[3] + 0.1], [-1.0, F[3] + 0.3], [1.6, F[3] + 0.3]];
      let walking = -1, seg = 0, k = 0;
      return {
        frame: { cx: 0.15, w: 5.0, d: 3.8, top: 1.8, tilt: [0.72, 1.0] },
        slots: Object.entries(S).map(([id, at]) => ({ id, at, y: 0.14, r: 0.42 })),
        movers: [
          { id: 'up', obj: up, slot: 's2e', from: [-1.3, 1.6], y: 0.08, dragY: 0.14, restY: 0.12, lift: 0.15, onPlaced() { speak(1); } },
          { id: 'arrive', obj: arrive, slot: 's3d', from: [0.0, 1.6], y: 0.08, dragY: 0.14, restY: 0.12, lift: 0.15, onPlaced() { speak(-1); walking = 0; if (reduced) { seg = PATH.length - 2; k = 1; } } },
        ],
        tick(dt, t) {
          if (walking < 0) { eden.update(t, false); return; }
          // 길을 따라 걷는다. 승강기(null) 구간은 잠깐 사라졌다가 위층에서 나온다
          if (seg < PATH.length - 1) {
            const a = PATH[seg], b = PATH[seg + 1];
            if (!a || !b) { eden.root.visible = false; k += dt / 0.45; if (k >= 1) { seg++; k = 0; eden.root.visible = true; } }
            else { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); k = Math.min(1, k + dt * 2.0 / Math.max(0.2, len)); eden.root.position.set(a[0] + (b[0] - a[0]) * k, 0.12, a[1] + (b[1] - a[1]) * k); eden.root.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]); if (k >= 1) { seg++; k = 0; } }
            eden.update(t, true);
          } else { const e = PATH[PATH.length - 1]; eden.root.visible = true; eden.root.position.set(e[0], 0.12, e[1]); eden.root.rotation.y = 0; eden.update(t, false); if (walking === 0) { walking = 1; speak(2); } }
        },
      };
    },
  },
};
