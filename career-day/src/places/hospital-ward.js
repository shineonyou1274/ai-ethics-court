// 모아 병원 7층 병동: 간호사가 하루를 걸어 다니는 층 (카페 방식, shared/DESIGN.md §2-3).
// 병원(hospital.js)의 다른 일곱 직업은 그대로 병원 전체 모형에서 장면이 차례로 열린다. 이 층은 간호사(job.floor: 'ward')만 쓴다.
// 기록의 일터는 그대로 'hospital' 이다 (places/index.js 의 placeOf).
// 뒤쪽 줄: 병실 셋(701·702·703)과 약품·물품실. 앞쪽 줄: 간호 스테이션, 회의실, 휴게실, 탈의실. 가운데가 복도다.
// 이름과 모습은 모두 가상이고, 실제 병동을 단순하게 줄였다.
import * as T from 'three';
import { box, cyl, ball, label, plant, chair, monitor, bed, cupboard, person } from '../world/kit.js';
import hospital from './hospital.js';

const SKIN = ['#e6bfa1', '#f1d4b7', '#cba68c'], HAIR = '#66534a';
const rooms = [
  { id: 'r701', sign: '701호 병실', name: '701호', x: -6.0, z: -3.05, w: 3.85, d: 4.7, color: '#b7cddd', patient: { skin: 1, hair: '#9a948c' } },
  { id: 'r702', sign: '702호 병실', name: '702호', x: -2.0, z: -3.05, w: 3.85, d: 4.7, color: '#e7b4a4', patient: { skin: 0, hair: HAIR, monitor: true } },
  { id: 'r703', sign: '703호 병실', name: '703호', x: 2.0, z: -3.05, w: 3.85, d: 4.7, color: '#c2bbd7' }, // 오늘 아침 퇴원한 자리
  { id: 'supply', sign: '약품·물품실', name: '약품·물품실', x: 6.0, z: -3.05, w: 3.85, d: 4.7, color: '#b7c5c8' },
  { id: 'station', sign: '간호 스테이션', name: '간호 스테이션', x: -5.2, z: 3.2, w: 4.6, d: 3.6, color: '#e7b4a4', open: true, staff: { coat: '#e8b1a1', outfit: 'scrub', hair: 2 }, npc: [-1.4, 0.2] },
  { id: 'meeting', sign: '회의실', name: '회의실', x: -0.6, z: 3.2, w: 3.6, d: 3.6, color: '#b7cddd', open: true, staff: { coat: '#f7f8f3', outfit: 'white', hair: 0 }, npc: [-1.3, 0.35] },
  { id: 'lounge', sign: '휴게실', name: '휴게실', x: 3.0, z: 3.2, w: 3.6, d: 3.6, color: '#d9b4a6', open: true },
  { id: 'locker', sign: '탈의실', name: '탈의실', x: 6.8, z: 3.2, w: 3.0, d: 3.6, color: '#c4c8a8', open: true },
];

// 누워 있는 환자: 베개 위 머리와 이불 밖으로 나온 팔 (침대는 kit 의 bed, 머리 쪽이 -z)
function patientIn(g, x, z, p) {
  ball(g, x, 1.0, z - 0.6, 0.2, SKIN[p.skin], [0.95, 0.85, 1.05]); ball(g, x, 1.05, z - 0.68, 0.205, p.hair, [1, 0.7, 1]);
  box(g, x, 0.95, z + 0.15, 0.95, 0.1, 1.2, '#c9dbe5'); // 덮은 이불 (몸의 볼록함)
  const arm = cyl(g, x + 0.33, 0.98, z - 0.05, 0.06, 0.6, SKIN[p.skin]); arm.rotation.x = Math.PI / 2;
  cyl(g, x + 0.33, 0.98, z + 0.18, 0.068, 0.07, '#f6efe0').rotation.x = Math.PI / 2; // 팔찌
}

