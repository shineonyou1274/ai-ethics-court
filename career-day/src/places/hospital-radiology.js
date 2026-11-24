// 모아 병원 지하 1층 영상의학과: 방사선사가 하루를 걸어 다니는 층 (카페 방식, shared/DESIGN.md §2-3).
// 방사선사(job.floor: 'radiology')만 쓴다. 기록의 일터는 그대로 'hospital' 이다 (places/index.js 의 placeOf).
// 뒤쪽 줄: 일반촬영실, 조정실(납유리 창 너머로 촬영실이 보인다), CT실, 판독실. 앞쪽 줄: 대기실, 방사선사실, 휴게실, 탈의실.
// 이름과 모습은 모두 가상이고, 실제 영상의학과를 아주 단순하게 줄였다.
import * as T from 'three';
import { box, cyl, ball, chair, monitor, mat } from '../world/kit.js';
import { hospFloor, BACK, FRONT, LOUNGE, LOCKER, SPOT_BACK, SPOT_FRONT } from './_hosp-floor.js';

const rooms = [
  { id: 'xray', sign: '일반촬영실', name: '일반촬영실', ...BACK[0], color: '#9ebecf', floorColor: '#e8eef0' },
  { id: 'control', sign: '조정실', name: '조정실', ...BACK[1], color: '#b7cddd' },
  { id: 'ct', sign: 'CT실', name: 'CT실', ...BACK[2], color: '#a6c5d1', floorColor: '#e8eef0', staff: { coat: '#a9c6d9', outfit: 'scrub', hair: 1 }, npc: [1.3, -0.6] }, // CT실 동료 방사선사
  { id: 'reading', sign: '판독실', name: '판독실', ...BACK[3], color: '#8fa6b8', staff: { coat: '#f7f8f3', outfit: 'white', hair: 0 }, npc: [-0.8, -0.9], npcRot: 0.4 }, // 영상의학과 의사
  { id: 'waiting', sign: '대기실', name: '대기실', ...FRONT[0], color: '#e5c18e', staff: { coat: '#d8c3a5', outfit: 'casual', hair: 2 }, npc: [-1.4, 0.2] }, // 기다리는 분
  { id: 'office', sign: '방사선사실', name: '방사선사실', ...FRONT[1], color: '#a9c6d9', staff: { coat: '#a9c6d9', outfit: 'scrub', hair: 2 }, npc: [-1.3, 0.35] }, // 선배 방사선사
  LOUNGE, LOCKER,
];

