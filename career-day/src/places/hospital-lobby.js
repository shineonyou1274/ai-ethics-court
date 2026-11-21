// 모아 병원 1층 로비: 환경미화 직원이 하루를 걸어 다니는 층 (카페 방식, shared/DESIGN.md §2-3).
// 환경미화 직원(job.floor: 'lobby')만 쓴다. 기록의 일터는 그대로 'hospital' 이다 (places/index.js 의 placeOf).
// 뒤쪽 줄: 로비·대기 공간(넓은 방), 108호(단기 병실), 엘리베이터 앞. 앞쪽 줄: 환경관리실, 폐기물 보관실, 휴게실, 탈의실. 가운데가 복도다.
// 이름과 모습은 모두 가상이고, 실제 병원 1층을 아주 단순하게 줄였다.
import * as T from 'three';
import { box, cyl, ball, label, plant, bed, cupboard, person } from '../world/kit.js';
import hospital from './hospital.js';

const rooms = [
  { id: 'lobby', sign: '로비 · 대기', name: '로비', x: -4.0, z: -3.05, w: 7.85, d: 4.7, color: '#e5c18e' },
  { id: 'r108', sign: '108호 병실', name: '108호', x: 2.0, z: -3.05, w: 3.85, d: 4.7, color: '#c2bbd7' }, // 오늘 아침 퇴원한 자리
  { id: 'elev', sign: '엘리베이터 앞', name: '엘리베이터 앞', x: 6.0, z: -3.05, w: 3.85, d: 4.7, color: '#b7c5c8' },
  { id: 'support', sign: '환경관리실', name: '환경관리실', x: -5.2, z: 3.2, w: 4.6, d: 3.6, color: '#c4c8a8', open: true, staff: { coat: '#b8bca1', outfit: 'vest', hair: 1 }, npc: [-1.4, 0.2] }, // 환경관리팀 동료
  { id: 'waste', sign: '폐기물 보관실', name: '폐기물 보관실', x: -0.6, z: 3.2, w: 3.6, d: 3.6, color: '#a9b59a', open: true },
  { id: 'lounge', sign: '휴게실', name: '휴게실', x: 3.0, z: 3.2, w: 3.6, d: 3.6, color: '#d9b4a6', open: true },
  { id: 'locker', sign: '탈의실', name: '탈의실', x: 6.8, z: 3.2, w: 3.0, d: 3.6, color: '#c4c8a8', open: true, labelRight: true },
];
const BIN = [['#7d8a8f', '일반'], ['#5f8fb0', '플라스틱'], ['#c9a46b', '종이'], ['#d9a23a', '의료']];

