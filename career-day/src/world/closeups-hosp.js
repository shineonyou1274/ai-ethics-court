// 의사와 환경미화 직원의 가까이 보기 무대 (카페 방식). closeups.js 의 목록에 더해진다.
// 무대 짓는 법은 closeups.js 맨 위와 같다: build(g) 가 { patches, movers, slots, tool, rubY, frame, onRub, tick } 을 돌려준다.
// 좌표는 무대 가운데가 (0, 0) 이고, 화면 아래쪽이 +z 예요. 문질러 지우는 얼룩은 한 무대 안에서 모두 같은 높이(rubY)에 둔다.
// 모두 단순하게 줄인 체험이라, 실제 절차를 정답처럼 보여 주지 않는다 (손 장면의 '알아 두기'가 그렇게 밝힌다).
import * as T from 'three';
import { box, cyl, ball, label, person, mat, reduced } from './kit.js';
import { floor, tag, tag2, clip, cloth } from './closeups.js';

const SKIN = '#e6bfa1', PALM = '#f0cdb2', BACK = '#e2b596';

// 크게 그린 한 손. up 이면 손바닥이 위(엄지가 +x 쪽), 아니면 손등이 위(엄지가 -x 쪽, 손톱과 마디가 보인다). 손끝이 -z 쪽
function bigHand(g, x, y, z, up, s = 1.8, sleeve = '#f7f8f3') {
  const h = new T.Group(); h.position.set(x, y, z); h.scale.set(s, 1, s); g.add(h); // 두께는 그대로 (문지를 얼룩이 손 위에 보이게)
  const c = up ? PALM : BACK;
  box(h, 0, 0.03, 0.03, 0.36, 0.06, 0.4, c);
  for (let i = 0; i < 4; i++) { const f = cyl(h, -0.12 + i * 0.08, 0.03, -0.27 - (i === 1 || i === 2 ? 0.02 : 0), 0.032, 0.24, c); f.rotation.x = Math.PI / 2; if (!up) { box(h, -0.12 + i * 0.08, 0.06, -0.36, 0.045, 0.012, 0.05, '#f6dcd0'); ball(h, -0.12 + i * 0.08, 0.055, -0.15, 0.03, '#d9a88a', [1, 0.6, 1]); } }
  const sd = up ? 1 : -1;
  const th = cyl(h, sd * 0.22, 0.03, 0.0, 0.034, 0.2, c); th.rotation.x = Math.PI / 2; th.rotation.y = sd * 0.7;
  box(h, 0, 0.03, 0.31, 0.3, 0.07, 0.16, sleeve);
  return h;
}
// 옮기는 물건에 붙인 이름표: 누르는 자리를 가리지 않게 손가락이 닿지 않는 것으로 한다 (물건 자체만 잡힌다)
function mtag(o, text, x, y, z, w, h) { const m = tag(o, text, x, y, z, w, h); m.raycast = () => {}; return m; }
// 작은 동그라미 숫자표 (손 씻기 단계)
function num(g, n, x, y, z) { return tag2(g, [String(n)], x, y, z, 0.32, 0.32, '#2f8f6c'); }

// 병실 침대 (머리가 -z 쪽). 누운 사람의 머리와 이불
function bedZ(g, x, z, hair, skin = SKIN) {
  box(g, x, 0.42, z, 1.15, 0.16, 2.0, '#d9dedb'); box(g, x, 0.62, z, 1.1, 0.26, 1.95, '#e6eae8');
  box(g, x, 0.85, z - 0.98, 1.2, 0.7, 0.08, '#c9d6d8');
  for (const a of [-0.48, 0.48]) for (const b of [-0.85, 0.85]) { box(g, x + a, 0.18, z + b, 0.07, 0.36, 0.07, '#a5afb1'); ball(g, x + a, 0.06, z + b, 0.08, '#697d85'); }
  box(g, x, 0.8, z - 0.68, 0.7, 0.12, 0.42, '#ffffff');
  const head = new T.Group(); head.position.set(x, 1.0, z - 0.62); g.add(head);
  ball(head, 0, 0, 0, 0.21, skin, [1, 0.9, 1]); ball(head, 0, 0.06, -0.06, 0.215, hair, [1, 0.75, 0.85]);
  for (const s of [-1, 1]) ball(head, s * 0.08, 0.05, 0.17, 0.022, '#35434d');
  box(g, x, 0.82, z + 0.25, 1.08, 0.12, 1.35, '#a9c9db');
  const arm = cyl(g, x + 0.38, 0.9, z + 0.05, 0.06, 0.55, skin); arm.rotation.x = Math.PI / 2;
  cyl(g, x + 0.38, 0.9, z + 0.25, 0.07, 0.08, '#f6efe0').rotation.x = Math.PI / 2; // 팔찌
  return head;
}

