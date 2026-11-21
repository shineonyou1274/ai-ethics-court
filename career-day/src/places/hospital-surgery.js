// 모아 병원 5층 외과 병동·수술실: 의사가 하루를 걸어 다니는 층 (카페 방식, shared/DESIGN.md §2-3).
// 의사(job.floor: 'surgery')만 쓴다. 기록의 일터는 그대로 'hospital' 이다 (places/index.js 의 placeOf).
// 뒤쪽 줄: 501호 병실(세 분이 쓰는 방), 면담실, 수술 준비실, 수술실. 앞쪽 줄: 의사실, 회의실, 휴게실, 탈의실. 가운데가 복도다.
// 이름과 모습은 모두 가상이고, 실제 병동과 수술실을 아주 단순하게 줄였다.
import * as T from 'three';
import { box, cyl, ball, label, plant, chair, desk, monitor, bed, cupboard, person } from '../world/kit.js';
import hospital from './hospital.js';

const SKIN = ['#e6bfa1', '#f1d4b7', '#cba68c'];
const rooms = [
  { id: 'r501', sign: '501호 병실', name: '501호', x: -6.0, z: -3.05, w: 3.85, d: 4.7, color: '#b7cddd' }, // 하늘 님이 계신 세 분 병실
  { id: 'consult', sign: '면담실', name: '면담실', x: -2.0, z: -3.05, w: 3.85, d: 4.7, color: '#e5c18e' },
  { id: 'scrub', sign: '수술 준비실', name: '수술 준비실', x: 2.0, z: -3.05, w: 3.85, d: 4.7, color: '#a6c5d1' },
  { id: 'theatre', sign: '수술실', name: '수술실', x: 6.0, z: -3.05, w: 3.85, d: 4.7, color: '#9ebecf', dress: { coat: '#a6c5d1', outfit: 'surgery' } }, // 들어가면 수술복 (main.js 의 장면 옷)
  { id: 'office', sign: '의사실', name: '의사실', x: -5.2, z: 3.2, w: 4.6, d: 3.6, color: '#b7cddd', open: true, staff: { coat: '#f7f8f3', outfit: 'white', hair: 2 }, npc: [-1.4, 0.2] }, // 선배 의사
  { id: 'meeting', sign: '회의실', name: '회의실', x: -0.6, z: 3.2, w: 3.6, d: 3.6, color: '#e7b4a4', open: true, staff: { coat: '#e8b1a1', outfit: 'scrub', hair: 1 }, npc: [-1.3, 0.35] }, // 담당 간호사
  { id: 'lounge', sign: '휴게실', name: '휴게실', x: 3.0, z: 3.2, w: 3.6, d: 3.6, color: '#d9b4a6', open: true },
  { id: 'locker', sign: '탈의실', name: '탈의실', x: 6.8, z: 3.2, w: 3.0, d: 3.6, color: '#c4c8a8', open: true, labelRight: true },
];

