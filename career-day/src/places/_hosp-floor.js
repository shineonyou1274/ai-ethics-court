// 병원의 한 층 모형을 짓는 틀: 임상병리사(2층 진단검사의학과)와 방사선사(지하 1층 영상의학과)가 쓴다.
// 의사의 5층 외과(hospital-surgery.js)와 같은 칸 배치를 그대로 쓴다: 뒤쪽 줄 방 넷(벽이 있는 방), 앞쪽 줄 방 넷(트인 방), 가운데 복도.
// 층마다 다른 것(방 이름, 가구, 가구가 막는 자리, 층 간판)만 받는다. 이름과 모습은 모두 가상이고, 실제 병원을 아주 단순하게 줄였다.
import * as T from 'three';
import { box, cyl, label, plant, person } from '../world/kit.js';
import hospital from './hospital.js';

// 뒤쪽 줄은 x -6, -2, 2, 6 (너비 3.85), 앞쪽 줄은 x -5.2, -0.6, 3.0, 6.8. 휴게실과 탈의실은 모든 층이 같다.
export const BACK = [-6.0, -2.0, 2.0, 6.0].map((x) => ({ x, z: -3.05, w: 3.85, d: 4.7 }));
export const FRONT = [{ x: -5.2, w: 4.6 }, { x: -0.6, w: 3.6 }, { x: 3.0, w: 3.6 }, { x: 6.8, w: 3.0 }].map((r) => ({ ...r, z: 3.2, d: 3.6, open: true }));
export const LOUNGE = { id: 'lounge', sign: '휴게실', name: '휴게실', ...FRONT[2], color: '#d9b4a6' };
export const LOCKER = { id: 'locker', sign: '탈의실', name: '탈의실', ...FRONT[3], color: '#c4c8a8', labelRight: true };
// 걸어갈 자리: 뒤쪽 방은 방 앞쪽 오른편, 앞쪽 방은 의사 층과 같은 자리
export const SPOT_BACK = [-5.45, -1.45, 2.55, 6.55].map((x) => ({ x, z: -2.0 }));
export const SPOT_FRONT = [{ x: -5.45, z: 3.65 }, { x: 0.25, z: 4.15 }, { x: 3.85, z: 4.0 }, { x: 5.95, z: 4.3 }];

function commonFurnish(g, r) {
  if (r.id === 'lounge') {
    box(g, 0, 0.25, -1.3, 2.0, 0.5, 0.6, '#e3b79a'); box(g, 0, 0.62, -1.55, 2.0, 0.5, 0.12, '#dba88a');
    box(g, 0, 0.42, -0.4, 1.1, 0.06, 0.5, '#e5cdb1'); for (const a of [-0.45, 0.45]) box(g, a, 0.2, -0.4, 0.06, 0.4, 0.4, '#d6c2a8');
    cyl(g, -0.25, 0.5, -0.4, 0.07, 0.12, '#c1d4dc'); cyl(g, 0.2, 0.5, -0.4, 0.07, 0.12, '#f1c6b4');
    box(g, 1.5, 0.55, -1.3, 0.4, 1.1, 0.4, '#e8eef0'); cyl(g, 1.5, 1.25, -1.3, 0.14, 0.3, '#bcd8e4');
  }
  if (r.id === 'locker') {
    for (const x of [-0.9, 0, 0.9]) { box(g, x, 0.8, -1.4, 0.8, 1.6, 0.45, '#f3ece1'); box(g, x, 1.15, -1.15, 0.1, 0.2, 0.02, '#c4a27f'); }
    box(g, 0, 0.25, 0.2, 1.8, 0.1, 0.4, '#d3b794'); for (const x of [-0.7, 0.7]) box(g, x, 0.12, 0.2, 0.1, 0.24, 0.35, '#b9a184');
  }
}