function furnish(g, r) {
  if (r.id.startsWith('r7')) {
    const bx = -0.55, bz = -0.85;
    bed(g, bx, bz);
    box(g, bx + 0.95, 0.38, bz - 0.7, 0.5, 0.76, 0.45, '#efe4d4'); box(g, bx + 0.95, 0.78, bz - 0.7, 0.54, 0.04, 0.5, '#e2d3bf'); // 침대 옆 협탁
    box(g, 0.4, 1.95, -2.15, 1.5, 0.05, 0.05, '#c9c2b4'); // 커튼 레일
    if (r.patient) patientIn(g, bx, bz, r.patient);
    else box(g, bx, 0.94, bz + 0.15, 0.9, 0.06, 1.3, '#bcd3df'); // 퇴원하고 남은 쓴 시트
    if (r.patient?.monitor) { cyl(g, bx - 0.85, 0.85, bz - 0.85, 0.03, 1.7, '#a5afb1'); box(g, bx - 0.85, 1.6, bz - 0.8, 0.42, 0.32, 0.08, '#364e61'); box(g, bx - 0.85, 1.6, bz - 0.755, 0.34, 0.24, 0.01, '#bfe3d2'); } // 침대 옆 모니터
    plant(g, 1.45, -1.75, 0.65);
  }
  if (r.id === 'supply') {
    for (const x of [-0.9, 0.6]) { cupboard(g, x, -1.8, 1.3, 1.8); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) box(g, x - 0.4 + i * 0.4, 0.55 + j * 0.5, -1.53, 0.26, 0.2, 0.1, ['#cad5d2', '#dbc1ab', '#a9bfd1'][(i + j) % 3]); }
    box(g, 0.9, 0.42, -0.3, 0.9, 0.06, 0.6, '#d9cdb6'); box(g, 0.9, 0.82, -0.3, 0.9, 0.06, 0.6, '#d9cdb6'); for (const a of [-0.4, 0.4]) for (const b of [-0.26, 0.26]) cyl(g, 0.9 + a, 0.42, -0.3 + b, 0.02, 0.84, '#a9a294'); // 물품 수레
    box(g, 0.9, 0.9, -0.3, 0.55, 0.1, 0.4, '#ffffff');
  }
  if (r.id === 'station') {
    box(g, -0.4, 0.5, -1.2, 3.2, 1.0, 0.55, '#e5b4a3'); box(g, -0.4, 1.02, -1.2, 3.3, 0.05, 0.62, '#f3ddd2'); // 앞을 보는 긴 데스크
    monitor(g, -1.2, -1.2); monitor(g, 0.2, -1.2); box(g, -0.5, 1.1, -1.15, 0.36, 0.1, 0.26, '#fffaf2'); // 기록지
    box(g, 0.9, 1.2, -1.2, 0.3, 0.3, 0.2, '#f2c94c'); ball(g, 0.9, 1.25, -1.09, 0.06, '#e2513a', [1, 1, 0.4]); // 호출 벨 알림판
    chair(g, -0.9, -0.55, '#e7b4a4', Math.PI); chair(g, 0.4, -0.55, '#e7b4a4', Math.PI);
  }
  if (r.id === 'meeting') {
    cyl(g, 0, 0.76, -0.5, 0.85, 0.08, '#d7b999'); cyl(g, 0, 0.38, -0.5, 0.14, 0.72, '#dfd3c3');
    for (const [x, z, a] of [[-1.15, -0.5, Math.PI / 2], [1.15, -0.5, -Math.PI / 2], [0, -1.35, 0]]) chair(g, x, z, '#b4c9d5', a);
    box(g, 0.2, 0.82, -0.45, 0.4, 0.02, 0.3, '#fff9ee');
  }
  if (r.id === 'lounge') {
    box(g, 0, 0.25, -1.3, 2.0, 0.5, 0.6, '#e3b79a'); box(g, 0, 0.62, -1.55, 2.0, 0.5, 0.12, '#dba88a'); // 소파
    box(g, 0, 0.42, -0.4, 1.1, 0.06, 0.5, '#e5cdb1'); for (const a of [-0.45, 0.45]) box(g, a, 0.2, -0.4, 0.06, 0.4, 0.4, '#d6c2a8'); // 낮은 탁자
    cyl(g, -0.25, 0.5, -0.4, 0.07, 0.12, '#c1d4dc'); cyl(g, 0.2, 0.5, -0.4, 0.07, 0.12, '#f1c6b4');
    box(g, 1.5, 0.55, -1.3, 0.4, 1.1, 0.4, '#e8eef0'); cyl(g, 1.5, 1.25, -1.3, 0.14, 0.3, '#bcd8e4'); // 물 마시는 곳
  }
  if (r.id === 'locker') {
    for (const x of [-0.9, 0, 0.9]) { cupboard(g, x, -1.4, 0.8, 1.6); box(g, x, 1.15, -1.15, 0.1, 0.2, 0.02, '#c4a27f'); }
    box(g, 0, 0.25, 0.2, 1.8, 0.1, 0.4, '#d3b794'); for (const x of [-0.7, 0.7]) box(g, x, 0.12, 0.2, 0.1, 0.24, 0.35, '#b9a184'); // 긴 의자
  }
}