function furnish(g, r) {
  if (r.id === 'lobby') {
    box(g, -2.7, 0.5, -1.3, 1.6, 1.0, 0.7, '#dfbd8c'); box(g, -2.7, 1.02, -1.3, 1.7, 0.05, 0.78, '#f3e3c8'); label(g, '안내', -2.7, 1.35, -0.92, 0.8, 0.3); // 안내 데스크
    for (const z of [-1.75, -0.75]) { box(g, 1.4, 0.42, z, 3.8, 0.08, 0.5, '#b7cddd'); box(g, 1.4, 0.7, z - 0.22, 3.8, 0.5, 0.06, '#a9c0d0'); for (const x of [-0.3, 1.4, 3.1]) box(g, x, 0.2, z, 0.08, 0.4, 0.4, '#8f9a9c'); } // 대기 의자 두 줄
    plant(g, 3.55, 1.6, 0.8);
  }
  if (r.id === 'r108') {
    bed(g, -0.55, -0.85); box(g, 0.4, 0.38, -1.55, 0.5, 0.76, 0.45, '#efe4d4'); box(g, 0.4, 0.78, -1.55, 0.54, 0.04, 0.5, '#e2d3bf');
    box(g, -0.55, 0.94, -0.7, 0.9, 0.06, 1.3, '#bcd3df'); // 퇴원하고 남은 침대
    plant(g, 1.45, -1.75, 0.65);
  }
  if (r.id === 'elev') {
    for (const x of [-0.85, 0.75]) { box(g, x, 1.1, -2.18, 1.1, 2.2, 0.05, '#c9d3d6'); box(g, x, 1.1, -2.15, 0.02, 2.1, 0.02, '#8f9a9c'); box(g, x + 0.7, 1.15, -2.15, 0.12, 0.25, 0.03, '#e8eef0'); }
    for (const z of [-1.6, -0.6, 0.4]) cyl(g, -1.75, 0.45, z, 0.03, 0.9, '#a5afb1'); const rail = cyl(g, -1.75, 0.9, -0.6, 0.035, 2.1, '#c9ac85'); rail.rotation.x = Math.PI / 2; // 손잡이 난간
    box(g, 1.25, 0.5, -1.35, 0.6, 1.0, 0.55, '#a9b7bb'); ball(g, 1.25, 0.3, -1.1, 0.25, '#56636b', [1, 1, 0.3]); // 휠체어 보관대
  }
  if (r.id === 'support') {
    box(g, -0.4, 0.9, -1.4, 3.2, 1.8, 0.45, '#ece5d6'); for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) box(g, -1.75 + i * 0.55, 0.7 + j * 0.6, -1.15, 0.35, 0.3, 0.08, ['#cad5d2', '#dbc1ab', '#a9bfd1'][(i + j) % 3]); // 물품 선반
    box(g, -0.9, 0.45, -0.55, 0.7, 0.6, 0.5, '#7fa1b5'); cyl(g, -0.9, 0.95, -0.55, 0.02, 0.6, '#9a8f7d'); cyl(g, 0.4, 0.3, -0.55, 0.25, 0.6, '#5f8fb0', 0.3); // 청소 수레, 양동이
  }
  if (r.id === 'waste') {
    BIN.forEach(([c, t], i) => { const x = -1.2 + i * 0.8; cyl(g, x, 0.4, -1.1, 0.3, 0.8, c, 0.35); cyl(g, x, 0.82, -1.1, 0.32, 0.05, '#4d5559'); label(g, t, x, 1.15, -0.85, 0.7, 0.26); });
  }
  if (r.id === 'lounge') {
    box(g, 0, 0.25, -1.3, 2.0, 0.5, 0.6, '#e3b79a'); box(g, 0, 0.62, -1.55, 2.0, 0.5, 0.12, '#dba88a');
    box(g, 0, 0.42, -0.4, 1.1, 0.06, 0.5, '#e5cdb1'); for (const a of [-0.45, 0.45]) box(g, a, 0.2, -0.4, 0.06, 0.4, 0.4, '#d6c2a8');
    cyl(g, -0.25, 0.5, -0.4, 0.07, 0.12, '#c1d4dc'); cyl(g, 0.2, 0.5, -0.4, 0.07, 0.12, '#f1c6b4');
    box(g, 1.5, 0.55, -1.3, 0.4, 1.1, 0.4, '#e8eef0'); cyl(g, 1.5, 1.25, -1.3, 0.14, 0.3, '#bcd8e4');
  }
  if (r.id === 'locker') {
    for (const x of [-0.9, 0, 0.9]) { cupboard(g, x, -1.4, 0.8, 1.6); box(g, x, 1.15, -1.15, 0.1, 0.2, 0.02, '#c4a27f'); }
    box(g, 0, 0.25, 0.2, 1.8, 0.1, 0.4, '#d3b794'); for (const x of [-0.7, 0.7]) box(g, x, 0.12, 0.2, 0.1, 0.24, 0.35, '#b9a184');
  }
}

