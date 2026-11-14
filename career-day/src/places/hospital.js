// 일터: 모아 병원. 여덟 공간과 따로 지어 보여 주는 방(탈의실, 병동 등)으로 되어 있다.
// 새 일터를 만들 때는 이 파일을 본떠 rooms · build · sets 를 채우면 된다.
import * as T from 'three';
import { box, cyl, ball, tube, label, plant, chair, desk, monitor, bed, cupboard, person, mat } from '../world/kit.js';

const rooms = [
  { id: 'clinic', name: '진료실', x: -6, z: -3.5, color: '#b7cddd', tag: '01', staff: { coat: '#f7f8f3', outfit: 'white' } },
  { id: 'nurse', name: '간호 스테이션', x: -2, z: -3.5, color: '#e7b4a4', tag: '02', staff: { coat: '#e8b1a1', outfit: 'scrub', hair: 1 } },
  { id: 'lab', name: '진단검사실', x: 2, z: -3.5, color: '#c2bbd7', tag: '03', staff: { coat: '#c7bedc', outfit: 'scrub' } },
  { id: 'imaging', name: '영상검사실', x: 6, z: -3.5, color: '#9ebecf', tag: '04', staff: { coat: '#a9c6d9', outfit: 'scrub', hair: 2 } },
  { id: 'reception', name: '원무·안내', x: -6, z: 3.5, color: '#e5c18e', tag: '05', staff: { coat: '#d8b581', outfit: 'vest', hair: 2 } },
  { id: 'pharmacy', name: '약제실', x: -2, z: 3.5, color: '#b7c5c8', tag: '06', staff: { coat: '#f7f7f1', outfit: 'white', hair: 1 } },
  { id: 'rehab', name: '재활치료실', x: 2, z: 3.5, color: '#d9b4a6', tag: '07', staff: { coat: '#d9aa98', outfit: 'scrub' } },
  { id: 'support', name: '환경관리실', x: 6, z: 3.5, color: '#c4c8a8', tag: '08', staff: { coat: '#b8bca1', outfit: 'vest' } },
];

function furnish(g, r) {
  if (r.id === 'clinic') { desk(g, -0.2, -0.4); monitor(g, -0.15, -0.55); chair(g, -0.2, -1.35, r.color); chair(g, -0.2, 0.6, '#d9b696', Math.PI); cupboard(g, 1.15, -1.85, 0.8); plant(g, 1.25, 1.4, 0.8); }
  if (r.id === 'nurse') { desk(g, 0, -0.15, 2.5, '#e5b4a3'); monitor(g, -0.6, -0.3); chair(g, -0.4, -1.15, r.color); cupboard(g, 0.7, -1.8, 1.7, 1.3); for (let i = 0; i < 3; i++) box(g, 0.15 + i * 0.35, 1.45, -1.75, 0.22, 0.24, 0.18, ['#cad5d2', '#dbc1ab', '#a9bfd1'][i]); box(g, 0.45, 0.9, 0.1, 0.55, 0.035, 0.38, '#fffaf2'); }
  if (r.id === 'lab') { desk(g, 0, -0.8, 3.1, '#d8d1e3'); cupboard(g, 1.1, -1.8, 1.1, 1.6); for (let i = 0; i < 4; i++) { cyl(g, -1 + i * 0.2, 1.05, -0.65, 0.045, 0.3, '#d3e1e3'); cyl(g, -1 + i * 0.2, 1.23, -0.65, 0.05, 0.04, r.color); } cyl(g, 0.3, 1.02, -0.7, 0.15, 0.2, '#e9e9e2'); chair(g, -0.5, 0.6, r.color); }
  if (r.id === 'imaging') { const ring = new T.Mesh(new T.TorusGeometry(0.85, 0.28, 12, 32), mat('#f7f7ef')); ring.position.set(0, 1.16, -0.5); ring.castShadow = true; g.add(ring); box(g, 0, 0.44, -0.5, 1.7, 0.8, 0.65, '#d3dfe1'); box(g, 0, 0.72, 0.9, 0.68, 0.18, 2.2, '#c5d7df'); box(g, 0, 0.39, 1, 0.3, 0.65, 0.6, '#e8ece5'); }
  if (r.id === 'reception') { desk(g, 0, 0, 2.9, '#dfbd8c'); box(g, 0, 0.5, 0.3, 2.8, 0.9, 0.12, '#e9cfa9'); monitor(g, -0.5, -0.1); chair(g, -0.5, -1, r.color); label(g, '안녕하세요', 0.55, 1.15, 0.37, 1, 0.3); plant(g, 1.4, 1.3, 0.8); }
  if (r.id === 'pharmacy') { for (const x of [-0.8, 0.8]) { cupboard(g, x, -1.8, 1.4, 1.65); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) box(g, x - 0.45 + i * 0.3, 0.52 + j * 0.55, -1.51, 0.18, 0.23, 0.13, (i + j) % 2 ? '#c1ced0' : '#e5c9b0'); } desk(g, 0, 0.3, 2.5); monitor(g, -0.7, 0.18); }
  if (r.id === 'rehab') { bed(g, -0.8, -0.2); for (const x of [0.5, 1.3]) { cyl(g, x, 0.55, 0.5, 0.03, 1.1, '#a6aaa4'); cyl(g, x, 0.55, -0.8, 0.03, 1.1, '#a6aaa4'); const rail = cyl(g, x, 1.1, -0.15, 0.045, 1.4, '#c9ac85'); rail.rotation.x = Math.PI / 2; } ball(g, 1.1, 0.4, 1.3, 0.38, '#d6b1a2'); box(g, 1, 0.04, 0.4, 1.2, 0.06, 2.2, '#c4d3d4'); }
  if (r.id === 'support') { cupboard(g, -0.8, -1.8, 1.4, 1.8); box(g, 0.5, 0.4, 0.2, 0.9, 0.7, 0.6, '#b7c0ae'); box(g, 0.5, 0.8, 0.2, 1.0, 0.08, 0.7, '#d9d5c3'); cyl(g, 0.35, 0.98, 0.2, 0.11, 0.3, '#d7b698'); cyl(g, 0.65, 1.03, 0.2, 0.1, 0.4, '#a5c0d0'); tube(g, [[0.9, 0.6, 0.2], [1.1, 1.1, 0.2], [0.9, 1.2, 0.2]], 0.035, '#73817b'); }
}