export const HOSP_A = {
  // ── 의사 ① 병실 앞 세면대: 손 위생 여섯 단계를 차례로 문지르고, 종이 타월로 수도꼭지를 잠근다 ──
  handwash: {
    build(g) {
      floor(g, 5.8, 4.2, '#e9eef0');
      label(g, '501호 앞 세면대', 0.8, 1.5, -2.02, 1.5, 0.36);
      box(g, 0, 0.45, -0.25, 4.6, 0.9, 2.9, '#d7e2e4'); box(g, 0, 0.915, -0.25, 4.7, 0.03, 3.0, '#eef3f3'); // 세면대
      box(g, 0, 0.93, -1.35, 1.5, 0.01, 0.55, '#c3d3d7'); // 개수대
      cyl(g, 0, 1.15, -1.62, 0.05, 0.45, '#a5afb1'); const sp = box(g, 0, 1.36, -1.45, 0.08, 0.06, 0.36, '#a5afb1'); sp.rotation.x = 0.1; // 수도꼭지
      box(g, 0.38, 1.12, -1.6, 0.34, 0.05, 0.08, '#8f9a9c'); // 수도꼭지 손잡이
      // 종이 타월 상자
      box(g, 1.85, 1.0, 1.0, 0.5, 0.2, 0.55, '#ffffff'); box(g, 1.85, 1.11, 1.0, 0.2, 0.02, 0.3, '#e0e6e8');
      bigHand(g, -0.85, 0.9, 0.05, true, 2.0); bigHand(g, 0.85, 0.9, 0.05, false, 2.0);
      tag(g, '왼손 · 손바닥', -0.85, 1.25, 1.2, 1.2, 0.32); tag(g, '오른손 · 손등', 0.85, 1.25, 1.2, 1.2, 0.32);
      // 단계 번호표: 손 바깥쪽에 (엄지는 엄지 오른쪽에)
      const N = [[1, -1.55, 0.12], [2, 1.55, 0.18], [3, -1.55, -0.45], [4, 1.55, -0.27], [5, -0.15, 0.25], [6, 1.55, -0.7]];
      const nums = N.map(([n, x, z]) => num(g, n, x, 1.15, z));
      const towel = new T.Group(); box(towel, 0, 0.03, 0, 0.42, 0.04, 0.32, '#fbfbf6'); box(towel, 0.05, 0.06, 0.02, 0.3, 0.02, 0.24, '#f0f0e8'); g.add(towel);
      mtag(towel, '종이 타월', 0, 0.42, 0.15, 0.8, 0.28);
      const foam = new T.Group(); for (const [x, z, r] of [[0, 0, 0.11], [0.09, 0.05, 0.08], [-0.08, 0.06, 0.07]]) ball(foam, x, 0.03, z, r, '#f6fbfc', [1, 0.45, 1]); g.add(foam);
      const STEPS = ['palm', 'back', 'between', 'knuckle', 'thumb', 'tips'];
      const ok = tag2(g, ['손 위생 여섯 단계 ✓'], 0, 1.7, -0.9, 2.0, 0.36, '#2f8f6c'); ok.visible = false;
      const DOT = { y: 0.965, color: '#5f9e3c', opacity: 0.85, dot: 0.085, reach: 0.13 };
      return {
        rubY: 0.965, tool: foam, frame: { w: 4.4, d: 3.4 },
        patches: [
          { id: 'palm', ...DOT, blobs: [{ x: -0.85, z: 0.12, r: 0.2, n: 10 }] },
          { id: 'back', ...DOT, blobs: [{ x: 0.85, z: 0.18, r: 0.2, n: 10 }] },
          { id: 'between', ...DOT, blobs: [{ x: -0.85, z: -0.45, r: 0.22, n: 8, squash: 0.7 }] },
          { id: 'knuckle', ...DOT, blobs: [{ x: 0.85, z: -0.27, r: 0.28, n: 7, squash: 0.3 }] },
          { id: 'thumb', ...DOT, blobs: [{ x: -0.4, z: 0.02, r: 0.09, n: 4 }] },
          { id: 'tips', ...DOT, blobs: [{ x: 0.85, z: -0.7, r: 0.28, n: 7, squash: 0.3 }] },
        ],
        movers: [{ id: 'towel', obj: towel, from: [1.85, 1.0], to: [0.38, -1.5], r: 0.4, y: 1.13, dragY: 1.12, restY: 1.15, lift: 0.15, onPlaced() { ok.visible = true; } }],
        onRub(id, v) { if (v >= 1) nums[STEPS.indexOf(id)].visible = false; },
      };
    },
  },

  // ── 의사 ② 501호: 세 침대의 팔찌 가운데 차트와 이름·생년월일이 모두 같은 분을 찾는다. 세 침대 모두에 같은 초록 원이 뜬다 ──
  wristband: {
    build(g) {
      floor(g, 5.8, 4.2, '#eadfca');
      label(g, '501호 병실', 1.1, 2.05, -2.02, 1.3, 0.36);
      const BEDS = [
        { x: -1.9, hair: '#6b4f3a', name: '윤하람', birth: '1968.04.12' },
        { x: 0, hair: '#2f2a28', name: '윤하늘', birth: '1975.09.03' },
        { x: 1.9, hair: '#8c8c8c', name: '윤하늘', birth: '1968.04.12' },
      ];
      const heads = BEDS.map((b, i) => { tag2(g, [`${i + 1}번 침대 · 팔찌`, `${b.name} ${b.birth}`], b.x, 1.55, -0.55, 1.75, 0.6); return bedZ(g, b.x, -1.0, b.hair); });
      const ok = tag2(g, ['이름 ✓  생년월일 ✓'], 1.9, 2.15, -1.1, 1.7, 0.34, '#2f8f6c'); ok.visible = false;
      const say = tag2(g, ['“아, 회진 시간이군요.”'], 0.4, 2.05, -1.6, 1.9, 0.34); say.visible = false;
      // 차트 수레
      box(g, 0, 0.36, 1.55, 2.2, 0.72, 0.7, '#e3d6c3'); box(g, 0, 0.735, 1.55, 2.25, 0.03, 0.76, '#f3ece1');
      const chart = clip(['윤하늘', '1968.04.12']); g.add(chart);
      tag(g, '하늘 님 차트', -0.95, 0.95, 1.6, 0.95, 0.28);
      let found = false;
      return {
        frame: { top: 2.0 },
        slots: BEDS.map((b, i) => ({ id: `bed${i + 1}`, at: [b.x, -0.15], y: 0.9, r: 0.5 })),
        movers: [{ id: 'chart', obj: chart, slot: 'bed3', from: [0.35, 1.55], y: 0.76, dragY: 0.9, restY: 0.92, lift: 0.2, onPlaced() { found = true; ok.visible = true; say.visible = true; } }],
        tick(dt, t) { if (found && !reduced) heads[2].rotation.x = Math.sin(t * 2.2) * 0.08; },
      };
    },
  },

  // ── 의사 ③ 수술 준비실: 모자·마스크 → 손 세척 → 멸균 가운 → 멸균 장갑 (내 캐릭터에게 끌어다 입힌다) ──
  gowning: {
    build(g) {
      floor(g, 5.8, 4.2, '#e6eef0');
      label(g, '수술 준비실', 1.1, 2.0, -2.02, 1.3, 0.36);
      const me = person({ coat: '#a6c5d1', outfit: 'scrub', seed: 2 }); me.root.position.set(0.1, 0, -0.75); g.add(me.root);
      // 입혀질 것: 모자와 마스크, 가운, 장갑 (처음에는 감춰 둔다)
      const cap = ball(me.head, 0, 0.17, -0.015, 0.31, '#7fa8c4', [1, 0.66, 1]), mask = box(me.head, 0, -0.08, 0.25, 0.3, 0.16, 0.04, '#d3e6e9'); cap.visible = mask.visible = false;
      const gown = new T.Group(); me.root.add(gown); gown.visible = false;
      const gb = new T.Mesh(new T.CapsuleGeometry(0.33, 0.55, 5, 12), mat('#7fa8c4')); gb.position.y = 1.08; gb.scale.z = 0.72; gown.add(gb);
      box(gown, 0, 0.62, 0, 0.62, 0.5, 0.45, '#7fa8c4');
      const gloves = new T.Group(); me.root.add(gloves); gloves.visible = false;
      for (const s of [-1, 1]) ball(gloves, s * 0.37, 0.9, 0.02, 0.1, '#e9d9b0', [0.9, 1.15, 0.9]);
      // 물품 탁자 (앞쪽 왼편에 가로로)
      box(g, -1.4, 0.39, 1.25, 2.6, 0.78, 0.9, '#d9cdb6'); box(g, -1.4, 0.795, 1.25, 2.65, 0.03, 0.95, '#efe6d6');
      const capmask = new T.Group(); ball(capmask, -0.12, 0.08, 0, 0.17, '#7fa8c4', [1, 0.5, 1]); box(capmask, 0.17, 0.04, 0, 0.22, 0.05, 0.14, '#d3e6e9'); mtag(capmask, '모자·마스크', 0, 0.42, 0.2, 0.8, 0.28); g.add(capmask);
      const gownPack = new T.Group(); box(gownPack, 0, 0.06, 0, 0.55, 0.12, 0.42, '#7fa8c4'); box(gownPack, 0, 0.125, 0, 0.5, 0.01, 0.06, '#5d8aa8'); mtag(gownPack, '멸균 가운', 0, 0.45, 0.2, 0.75, 0.28); g.add(gownPack);
      const glovePack = new T.Group(); box(glovePack, 0, 0.03, 0, 0.42, 0.05, 0.3, '#f4ecd8'); ball(glovePack, -0.08, 0.07, 0, 0.07, '#e9d9b0'); ball(glovePack, 0.08, 0.07, 0, 0.07, '#e9d9b0'); mtag(glovePack, '멸균 장갑', 0, 0.4, 0.2, 0.75, 0.28); g.add(glovePack);
      // 손 씻는 개수대: 손을 올려 두고 문지른다
      box(g, 1.95, 0.45, 0.35, 1.6, 0.9, 1.5, '#d7e2e4'); box(g, 1.95, 0.915, 0.35, 1.65, 0.03, 1.55, '#eef3f3'); cyl(g, 1.95, 1.2, -0.35, 0.04, 0.5, '#a5afb1');
      bigHand(g, 1.62, 0.9, 0.45, true, 1.05, '#a6c5d1'); bigHand(g, 2.28, 0.9, 0.45, true, 1.05, '#a6c5d1');
      tag(g, '수술 전 손 세척', 1.95, 1.3, 1.45, 1.25, 0.3);
      const ready = tag2(g, ['준비 끝 · 이제 타임아웃'], 0.1, 2.55, -1.1, 2.1, 0.36, '#2f8f6c'); ready.visible = false;
      const foam = new T.Group(); for (const [x, z, r] of [[0, 0, 0.1], [0.08, 0.05, 0.07]]) ball(foam, x, 0.03, z, r, '#f6fbfc', [1, 0.45, 1]); g.add(foam);
      const ME = [0.1, -0.55];
      const wear = (o, fn) => { o.visible = false; fn(); };
      return {
        frame: { top: 2.6 }, rubY: 0.965, tool: foam,
        patches: [{ id: 'scrub', y: 0.965, color: '#86b866', opacity: 0.75, dot: 0.055, reach: 0.2, blobs: [{ x: 1.62, z: 0.45, r: 0.24, n: 9, squash: 1.2 }, { x: 2.28, z: 0.45, r: 0.24, n: 9, squash: 1.2 }] }],
        movers: [
          { id: 'capmask', obj: capmask, from: [-2.25, 1.2], to: ME, r: 0.6, y: 0.82, lift: 0.25, onPlaced(o) { wear(o, () => { cap.visible = mask.visible = true; }); } },
          { id: 'gown', obj: gownPack, from: [-1.4, 1.2], to: ME, r: 0.6, y: 0.82, lift: 0.25, onPlaced(o) { wear(o, () => { gown.visible = true; }); } },
          { id: 'gloves', obj: glovePack, from: [-0.55, 1.2], to: ME, r: 0.6, y: 0.82, lift: 0.25, onPlaced(o) { wear(o, () => { gloves.visible = true; ready.visible = true; }); } },
        ],
        tick(dt, t) { me.update(t, false); },
      };
    },
  },

  // ── 의사 ④ 의사실: 연습용 패드에 다섯 땀을 왼쪽부터 꿰매고(점에서 점까지 문지르기), 실 끝을 자른다. 사람에게 하는 장면이 아니다 ──
  suturepad: {
    build(g) {
      floor(g, 5.8, 4.2, '#efe7d8');
      label(g, '의사실 · 연습 시간', 1.1, 2.0, -2.02, 1.5, 0.36);
      box(g, 0, 0.4, 0.15, 5.0, 0.8, 3.0, '#e5cdb1'); box(g, 0, 0.815, 0.15, 5.1, 0.03, 3.1, '#efdcc2'); // 책상
      const senior = person({ coat: '#f7f8f3', outfit: 'white', hair: 2, seed: 3 }); senior.root.position.set(-2.2, 0, -1.75); senior.root.rotation.y = 0.5; g.add(senior.root);
      box(g, 0, 0.86, -0.05, 3.4, 0.08, 1.7, '#f0b9a8'); box(g, 0, 0.902, -0.05, 3.1, 0.006, 0.035, '#b5655a'); // 연습용 패드와 그 위의 긴 선
      tag2(g, ['연습용 패드 · 사람이 아니에요'], 0.3, 1.45, -1.25, 2.4, 0.34);
      const XS = [-1.2, -0.6, 0, 0.6, 1.2];
      const stitches = XS.map((x, i) => {
        ball(g, x, 0.905, -0.45, 0.035, '#4f6fa8', [1, 0.3, 1]); ball(g, x, 0.905, 0.35, 0.035, '#4f6fa8', [1, 0.3, 1]); // 바늘이 들어가고 나올 점
        num(g, i + 1, x, 1.12, 0.62);
        const s = box(g, x, 0.912, -0.05, 0.03, 0.012, 0.8, '#2d4a6b'); s.visible = false; return s; // 꿰맨 실
      });
      const sc = new T.Group(); for (const s of [-1, 1]) { const b = box(sc, s * 0.04, 0.02, -0.1, 0.03, 0.02, 0.34, '#9aa4a8'); b.rotation.y = s * 0.12; ball(sc, s * 0.07, 0.02, 0.12, 0.06, '#d2553f', [1, 0.4, 1]); } g.add(sc);
      mtag(sc, '가위', 0, 0.38, 0.2, 0.5, 0.26);
      const tool = new T.Group(); const nh = cyl(tool, 0.12, 0.08, 0.12, 0.018, 0.4, '#9aa4a8'); nh.rotation.z = -1.1; ball(tool, 0, 0.03, 0, 0.03, '#c9d1d4'); g.add(tool);
      const say = tag2(g, ['“좋아요, 간격이 고르네요.”'], -1.2, 2.3, -1.6, 2.0, 0.34); say.visible = false;
      const ids = XS.map((x, i) => `s${i + 1}`);
      return {
        rubY: 0.905, tool,
        patches: XS.map((x, i) => ({ id: ids[i], y: 0.905, color: '#7f9fd0', opacity: 0.85, dot: 0.04, reach: 0.15, blobs: [-0.33, -0.18, -0.03, 0.12, 0.27].map((z) => ({ x, z, r: 0.03, n: 2 })) })),
        movers: [{ id: 'cut', obj: sc, from: [2.1, 1.0], to: [1.2, 0.45], r: 0.38, y: 0.84, restY: 0.92, lift: 0.15, onPlaced() { say.visible = true; } }],
        onRub(id, v) { if (v >= 1) stitches[ids.indexOf(id)].visible = true; },
        tick(dt, t) { senior.update(t, false); },
      };
    },
  },

  // ── 환경미화 직원 ① 108호: 방 안쪽(협탁)부터 침대 난간, 나가면서 문 손잡이를 닦고, 쓴 티슈는 봉투에 ──
  touchwipe: {
    build(g) {
      floor(g, 5.8, 4.2, '#eadfca');
      label(g, '108호 병실', -1.2, 2.0, -2.02, 1.3, 0.36);
      // 침대 (퇴원해 비어 있다, 머리가 -x)
      box(g, -0.4, 0.4, -0.75, 2.6, 0.16, 1.3, '#d9dedb'); box(g, -0.4, 0.6, -0.75, 2.5, 0.24, 1.2, '#e6eae8'); box(g, -1.72, 0.85, -0.75, 0.1, 0.8, 1.32, '#c9d6d8');
      for (const a of [-1.5, 0.7]) for (const c of [-1.25, -0.25]) { box(g, a, 0.18, c, 0.07, 0.36, 0.07, '#a5afb1'); ball(g, a, 0.06, c, 0.08, '#697d85'); }
      box(g, -0.3, 0.875, 0.0, 1.9, 0.05, 0.07, '#8fa3a8'); for (const x of [-1.1, -0.3, 0.5]) box(g, x, 0.78, 0.0, 0.05, 0.2, 0.05, '#8fa3a8'); // 침대 난간 (올라가 있다)
      tag(g, '침대 난간', -0.3, 1.2, 0.35, 0.95, 0.28);
      // 협탁 (방 안쪽, 창가)
      box(g, -2.3, 0.44, -1.2, 0.8, 0.88, 0.7, '#efe4d4'); box(g, -2.3, 0.89, -1.2, 0.85, 0.02, 0.75, '#e2d3bf'); tag(g, '협탁', -2.3, 1.28, -0.75, 0.6, 0.28);
      // 문과 손잡이 (방 바깥쪽)
      box(g, 1.95, 1.1, -1.98, 1.1, 2.2, 0.08, '#dcc9ae'); box(g, 1.6, 0.9, -1.85, 0.36, 0.05, 0.12, '#9aa4a8'); cyl(g, 1.78, 0.9, -1.9, 0.05, 0.12, '#9aa4a8').rotation.x = Math.PI / 2;
      tag(g, '문 손잡이', 2.05, 2.35, -1.75, 0.9, 0.28);
      // 쓴 소독 티슈와 일반 쓰레기 봉투
      box(g, -2.1, 0.35, 1.3, 1.0, 0.7, 0.7, '#7fa1b5'); box(g, -2.1, 0.705, 1.3, 1.05, 0.02, 0.75, '#9bb7c8'); tag(g, '청소 수레', -2.1, 1.05, 1.75, 0.85, 0.26);
      const used = new T.Group(); box(used, 0, 0.02, 0, 0.3, 0.04, 0.22, '#e6eef0'); box(used, 0.04, 0.05, 0.02, 0.2, 0.03, 0.14, '#d6e2e4'); mtag(used, '쓴 티슈', 0, 0.36, 0.15, 0.7, 0.26); g.add(used);
      const bag = new T.Group(); bag.position.set(2.2, 0, 1.2); g.add(bag); cyl(bag, 0, 0.35, 0, 0.32, 0.7, '#5d6a70', 0.28); cyl(bag, 0, 0.71, 0, 0.33, 0.04, '#454f54'); mtag(bag, '일반 봉투', 0, 1.05, 0.35, 0.85, 0.26);
      const done = tag2(g, ['다음 분이 써도 깨끗해요 ✓'], 0, 2.0, -1.2, 2.2, 0.34, '#2f8f6c'); done.visible = false;
      const tool = cloth();
      g.add(tool);
      const DOT = { y: 0.905, color: '#b89a5e', opacity: 0.65, dot: 0.06, reach: 0.17 };
      return {
        rubY: 0.905, tool,
        patches: [
          { id: 'table', ...DOT, blobs: [{ x: -2.3, z: -1.2, r: 0.28, n: 11, squash: 0.9 }] },
          { id: 'rail', ...DOT, blobs: [-1.1, -0.65, -0.2, 0.25].map((x) => ({ x, z: 0.0, r: 0.12, n: 3, squash: 0.4 })) },
          { id: 'handle', ...DOT, blobs: [{ x: 1.62, z: -1.83, r: 0.16, n: 6, squash: 0.5 }] },
        ],
        movers: [{ id: 'bag', obj: used, from: [-2.1, 1.3], to: [2.2, 1.2], r: 0.45, y: 0.73, dragY: 0.75, restY: 0.6, lift: 0.2, onPlaced(o) { o.visible = false; done.visible = true; } }],
      };
    },
  },

  // ── 환경미화 직원 ② 폐기물 보관실: 수레의 쓰레기를 알맞은 수거함에. 끄는 동안 수거함 넷 모두에 같은 초록 원이 뜬다 ──
  wastesort: {
    build(g) {
      floor(g, 5.8, 4.2, '#e4e6dc');
      label(g, '폐기물 보관실', 1.1, 2.0, -2.02, 1.4, 0.36);
      const BINS = [['general', -2.1, '#7d8a8f', '일반'], ['plastic', -0.7, '#5f8fb0', '플라스틱'], ['paper', 0.7, '#c9a46b', '종이'], ['medical', 2.1, '#d9a23a', '의료폐기물']];
      for (const [, x, c, t] of BINS) {
        if (t === '의료폐기물') { box(g, x, 0.45, -0.85, 1.0, 0.9, 0.9, c); box(g, x, 0.91, -0.85, 1.02, 0.03, 0.92, '#a87b22'); }
        else { cyl(g, x, 0.45, -0.85, 0.48, 0.9, c, 0.42); cyl(g, x, 0.91, -0.85, 0.5, 0.04, '#4d5559'); }
        tag2(g, [t], x, 0.55, -0.3, t.length > 3 ? 1.3 : 1.0, 0.36); // 이름표는 수거함 앞면에 (넣은 물건이 위에서 보이게)
      }
      box(g, 0, 0.35, 1.35, 5.0, 0.7, 0.85, '#b9c2bf'); box(g, 0, 0.705, 1.35, 5.05, 0.02, 0.9, '#d0d8d6'); // 수레
      const snack = new T.Group(); box(snack, 0, 0.05, 0, 0.36, 0.1, 0.26, '#e98f4a'); ball(snack, 0.12, 0.08, 0.05, 0.08, '#fbfbf6'); mtag(snack, '과자 봉지·휴지', 0, 0.42, 0.2, 1.05, 0.28); g.add(snack);
      const bottle = new T.Group(); const bt = cyl(bottle, 0, 0.08, 0, 0.08, 0.42, '#bfe0ef', 0.08); bt.rotation.z = Math.PI / 2; cyl(bottle, 0.25, 0.08, 0, 0.045, 0.08, '#3f9d7d').rotation.z = Math.PI / 2; mtag(bottle, '빈 페트병', 0, 0.42, 0.2, 0.85, 0.28); g.add(bottle);
      const paper = new T.Group(); box(paper, 0, 0.03, 0, 0.5, 0.06, 0.36, '#c9a46b'); box(paper, 0, 0.065, 0, 0.5, 0.01, 0.03, '#a8854f'); mtag(paper, '접은 종이 상자', 0, 0.42, 0.2, 1.05, 0.28); g.add(paper);
      const med = new T.Group(); box(med, 0, 0.13, 0, 0.36, 0.26, 0.3, '#f2c94c'); box(med, 0, 0.27, 0, 0.38, 0.03, 0.32, '#c99a1e'); mtag(med, '닫힌 의료폐기물 상자', 0, 0.62, 0.2, 1.35, 0.28); g.add(med);
      const done = tag2(g, ['분리 끝 · 수거차 준비 ✓'], 0, 2.0, -1.5, 2.1, 0.34, '#2f8f6c'); done.visible = false;
      let left = 4;
      const into = (o) => { o.scale.setScalar(0.8); if (--left === 0) done.visible = true; };
      const M = (id, obj, slot, x) => ({ id, obj, slot, from: [x, 1.35], y: 0.72, dragY: 0.95, restY: 0.97, lift: 0.18, onPlaced: into });
      return {
        frame: { top: 1.8 },
        slots: BINS.map(([id, x]) => ({ id, at: [x, -0.85], y: 0.95, r: 0.5 })),
        movers: [M('med', med, 'medical', -1.9), M('bottle', bottle, 'plastic', -0.65), M('snack', snack, 'general', 0.65), M('paper', paper, 'paper', 1.9)],
      };
    },
  },
};
