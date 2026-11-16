// 일터: 다솜 소방서(119안전센터). 차고·사무실·장비 보관실·훈련장과, 따로 지어 보여 주는 곳(탈의실, 시장, 출동 현장 등)으로 되어 있다.
// 이름과 모습은 모두 가상이고, 실제 소방서를 단순하게 줄였다.
import * as T from 'three';
import { box, cyl, ball, tube, label, plant, chair, desk, monitor, cupboard, person } from '../world/kit.js';
import { truck, hydrant, hoseRoll, cone, coatOnHook, helmet, RED, CREAM, STEEL } from '../world/firekit.js';

const FIRE = { coat: '#eda06a', outfit: 'fire' }, TURNOUT = { coat: '#cdb98a', outfit: 'turnout' };

const rooms = [
  { id: 'garage', name: '차고', x: -4.2, z: -2.6, w: 7.6, d: 5.6, color: RED, tag: '01', staff: { ...FIRE, hair: 2 } },
  { id: 'office', name: '사무실', x: 1.7, z: -3.05, w: 3.75, d: 4.7, color: '#e5c18e', tag: '02', staff: { ...FIRE, hair: 1 } },
  { id: 'gear', name: '장비 보관실', x: 5.7, z: -3.05, w: 3.75, d: 4.7, color: '#b7c5c8', tag: '03', staff: { ...FIRE } },
  { id: 'yard', name: '훈련장', x: 3.7, z: 3.0, w: 7.4, d: 3.6, color: '#c4c8a8', tag: '04', open: true, staff: { ...TURNOUT, hair: 1 } },
];

function furnish(g, r) {
  if (r.id === 'garage') {
    for (const x of [-3.5, -0.1, 3.3]) box(g, x, 0.055, 0.1, 0.08, 0.012, 4.6, '#f2c94c'); // 주차 선
    truck(g, -1.8, -0.4, -Math.PI / 2); truck(g, 1.6, -0.4, -Math.PI / 2, 'ambulance');
    for (let i = 0; i < 3; i++) { const h = hoseRoll(); h.position.set(3.2, 0.03 + i * 0.14, -2.2); g.add(h); }
  }
  if (r.id === 'office') {
    desk(g, -0.2, -0.5, 2.3); monitor(g, -0.6, -0.65); chair(g, -0.4, -1.4, '#e5c18e'); box(g, 0.45, 0.92, -0.45, 0.3, 0.12, 0.2, '#4a4f57'); // 무전기
    box(g, 0.2, 1.55, -2.16, 2.2, 1.0, 0.04, '#fffaf0'); for (let i = 0; i < 5; i++) box(g, -0.6 + i * 0.4, 1.45 + (i % 2) * 0.2, -2.13, 0.3, 0.2, 0.01, ['#bcd8e4', '#f3d8a8', '#c9dcc0'][i % 3]); // 관내 지도
    ball(g, 1.4, 2.0, -2.1, 0.13, RED); cyl(g, 1.4, 1.86, -2.14, 0.15, 0.04, '#b8493a'); plant(g, 1.3, 1.5, 0.8);
  }
  if (r.id === 'gear') {
    for (let i = 0; i < 4; i++) { coatOnHook(g, -1.2 + i * 0.8, 1.15, -2.1); const h = helmet(); h.position.set(-1.2 + i * 0.8, 1.72, -2.0); g.add(h); }
    box(g, 0, 1.68, -2.05, 3.4, 0.05, 0.4, '#d9cdb6'); cupboard(g, 1.2, 0.6, 0.9, 1.3); box(g, -0.9, 0.3, 0.4, 1.4, 0.6, 0.5, STEEL);
    for (const x of [-1.3, -0.9, -0.5]) { cyl(g, x, 0.85, 0.4, 0.11, 0.5, '#f0cf6a'); ball(g, x, 1.1, 0.4, 0.11, '#f0cf6a', [1, 0.6, 1]); }
  }
  if (r.id === 'yard') {
    box(g, 2.6, 1.6, -0.8, 1.5, 3.2, 1.5, '#ddd6c8'); for (const y of [0.9, 2.2]) box(g, 2.6, y, -0.04, 0.7, 0.7, 0.03, '#8d9aa3'); box(g, 2.6, 3.25, -0.8, 1.7, 0.1, 1.7, RED); // 훈련탑
    hydrant(g, -2.9, -0.9); tube(g, [[-2.7, 0.06, -0.8], [-1.6, 0.06, -0.2], [-0.4, 0.06, -0.5], [0.6, 0.06, 0.2]], 0.06, '#e8dfc8');
    for (const x of [-1.2, 0, 1.2]) cone(g, x, 1.2);
    cyl(g, 0.9, 0.03, -0.9, 0.5, 0.04, '#5b5f66'); cyl(g, 0.9, 0.06, -0.9, 0.3, 0.03, '#f08a3c'); // 표적
  }
}