// 따로 지어 보여 주는 방. 장면의 place 값이 이 이름이면 병원 위쪽에 무대를 세운다.
const sets = {
  locker: { title: '직원 탈의실', build(g) { for (const x of [-1.8, -0.9, 0, 0.9]) { cupboard(g, x, -1.8, 0.75, 1.6); box(g, x, 1.15, -1.55, 0.1, 0.2, 0.02, '#c4a27f'); } desk(g, -0.8, 0.5, 2.3, '#d3b794'); box(g, -1.5, 0.99, 0.5, 0.45, 0.4, 0.25, '#ca907b'); plant(g, 2, 1.5, 0.9); } },
  ward: { title: '병동', build(g) { bed(g, -0.6, -0.25); ball(g, -0.6, 1.12, -0.9, 0.22, '#edc7aa'); ball(g, -0.6, 1.2, -0.97, 0.22, '#66534a', [1, 0.6, 1]); chair(g, 1.4, -0.6, '#adc7d8'); desk(g, 1.7, -1.5, 0.8); plant(g, -2.1, 1.4, 0.8); } },
  meeting: { title: '함께 맞추는 하루', build(g) { cyl(g, 0, 0.78, -0.3, 1.3, 0.12, '#d7b999'); cyl(g, 0, 0.4, -0.3, 0.15, 0.7, '#dfd3c3'); for (const x of [-1.5, 1.5]) { chair(g, x, -0.4, '#b4c9d5', x > 0 ? -Math.PI / 2 : Math.PI / 2); box(g, x * 0.4, 0.86, -0.3, 0.4, 0.03, 0.3, '#fff9ee'); } plant(g, 2, -1.5, 0.9); } },
  // dress: 이 방에 들어가면 내 캐릭터가 갈아입는 옷
  theatre: { title: '수술팀의 시간', dress: { coat: '#a6c5d1', outfit: 'surgery' }, build(g) { bed(g, -0.5, 0); box(g, -0.5, 0.97, 0.2, 1.08, 0.11, 1.4, '#9dbfce'); ball(g, -0.5, 1.08, -0.65, 0.21, '#e9c4a8'); cyl(g, -1.8, 1.8, -1, 0.05, 3.6, '#b7c2c0'); box(g, -0.7, 3.5, -1, 2.2, 0.08, 0.08, '#b7c2c0'); cyl(g, 0.3, 3.38, -1, 0.5, 0.14, '#e5eadf'); for (const x of [-0.15, 0.25, 0.65]) ball(g, x, 3.29, -1, 0.1, '#fff5cc'); desk(g, 1.7, -1.5, 0.9); monitor(g, 1.7, -1.6); const staff = person({ coat: '#a6c5d1', seed: 1, outfit: 'surgery' }); staff.root.position.set(-1.5, 0, 0); staff.root.rotation.y = 1.2; g.add(staff.root); } },
  lounge: { title: '잠깐, 쉬어 가요', build(g) { for (const x of [-1, 0, 1]) chair(g, x, -1.1, '#d6b39b'); desk(g, 0, 0.2, 1.8); cyl(g, -0.4, 0.97, 0.2, 0.09, 0.2, '#c1d4dc'); cyl(g, 0.4, 0.97, 0.2, 0.09, 0.2, '#f1c6b4'); plant(g, -2, 1.5, 1.1); } },
};