function furnish(g, r) {
  if (r.id === 'r501') { // 침대 셋. 창가부터 1·2·3번, 하늘 님은 3번
    [-1.25, 0, 1.25].forEach((bx, i) => {
      bed(g, bx, -0.85);
      ball(g, bx, 1.0, -1.45, 0.19, SKIN[i], [0.95, 0.85, 1.05]); ball(g, bx, 1.05, -1.52, 0.195, ['#6b4f3a', '#2f2a28', '#8c8c8c'][i], [1, 0.7, 1]);
      box(g, bx, 0.95, -0.55, 0.8, 0.1, 1.0, '#c9dbe5');
    });
    plant(g, 1.55, 1.6, 0.65);
  }
  if (r.id === 'consult') {
    desk(g, 0, -0.75, 1.6); monitor(g, 0.35, -0.95); box(g, -0.3, 0.88, -0.65, 0.42, 0.02, 0.3, '#fffaf2'); // 설명 자료
    chair(g, 0, -1.55, '#b7cddd'); chair(g, -0.5, 0.15, '#e5c18e', Math.PI);
    box(g, 1.2, 1.5, -2.22, 0.9, 0.7, 0.03, '#fffaf0'); box(g, 1.2, 1.5, -2.2, 0.75, 0.55, 0.01, '#d6e6ea'); // 벽 그림
  }
  if (r.id === 'scrub') { // 손 씻는 개수대 둘과 멸균 가운 수레
    for (const x of [-0.75, 0.35]) { box(g, x, 0.45, -1.95, 0.9, 0.9, 0.55, '#d7e2e4'); box(g, x, 0.92, -1.95, 0.95, 0.05, 0.6, '#eef3f3'); cyl(g, x, 1.25, -2.12, 0.03, 0.5, '#a5afb1'); }
    box(g, 1.3, 0.45, -0.95, 0.75, 0.06, 0.6, '#d9cdb6'); box(g, 1.3, 0.85, -0.95, 0.75, 0.06, 0.6, '#d9cdb6'); for (const a of [-0.32, 0.32]) for (const b of [-0.25, 0.25]) cyl(g, 1.3 + a, 0.45, -0.95 + b, 0.02, 0.84, '#a9a294');
    box(g, 1.3, 0.93, -0.95, 0.5, 0.1, 0.4, '#8fb3c9');
  }
  if (r.id === 'theatre') { // 수술대, 수술등, 모니터
    box(g, -0.3, 0.45, -0.95, 0.7, 0.9, 1.9, '#c5d7df'); box(g, -0.3, 0.93, -0.95, 0.75, 0.06, 2.0, '#9dbfce');
    cyl(g, -0.3, 2.45, -0.95, 0.45, 0.12, '#e5eadf'); for (const x of [-0.5, -0.3, -0.1]) ball(g, x, 2.37, -0.95, 0.08, '#fff5cc'); cyl(g, -0.3, 2.62, -0.95, 0.03, 0.3, '#b7c2c0');
    cyl(g, 1.15, 0.75, -1.75, 0.035, 1.5, '#a5afb1'); box(g, 1.15, 1.55, -1.7, 0.5, 0.36, 0.08, '#364e61'); box(g, 1.15, 1.55, -1.655, 0.42, 0.28, 0.01, '#bfe3d2');
  }
  if (r.id === 'office') {
    box(g, -0.4, 0.5, -1.2, 3.2, 1.0, 0.55, '#d6e2ea'); box(g, -0.4, 1.02, -1.2, 3.3, 0.05, 0.62, '#eef3f6'); // 긴 책상
    monitor(g, -1.2, -1.2); monitor(g, 0.2, -1.2); box(g, -0.5, 1.1, -1.15, 0.36, 0.1, 0.26, '#fffaf2');
    chair(g, -0.9, -0.55, '#b7cddd', Math.PI); chair(g, 0.4, -0.55, '#b7cddd', Math.PI);
  }
  if (r.id === 'meeting') {
    cyl(g, 0, 0.76, -0.5, 0.85, 0.08, '#d7b999'); cyl(g, 0, 0.38, -0.5, 0.14, 0.72, '#dfd3c3');
    for (const [x, z, a] of [[-1.15, -0.5, Math.PI / 2], [1.15, -0.5, -Math.PI / 2], [0, -1.35, 0]]) chair(g, x, z, '#b4c9d5', a);
    box(g, 0.2, 0.82, -0.45, 0.4, 0.02, 0.3, '#fff9ee');
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
  floor: 'surgery',
  quiet: ['lounge', 'locker', 'meeting', 'theatre', 'scrub'], // 기다리는 사람이 따라오지 않는 곳
  rooms,
  sets: {}, // 모든 장면이 이 층 안에서 열린다
  nav: {
    bounds: [-8.6, 8.6, -5.0, 6.9],
    frame: { cx: 0, cz: 0.4, w: 17.8, d: 12.6, top: 2.6, yaw: 0.25, tilt: [0.72, 1.05] },
    blocks: [
      [-8.0, -7.85, -5.3, -0.8], [-4.0, -3.85, -5.3, -0.8], [0.0, 0.15, -5.3, -0.8], [4.0, 4.15, -5.3, -0.8], // 방 사이 벽
      [-7.85, -4.15, -5.0, -2.85], [-4.75, -4.15, -1.75, -1.15], // 501호: 침대 셋, 화분
      [-2.9, -1.1, -4.85, -3.35], [-2.35, -1.65, -4.95, -4.25], [-2.85, -2.15, -3.25, -2.55], // 면담실: 책상, 의자 둘
      [0.8, 2.9, -5.0, -4.65], [2.95, 3.7, -4.3, -3.7], // 수술 준비실: 개수대, 가운 수레
      [5.3, 6.1, -5.0, -2.95], [6.85, 7.45, -5.0, -4.5], [6.95, 7.45, -3.7, -3.2], // 수술실: 수술대, 모니터, 간호사
      [-7.25, -3.95, 1.69, 2.31], [-6.45, -5.75, 2.35, 2.95], [-5.15, -4.45, 2.35, 2.95], [-6.85, -6.35, 3.15, 3.65], // 의사실: 책상, 의자 둘, 선배
      [-2.1, 0.9, 1.5, 3.55], [-2.15, -1.65, 3.3, 3.8], // 회의실: 탁자와 의자, 간호사
      [2.0, 4.0, 1.6, 2.2], [2.45, 3.55, 2.55, 3.05], [4.3, 4.7, 1.7, 2.1], // 휴게실
      [5.4, 8.2, 1.55, 2.05], [5.9, 7.7, 3.2, 3.6], // 탈의실
      ...rooms.filter((r) => r.open).map((r) => { const c = r.x + (r.labelRight ? r.w / 2 - 1.0 : -r.w / 2 + 1.0); return [c - 0.9, c + 0.9, 4.86, 4.94]; }), // 앞쪽 방의 이름표
      [-8.4, -8.2, 0.4, 0.6], [-8.1, -7.5, 5.3, 5.9], [4.9, 5.5, 5.3, 5.9], // 간판, 화분
    ],
    spots: {
      door: { x: -6.5, z: 6.0, name: '직원 출입구' },
      r501: { x: -5.45, z: -2.0, name: '501호 병실' },
      consult: { x: -1.45, z: -2.0, name: '면담실' },
      scrub: { x: 2.55, z: -2.0, name: '수술 준비실' },
      theatre: { x: 6.55, z: -2.0, name: '수술실' },
      office: { x: -5.45, z: 3.65, name: '의사실' },
      meeting: { x: 0.25, z: 4.15, name: '회의실' },
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
    box(floor, 0, 0.008, 0.35, 16.9, 0.012, 2.0, '#dbe4e6'); for (let x = -7.5; x <= 7.5; x += 0.7) box(floor, x, 0.02, 0.35, 0.27, 0.012, 0.04, '#f4f8f8'); // 복도
    rooms.forEach((r, i) => {
      const g = new T.Group(); g.position.set(r.x, 0, r.z); scene.add(g);
      box(g, 0, 0.025, 0, r.w, 0.05, r.d, r.id === 'theatre' || r.id === 'scrub' ? '#e6eef0' : r.open ? '#f4efe6' : '#f2eee6');
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
    const sur = person({ coat: '#a6c5d1', outfit: 'surgery', seed: 4 }); sur.root.position.set(7.2, 0, -3.45); sur.root.rotation.y = -0.6; scene.add(sur.root); people.push(sur); // 수술실 간호사
    box(scene, 0, -0.16, 6.2, 16, 0.18, 1.9, '#e6d9c2');
    for (let x = -5; x < 6; x += 0.65) box(scene, x, -0.06, 6.2, 0.33, 0.015, 0.08, '#fff3df');
    for (const x of [-6.5, 6.5]) plant(scene, x - 1.3, 5.6, 1.1);
    label(scene, '직원 출입구', -6.5, 2.6, 5.5, 1.6, 0.4); label(scene, '퇴근길', 6.5, 2.6, 5.5, 1.6, 0.4);
    const sign = new T.Group(); sign.position.set(-8.3, 0, 0.5); scene.add(sign);
    cyl(sign, 0, 1, 0, 0.04, 2, '#b9b2a5'); label(sign, '모아 병원 5층 외과', 0, 2, 0, 2.6, 0.6, '#f8eee0', '#36546b');
    return { people };
  },
};