// 따로 지어 보여 주는 곳. dress 가 있으면 그곳에서는 내 캐릭터가 그 옷으로 갈아입는다.
const sets = {
  locker: { title: '대원 탈의실', build(g) { for (const x of [-1.8, -0.9, 0, 0.9]) { cupboard(g, x, -1.8, 0.75, 1.6); box(g, x, 1.15, -1.55, 0.1, 0.2, 0.02, '#c4a27f'); } coatOnHook(g, 2.1, 1.2, -2.15); box(g, -0.6, 0.25, 0.5, 2.2, 0.1, 0.5, '#d3b794'); for (const x of [-1.5, 0.3]) box(g, x, 0.12, 0.5, 0.1, 0.24, 0.45, '#b9a184'); plant(g, 2.1, 1.5, 0.9); } },
  meeting: { title: '함께 맞추는 하루', build(g) {
    box(g, 0, 1.5, -2.2, 2.6, 1.2, 0.05, '#fffdf8'); for (let i = 0; i < 4; i++) box(g, -0.9 + i * 0.6, 1.75 - (i % 2) * 0.3, -2.16, 0.4, 0.05, 0.01, i === 1 ? RED : '#8aa0b0');
    cyl(g, -0.3, 0.78, -0.2, 1.1, 0.1, '#d7b999'); cyl(g, -0.3, 0.4, -0.2, 0.15, 0.7, '#dfd3c3');
    const lead = person({ ...FIRE, seed: 1, hair: 2 }); lead.root.position.set(-1.7, 0, -0.5); lead.root.rotation.y = 1.1; g.add(lead.root);
    const mate = person({ ...FIRE, seed: 3, hair: 1 }); mate.root.position.set(-0.4, 0, -1.6); mate.root.rotation.y = 0.2; g.add(mate.root);
  } },
  lounge: { title: '잠깐, 쉬어 가요', build(g) { for (const x of [-1, 0, 1]) chair(g, x, -1.1, '#e3b79a'); desk(g, 0, 0.2, 1.8); cyl(g, -0.4, 0.97, 0.2, 0.09, 0.2, '#c1d4dc'); cyl(g, 0.4, 0.97, 0.2, 0.09, 0.2, '#f1c6b4'); ball(g, 2.2, 2.0, -2.15, 0.13, RED); plant(g, -2, 1.5, 1.1); } },
  market: { title: '나루 시장 · 소방시설 점검', build(g) {
    for (const [x, c] of [[-1.5, '#e9a28f'], [1.2, '#a9c7b9']]) {
      box(g, x, 0.45, -1.5, 2.0, 0.9, 0.9, '#e5cdb1'); box(g, x, 1.95, -1.3, 2.2, 0.08, 1.4, c); for (const s of [-1, 1]) cyl(g, x + s * 1.0, 1.0, -0.7, 0.03, 1.9, '#a39a8a');
      for (let i = 0; i < 4; i++) ball(g, x - 0.6 + i * 0.4, 1.0, -1.4, 0.15, ['#e8b54d', '#d98a6a', '#a4b19a', '#f1d4b7'][i], [1, 0.7, 1]);
    }
    cyl(g, 2.5, 0.3, -1.9, 0.11, 0.5, RED); cyl(g, 2.5, 0.6, -1.9, 0.04, 0.1, '#4a4f57'); // 소화기
    for (const [x, y, z] of [[2.3, 0.2, -1.3], [2.6, 0.2, -1.2], [2.45, 0.58, -1.25]]) box(g, x, y, z, 0.42, 0.36, 0.42, '#c9a77a'); // 소화기 앞에 쌓인 상자
    const owner = person({ coat: '#e9a28f', seed: 4, hair: 1, outfit: 'vest' }); owner.root.position.set(-0.5, 0, -0.4); owner.root.rotation.y = 0.5; g.add(owner.root);
  } },
  drill: { title: '훈련장', dress: TURNOUT, build(g) {
    hydrant(g, -2.1, -1.5); tube(g, [[-1.9, 0.06, -1.4], [-1.0, 0.06, -0.6], [0, 0.06, -0.9], [0.9, 0.06, 0.2]], 0.06, '#e8dfc8');
    box(g, 2.0, 1.2, -1.9, 1.2, 2.4, 0.6, '#ddd6c8'); box(g, 2.0, 1.4, -1.58, 0.6, 0.6, 0.03, '#8d9aa3');
    for (const x of [-1.5, -0.5]) cone(g, x, 1.6);
    const mate = person({ ...TURNOUT, seed: 3, hair: 1 }); mate.root.position.set(-0.4, 0, -1.5); mate.root.rotation.y = 0.6; g.add(mate.root);
  } },
  scene: { title: '출동 현장 · 시장 옆 식당', dress: TURNOUT, build(g) {
    box(g, 0.9, 1.0, -2.2, 1.0, 2.0, 0.08, '#c9a77a'); box(g, 0.9, 2.15, -2.0, 2.4, 0.1, 0.7, '#e9a28f'); box(g, -1.0, 1.4, -2.2, 1.3, 0.9, 0.05, '#bcd8e4');
    for (const [x, y, s] of [[0.7, 2.6, 0.3], [1.1, 3.0, 0.38], [0.8, 3.45, 0.3]]) ball(g, x, y, -1.9, s, '#d9d7d2'); // 남은 연기
    const t = truck(g, -1.3, -0.6, 0.25); t.scale.setScalar(0.72);
    const boss = person({ ...TURNOUT, seed: 1, hair: 2 }); boss.root.position.set(0.3, 0, -1.3); boss.root.rotation.y = 0.4; g.add(boss.root);
    for (const [x, z, c, s] of [[2.2, -0.6, '#c9b6d6', 5], [2.4, 0.3, '#a9c7b9', 6]]) { const p = person({ coat: c, seed: s, hair: s % 3 }); p.root.position.set(x, 0, z); p.root.rotation.y = -1.2; g.add(p.root); }
  } },
};