// def = { floor, rooms, furnish(g, r), blocks, spots, quiet, sign, corridor, extra(scene, people) }
export function hospFloor(def) {
  const rooms = def.rooms;
  return {
    ...hospital, // 이름, 그림 글자, 일터 색은 병원 그대로
    floor: def.floor,
    quiet: def.quiet,
    rooms,
    sets: {}, // 모든 장면이 이 층 안에서 열린다
    nav: {
      bounds: [-8.6, 8.6, -5.0, 6.9],
      frame: { cx: 0, cz: 0.4, w: 17.8, d: 12.6, top: 2.6, yaw: 0.25, tilt: [0.72, 1.05] },
      blocks: [
        [-8.0, -7.85, -5.3, -0.8], [-4.0, -3.85, -5.3, -0.8], [0.0, 0.15, -5.3, -0.8], [4.0, 4.15, -5.3, -0.8], // 방 사이 벽
        ...def.blocks,
        [2.0, 4.0, 1.6, 2.2], [2.45, 3.55, 2.55, 3.05], [4.3, 4.7, 1.7, 2.1], // 휴게실
        [5.4, 8.2, 1.55, 2.05], [5.9, 7.7, 3.2, 3.6], // 탈의실
        ...rooms.filter((r) => r.open).map((r) => { const c = r.x + (r.labelRight ? r.w / 2 - 1.0 : -r.w / 2 + 1.0); return [c - 0.9, c + 0.9, 4.86, 4.94]; }), // 앞쪽 방의 이름표
        [-8.4, -8.2, 0.4, 0.6], [-8.1, -7.5, 5.3, 5.9], [4.9, 5.5, 5.3, 5.9], // 간판, 화분
      ],
      spots: { door: { x: -6.5, z: 6.0, name: '직원 출입구' }, ...def.spots },
      start: 'door', depart: 'door',
    },
    start: [-6.5, 0, 6.2],
    exit: [6.5, 0, 6.2],
    build(scene) {
      const people = [];
      const floor = new T.Group(); scene.add(floor);
      box(floor, 0, -0.6, 0, 17.8, 0.65, 12, '#c9baa6'); box(floor, 0, -0.22, 0, 18, 0.18, 12.2, '#ede5d6'); box(floor, 0, -0.08, 0, 17.6, 0.1, 11.8, '#fff7e8');
      box(floor, 0, 0.008, 0.35, 16.9, 0.012, 2.0, def.corridor || '#dbe4e6'); for (let x = -7.5; x <= 7.5; x += 0.7) box(floor, x, 0.02, 0.35, 0.27, 0.012, 0.04, '#f4f8f8'); // 복도
      rooms.forEach((r, i) => {
        const g = new T.Group(); g.position.set(r.x, 0, r.z); scene.add(g);
        box(g, 0, 0.025, 0, r.w, 0.05, r.d, r.floorColor || (r.open ? '#f4efe6' : '#f2eee6'));
        if (r.open) label(g, r.sign, r.labelRight ? r.w / 2 - 1.0 : -r.w / 2 + 1.0, 0.9, r.d / 2 - 0.1, 1.8, 0.46, '#5c6a6d', '#faf4e8');
        else {
          const h = 2.7, back = -r.d / 2 + 0.1;
          box(g, 0, h / 2, back, r.w + 0.13, h, 0.14, '#f1e6d6'); box(g, 0, 0.24, back + 0.1, r.w + 0.05, 0.42, 0.045, r.color);
          box(g, -r.w / 2 - 0.005, 0.65, 0, 0.12, 1.3, r.d - 0.2, '#e6dac8');
          label(g, r.sign, 0.35, h - 0.45, back + 0.095, 2.4, 0.5, '#5c6a6d', '#faf4e8');
        }
        commonFurnish(g, r); def.furnish(g, r);
        if (r.staff) { const [nx, nz] = r.npc; const npc = person({ ...r.staff, seed: i + 1 }); npc.root.position.set(r.x + nx, 0, r.z + nz); npc.root.rotation.y = r.npcRot ?? -0.3; scene.add(npc.root); people.push(npc); }
      });
      def.extra?.(scene, people);
      box(scene, 0, -0.16, 6.2, 16, 0.18, 1.9, '#e6d9c2');
      for (let x = -5; x < 6; x += 0.65) box(scene, x, -0.06, 6.2, 0.33, 0.015, 0.08, '#fff3df');
      for (const x of [-6.5, 6.5]) plant(scene, x - 1.3, 5.6, 1.1);
      label(scene, '직원 출입구', -6.5, 2.6, 5.5, 1.6, 0.4); label(scene, '퇴근길', 6.5, 2.6, 5.5, 1.6, 0.4);
      const sign = new T.Group(); sign.position.set(-8.3, 0, 0.5); scene.add(sign);
      cyl(sign, 0, 1, 0, 0.04, 2, '#b9b2a5'); label(sign, def.sign, 0, 2, 0, 2.6, 0.6, '#f8eee0', '#36546b');
      return { people };
    },
  };
}