export default {
  ...hospital, // 이름, 그림 글자, 일터 색은 병원 그대로
  floor: 'ward',
  quiet: ['lounge', 'locker', 'meeting'], // 기다리는 사람이 따라오지 않는 곳
  rooms,
  sets: {}, // 병동은 모든 장면이 이 층 안에서 열린다 (따로 지은 방이 없다)
  // 걸어 다니기 (src/flow.js). 좌표는 위 모형과 같다. 막힌 곳은 벽, 침대, 가구, 이름표다.
  nav: {
    bounds: [-8.6, 8.6, -5.0, 6.9],
    frame: { cx: 0, cz: 0.4, w: 17.8, d: 12.6, top: 2.6, yaw: 0.25, tilt: [0.72, 1.05] },
    blocks: [
      [-8.0, -7.85, -5.3, -0.8], [-4.0, -3.85, -5.3, -0.8], [0.0, 0.15, -5.3, -0.8], [4.0, 4.15, -5.3, -0.8], // 병실 사이 벽
      ...[-6.0, -2.0, 2.0].flatMap((rx) => [[rx - 1.12, rx + 0.03, -5.0, -2.85], [rx + 0.15, rx + 0.65, -4.85, -4.35], [rx + 1.25, rx + 1.65, -5.0, -4.6]]), // 병실: 침대, 협탁, 화분
      [-3.5, -3.3, -4.95, -4.55], // 702호 모니터
      [4.45, 7.25, -5.3, -4.6], [6.45, 7.35, -3.65, -3.05], // 약품·물품실: 선반, 수레
      [-7.25, -3.95, 1.69, 2.31], [-6.45, -5.75, 2.35, 2.95], [-5.15, -4.45, 2.35, 2.95], [-6.85, -6.35, 3.15, 3.65], // 간호 스테이션: 데스크, 의자 둘, 동료
      [-2.1, 0.9, 1.5, 3.55], [-2.15, -1.65, 3.3, 3.8], // 회의실: 탁자와 의자, 의사
      [2.0, 4.0, 1.6, 2.2], [2.45, 3.55, 2.55, 3.05], [4.3, 4.7, 1.7, 2.1], // 휴게실: 소파, 탁자, 물 마시는 곳
      [5.4, 8.2, 1.55, 2.05], [5.9, 7.7, 3.2, 3.6], // 탈의실: 사물함, 긴 의자
      ...rooms.filter((r) => r.open).map((r) => [r.x - r.w / 2 + 0.1, r.x - r.w / 2 + 1.9, 4.86, 4.94]), // 앞쪽 방의 이름표
      [-8.3, -8.1, 4.5, 4.7], [-8.1, -7.5, 5.3, 5.9], [4.9, 5.5, 5.3, 5.9], // 간판, 화분
    ],
    spots: {
      door: { x: -6.5, z: 6.0, name: '직원 출입구' },
      r701: { x: -5.45, z: -2.0, name: '701호 병실' },
      r702: { x: -1.45, z: -2.0, name: '702호 병실' },
      r703: { x: 2.55, z: -2.0, name: '703호 병실' },
      supply: { x: 5.4, z: -2.0, name: '약품·물품실' },
      station: { x: -5.45, z: 3.65, name: '간호 스테이션' },
      meeting: { x: 0.25, z: 4.15, name: '회의실' },
      lounge: { x: 3.85, z: 4.0, name: '휴게실' },
      locker: { x: 7.75, z: 4.3, name: '탈의실' },
    },
    start: 'door', depart: 'door',
  },
  start: [-6.5, 0, 6.2], // 직원 출입구
  exit: [6.5, 0, 6.2], // 퇴근길
  build(scene) {
    const people = [];
    const floor = new T.Group(); scene.add(floor);
    box(floor, 0, -0.6, 0, 17.8, 0.65, 12, '#c9baa6'); box(floor, 0, -0.22, 0, 18, 0.18, 12.2, '#ede5d6'); box(floor, 0, -0.08, 0, 17.6, 0.1, 11.8, '#fff7e8');
    box(floor, 0, 0.008, 0.35, 16.9, 0.012, 2.0, '#efd4bf'); for (let x = -7.5; x <= 7.5; x += 0.7) box(floor, x, 0.02, 0.35, 0.27, 0.012, 0.04, '#fff8eb'); // 복도
    rooms.forEach((r, i) => {
      const g = new T.Group(); g.position.set(r.x, 0, r.z); scene.add(g);
      box(g, 0, 0.025, 0, r.w, 0.05, r.d, r.open ? '#f4efe6' : '#f2eee6');
      if (r.open) label(g, r.sign, -r.w / 2 + 1.0, 0.9, r.d / 2 - 0.1, 1.8, 0.46, '#5c6a6d', '#faf4e8');
      else {
        const h = 2.7, back = -r.d / 2 + 0.1;
        box(g, 0, h / 2, back, r.w + 0.13, h, 0.14, '#f1e6d6'); box(g, 0, 0.24, back + 0.1, r.w + 0.05, 0.42, 0.045, r.color);
        box(g, -r.w / 2 - 0.005, 0.65, 0, 0.12, 1.3, r.d - 0.2, '#e6dac8');
        label(g, r.sign, 0.35, h - 0.45, back + 0.095, 2.4, 0.5, '#5c6a6d', '#faf4e8');
      }
      furnish(g, r);
      if (r.staff) { const [nx, nz] = r.npc; const npc = person({ ...r.staff, seed: i + 1 }); npc.root.position.set(r.x + nx, 0, r.z + nz); npc.root.rotation.y = -0.3; scene.add(npc.root); people.push(npc); }
    });
    box(scene, 0, -0.16, 6.2, 16, 0.18, 1.9, '#e6d9c2');
    for (let x = -5; x < 6; x += 0.65) box(scene, x, -0.06, 6.2, 0.33, 0.015, 0.08, '#fff3df');
    for (const x of [-6.5, 6.5]) plant(scene, x - 1.3, 5.6, 1.1);
    label(scene, '직원 출입구', -6.5, 2.6, 5.5, 1.6, 0.4); label(scene, '퇴근길', 6.5, 2.6, 5.5, 1.6, 0.4);
    const sign = new T.Group(); sign.position.set(-8.2, 0, 4.6); scene.add(sign);
    cyl(sign, 0, 1, 0, 0.04, 2, '#b9b2a5'); label(sign, '모아 병원 7층 병동', 0, 2, 0, 2.6, 0.6, '#f8eee0', '#36546b');
    return { people };
  },
};