export default {
  id: 'fire-station',
  name: '다솜 소방서',
  icon: '🚒',
  color: '#d2553f', colorD: '#a8402d', // 일터 색 (shared/DESIGN.md §1)
  quiet: ['lounge', 'locker', 'meeting', 'drill', 'scene'], // 기다리는 사람이 따라오지 않는 곳
  rooms,
  sets,
  start: [-6.5, 0, 6.2], // 직원 출입구
  exit: [6.5, 0, 6.2], // 퇴근길
  build(scene) {
    const people = [];
    const floor = new T.Group(); scene.add(floor);
    box(floor, 0, -0.6, 0, 17.8, 0.65, 12, '#c9baa6'); box(floor, 0, -0.22, 0, 18, 0.18, 12.2, '#ede5d6'); box(floor, 0, -0.08, 0, 17.6, 0.1, 11.8, '#f6f1e6');
    rooms.forEach((r, i) => {
      const g = new T.Group(); g.position.set(r.x, 0, r.z); scene.add(g);
      box(g, 0, 0.025, 0, r.w, 0.05, r.d, r.open ? '#e4e2da' : '#efece3');
      if (r.open) label(g, r.tag + '  ' + r.name, -2.4, 0.9, r.d / 2 - 0.1, 2.2, 0.46, '#5c6a6d', '#faf4e8');
      else {
        const h = r.id === 'garage' ? 3.1 : 2.7, back = -r.d / 2 + 0.1;
        box(g, 0, h / 2, back, r.w + 0.13, h, 0.14, '#f1e6d6'); box(g, 0, 0.24, back + 0.1, r.w + 0.05, 0.42, 0.045, r.color);
        box(g, -r.w / 2 - 0.005, 0.65, 0, 0.12, 1.3, r.d - 0.2, '#e6dac8');
        label(g, r.tag + '  ' + r.name, 0, h - 0.55, back + 0.095, 2.9, 0.52, '#5c6a6d', '#faf4e8');
      }
      furnish(g, r);
      const npc = person({ ...r.staff, seed: i + 1 }); npc.root.position.set(r.x + 0.65, 0, r.z + 0.7); npc.root.rotation.y = -0.3; scene.add(npc.root); people.push(npc);
    });
    box(scene, -4.2, 0.012, 2.9, 7.4, 0.02, 3.6, '#eeeae0'); for (const x of [-6, -2.6]) box(scene, x, 0.03, 2.9, 0.1, 0.012, 3.2, '#f2c94c'); // 차고 앞 출동 길
    box(scene, 0, -0.16, 6.2, 16, 0.18, 1.9, '#e6d9c2');
    for (const x of [-6.5, 6.5]) { plant(scene, x - 1.3, 5.6, 1.1); }
    label(scene, '직원 출입구', -6.5, 2.6, 5.5, 1.6, 0.4); label(scene, '퇴근길', 6.5, 2.6, 5.5, 1.6, 0.4);
    cyl(scene, -0.6, 1.9, 5.2, 0.04, 3.8, STEEL); box(scene, -0.25, 3.5, 5.2, 0.7, 0.42, 0.02, CREAM); ball(scene, -0.25, 3.5, 5.215, 0.1, RED, [1, 1, 0.1]); // 깃대
    const sign = new T.Group(); sign.position.set(-8.2, 0, 4.6); scene.add(sign);
    cyl(sign, 0, 1, 0, 0.04, 2, '#b9b2a5'); label(sign, '다솜 소방서', 0, 2, 0, 2.2, 0.65, '#fff6ea', '#a8402d');
    return { people };
  },
};