export default {
  id: 'hospital',
  name: '모아 병원',
  rooms,
  sets,
  start: [-4, 0, 7.5], // 직원 출입구
  exit: [5, 0, 7.5], // 퇴근길
  build(scene) {
    const people = [];
    const floor = new T.Group(); scene.add(floor);
    box(floor, 0, -0.6, 0, 17.8, 0.65, 12, '#c9baa6'); box(floor, 0, -0.22, 0, 18, 0.18, 12.2, '#ede5d6');
    box(floor, 0, -0.08, 0, 17.6, 0.1, 11.8, '#fff7e8'); box(floor, 0, 0.005, 0, 16.9, 0.015, 1.75, '#efd4bf');
    for (let x = -7.5; x <= 7.5; x += 0.7) box(floor, x, 0.018, 0, 0.27, 0.012, 0.04, '#fff8eb');
    rooms.forEach((r, i) => {
      const g = new T.Group(); g.position.set(r.x, 0, r.z); scene.add(g);
      box(g, 0, 0.025, 0, 3.75, 0.05, 4.7, r.z < 0 ? '#f2eee6' : '#efece3');
      box(g, 0, 1.35, -2.25, 3.88, 2.7, 0.14, '#f1e6d6'); box(g, 0, 0.24, -2.15, 3.8, 0.42, 0.045, r.color);
      box(g, -1.88, 0.65, 0, 0.12, 1.3, 4.5, '#e6dac8'); box(g, -1.8, 0.64, 0, 0.02, 1.18, 4.4, '#f7efe3');
      label(g, r.tag + '  ' + r.name, 0, 2.11, -2.155, 2.9, 0.52, '#5c6a6d', '#faf4e8');
      furnish(g, r);
      const npc = person({ ...r.staff, seed: i + 1 }); npc.root.position.set(r.x + 0.65, 0, r.z + 0.7); npc.root.rotation.y = -0.3; scene.add(npc.root); people.push(npc);
    });
    box(scene, 0, -0.16, 7.4, 12, 0.18, 2.1, '#e6d9c2');
    for (let x = -5; x < 6; x += 0.65) box(scene, x, -0.06, 7.4, 0.33, 0.015, 0.08, '#fff3df');
    for (const x of [-5, 5]) { plant(scene, x, 6.6, 1.2); chair(scene, x, 7.5, '#c7b395'); }
    label(scene, '직원 출입구', -5, 1.9, 7.5, 1.5, 0.4); label(scene, '퇴근길', 5, 1.9, 7.5, 2, 0.4);
    for (const x of [-8.7, 8.7]) { plant(scene, x, 4.5, 1.3); plant(scene, x, -4.2, 1.15); }
    const sign = new T.Group(); sign.position.set(-7.6, 0, 6.5); scene.add(sign);
    cyl(sign, 0, 1, 0, 0.04, 2, '#b9b2a5'); label(sign, '모아 병원', 0, 2, 0, 2, 0.65, '#f8eee0', '#36546b');
    return { people };
  },
};