function furnish(g, r) {
  if (r.id === 'xray') { // 촬영대, 천장에서 내려온 X선관, 가슴 촬영대
    box(g, 0, 0.45, -1.3, 2.6, 0.9, 0.9, '#c5d7df'); box(g, 0, 0.92, -1.3, 2.65, 0.05, 0.95, '#e8f0f3');
    cyl(g, 0.5, 2.55, -1.3, 0.04, 0.5, '#a5afb1'); box(g, 0.5, 2.2, -1.3, 0.5, 0.3, 0.45, '#d9dedb'); box(g, 0.5, 2.02, -1.3, 0.36, 0.06, 0.36, '#f2e6a6'); // X선관
    box(g, -1.6, 1.2, -2.05, 0.6, 0.9, 0.12, '#d3dfe1'); cyl(g, -1.6, 0.6, -2.1, 0.05, 1.2, '#a5afb1'); // 가슴 촬영대
    box(g, 1.55, 2.45, -2.13, 0.7, 0.2, 0.04, '#d2553f'); // '촬영 중' 등
  }
  if (r.id === 'control') { // 조작대와 화면. 왼쪽 벽 위에 납유리 창
    box(g, -0.6, 0.45, -1.75, 2.2, 0.9, 0.7, '#d6e2ea'); box(g, -0.6, 0.92, -1.75, 2.25, 0.05, 0.75, '#eef3f6');
    monitor(g, -1.1, -1.85); monitor(g, -0.3, -1.85); box(g, 0.25, 0.98, -1.6, 0.3, 0.06, 0.2, '#e46d5a'); // 노출 스위치
    chair(g, -0.6, -1.0, '#b7cddd', Math.PI);
    const glass = box(g, -r.w / 2 - 0.005, 1.65, -0.5, 0.06, 0.7, 2.2, '#9fc3d6'); glass.material.transparent = true; glass.material.opacity = 0.55; // 납유리 창
  }
  if (r.id === 'ct') { // CT 장비(둥근 문)와 눕는 대
    const ring = new T.Mesh(new T.TorusGeometry(0.7, 0.26, 12, 32), mat('#f7f7ef')); ring.position.set(-0.6, 1.0, -1.7); ring.castShadow = true; g.add(ring);
    box(g, -0.6, 0.38, -1.7, 1.5, 0.75, 0.55, '#d3dfe1'); box(g, -0.6, 0.62, -0.75, 0.55, 0.15, 1.8, '#c5d7df'); box(g, -0.6, 0.3, -0.5, 0.3, 0.6, 0.6, '#e8ece5');
  }
  if (r.id === 'reading') { // 어두운 방, 화면 셋이 놓인 책상
    box(g, 0, 0.42, -1.75, 3.0, 0.84, 0.7, '#7d8f9e'); box(g, 0, 0.855, -1.75, 3.05, 0.03, 0.75, '#93a4b2');
    for (const x of [-0.85, 0, 0.85]) { box(g, x, 1.25, -1.9, 0.75, 0.55, 0.05, '#2b3a46'); box(g, x, 1.25, -1.87, 0.66, 0.46, 0.01, '#c9d6dc'); }
  }
  if (r.id === 'waiting') { // 대기 의자 한 줄과 휠체어
    box(g, -0.4, 0.42, -1.2, 3.2, 0.08, 0.5, '#e5c18e'); box(g, -0.4, 0.7, -1.42, 3.2, 0.5, 0.06, '#dcb47e'); for (const x of [-1.8, -0.4, 1.0]) box(g, x, 0.2, -1.2, 0.08, 0.4, 0.4, '#8f9a9c');
    ball(g, 1.6, 0.3, 0.6, 0.28, '#56636b', [0.3, 1, 1]); box(g, 1.75, 0.5, 0.6, 0.4, 0.08, 0.45, '#7d8a8f');
  }
  if (r.id === 'office') { // 둥근 탁자와 의자
    cyl(g, 0, 0.76, -0.5, 0.85, 0.08, '#c9d7df'); cyl(g, 0, 0.38, -0.5, 0.14, 0.72, '#dfd3c3');
    for (const [x, z, a] of [[-1.15, -0.5, Math.PI / 2], [1.15, -0.5, -Math.PI / 2], [0, -1.35, 0]]) chair(g, x, z, '#b4c9d5', a);
    box(g, 0.2, 0.82, -0.45, 0.4, 0.02, 0.3, '#fff9ee');
  }
}

export default hospFloor({
  floor: 'radiology',
  rooms, furnish,
  quiet: ['lounge', 'locker', 'office', 'control', 'reading', 'ct', 'xray'], // 기다리는 사람이 따라오지 않는 곳
  sign: '모아 병원 지하 1층 영상의학과',
  corridor: '#dbe4e6',
  blocks: [
    [-7.35, -4.65, -4.85, -3.85], [-7.95, -7.25, -5.0, -4.85], // 일반촬영실: 촬영대, 가슴 촬영대
    [-3.75, -1.45, -5.0, -4.35], [-2.95, -2.25, -4.4, -3.7], // 조정실: 조작대, 의자
    [0.5, 2.3, -5.0, -4.4], [1.1, 1.7, -4.4, -2.85], [3.05, 3.55, -3.9, -3.4], // CT실: 장비, 눕는 대, 동료
    [4.45, 7.55, -5.0, -4.35], [4.95, 5.45, -4.2, -3.7], // 판독실: 책상, 의사
    [-7.25, -3.95, 1.5, 2.3], [-6.85, -6.35, 3.15, 3.65], [-3.95, -3.2, 3.5, 4.1], // 대기실: 의자, 기다리는 분, 휠체어
    [-2.1, 0.9, 1.5, 3.55], [-2.15, -1.65, 3.3, 3.8], // 방사선사실: 탁자와 의자, 선배
  ],
  spots: {
    xray: { ...SPOT_BACK[0], name: '일반촬영실' },
    control: { ...SPOT_BACK[1], name: '조정실' },
    ct: { ...SPOT_BACK[2], name: 'CT실' },
    reading: { ...SPOT_BACK[3], name: '판독실' },
    waiting: { ...SPOT_FRONT[0], name: '대기실' },
    office: { ...SPOT_FRONT[1], name: '방사선사실' },
    lounge: { ...SPOT_FRONT[2], name: '휴게실' },
    locker: { ...SPOT_FRONT[3], name: '탈의실' },
  },
});