export default {
  ...hospital, // 이름, 그림 글자, 일터 색은 병원 그대로
  floor: 'lobby',
  quiet: ['lounge', 'locker', 'support', 'waste'], // 기다리는 사람이 따라오지 않는 곳
  rooms,
  sets: {},
  nav: {
    bounds: [-8.6, 8.6, -5.0, 6.9],
    frame: { cx: 0, cz: 0.4, w: 17.8, d: 12.6, top: 2.6, yaw: 0.25, tilt: [0.72, 1.05] },
    blocks: [
      [-8.0, -7.85, -5.3, -0.8], [0.0, 0.15, -5.3, -0.8], [4.0, 4.15, -5.3, -0.8], // 방 사이 벽
      [-7.55, -5.85, -4.75, -3.95], [-6.95, -6.45, -5.0, -4.75], // 로비: 안내 데스크와 안내 직원
      [-4.55, -0.65, -5.05, -4.55], [-4.55, -0.65, -4.05, -3.55], [-0.65, -0.25, -1.65, -1.25], // 로비: 대기 의자 두 줄, 화분
      [0.88, 2.03, -5.0, -2.85], [2.15, 2.65, -4.85, -4.35], [3.25, 3.65, -5.0, -4.6], // 108호: 침대, 협탁, 화분
      [6.9, 7.6, -4.75, -3.9], [4.15, 4.4, -4.75, -2.55], // 엘리베이터 앞: 휠체어 보관대, 손잡이 난간
      [-7.25, -3.95, 1.55, 2.05], [-6.45, -5.75, 2.4, 2.9], [-5.1, -4.5, 2.4, 2.95], [-6.85, -6.35, 3.15, 3.65], // 환경관리실: 선반, 수레, 양동이, 동료
      [-2.15, 0.95, 1.75, 2.45], // 폐기물 보관실: 수거함 넷
      [2.0, 4.0, 1.6, 2.2], [2.45, 3.55, 2.55, 3.05], [4.3, 4.7, 1.7, 2.1], // 휴게실
      [5.4, 8.2, 1.55, 2.05], [5.9, 7.7, 3.2, 3.6], // 탈의실
      ...rooms.filter((r) => r.open).map((r) => { const c = r.x + (r.labelRight ? r.w / 2 - 1.0 : -r.w / 2 + 1.0); return [c - 0.9, c + 0.9, 4.86, 4.94]; }), // 앞쪽 방의 이름표
      [-8.4, -8.2, 0.4, 0.6], [-8.1, -7.5, 5.3, 5.9], [4.9, 5.5, 5.3, 5.9], // 간판, 화분
    ],
    spots: {
      door: { x: -6.5, z: 6.0, name: '직원 출입구' },
      lobby: { x: -3.0, z: -2.0, name: '로비' },
      r108: { x: 2.55, z: -2.0, name: '108호 병실' },
      elev: { x: 5.4, z: -2.0, name: '엘리베이터 앞' },
      support: { x: -5.45, z: 3.65, name: '환경관리실' },
      waste: { x: 0.25, z: 4.15, name: '폐기물 보관실' },
      lounge: { x: 3.85, z: 4.0, name: '휴게실' },
      locker: { x: 5.95, z: 4.3, name: '탈의실' },
    },
    start: 'door', depart: 'door',
  },
  start: [-6.5, 0, 6.2],
  exit: [6.5, 0, 6.2],
  build(scene) {
    const people = [];
    const floor = new T.Group(); scene.add(floor);
    box(floor, 0, -0.6, 0, 17.8, 0.65, 12, '#c9baa6'); box(floor, 0, -0.22, 0, 18, 0.18, 12.2, '#ede5d6'); box(floor, 0, -0.08, 0, 17.6, 0.1, 11.8, '#fff7e8');
    box(floor, 0, 0.008, 0.35, 16.9, 0.012, 2.0, '#efd9bf'); for (let x = -7.5; x <= 7.5; x += 0.7) box(floor, x, 0.02, 0.35, 0.27, 0.012, 0.04, '#fff8eb'); // 복도
    rooms.forEach((r, i) => {
      const g = new T.Group(); g.position.set(r.x, 0, r.z); scene.add(g);
      box(g, 0, 0.025, 0, r.w, 0.05, r.d, r.open ? '#f4efe6' : '#f2eee6');
      if (r.open) label(g, r.sign, r.labelRight ? r.w / 2 - 1.0 : -r.w / 2 + 1.0, 0.9, r.d / 2 - 0.1, 1.8, 0.46, '#5c6a6d', '#faf4e8');
      else {
        const h = 2.7, back = -r.d / 2 + 0.1;
        box(g, 0, h / 2, back, r.w + 0.13, h, 0.14, '#f1e6d6'); box(g, 0, 0.24, back + 0.1, r.w + 0.05, 0.42, 0.045, r.color);
        box(g, -r.w / 2 - 0.005, 0.65, 0, 0.12, 1.3, r.d - 0.2, '#e6dac8');
        label(g, r.sign, 0.35, h - 0.45, back + 0.095, 2.4, 0.5, '#5c6a6d', '#faf4e8');
      }
      furnish(g, r);
      if (r.staff) { const [nx, nz] = r.npc; const npc = person({ ...r.staff, seed: i + 1 }); npc.root.position.set(r.x + nx, 0, r.z + nz); npc.root.rotation.y = -0.3; scene.add(npc.root); people.push(npc); }
    });
    const desk = person({ coat: '#d8b581', outfit: 'vest', hair: 2, seed: 5 }); desk.root.position.set(-6.7, 0, -4.9); scene.add(desk.root); people.push(desk); // 안내 데스크 직원
    box(scene, 0, -0.16, 6.2, 16, 0.18, 1.9, '#e6d9c2');
    for (let x = -5; x < 6; x += 0.65) box(scene, x, -0.06, 6.2, 0.33, 0.015, 0.08, '#fff3df');
    for (const x of [-6.5, 6.5]) plant(scene, x - 1.3, 5.6, 1.1);
    label(scene, '직원 출입구', -6.5, 2.6, 5.5, 1.6, 0.4); label(scene, '퇴근길', 6.5, 2.6, 5.5, 1.6, 0.4);
    const sign = new T.Group(); sign.position.set(-8.3, 0, 0.5); scene.add(sign);
    cyl(sign, 0, 1, 0, 0.04, 2, '#b9b2a5'); label(sign, '모아 병원 1층', 0, 2, 0, 2.6, 0.6, '#f8eee0', '#36546b');
    return { people };
  },
};
