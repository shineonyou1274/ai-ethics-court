// 모아 병원 2층 진단검사의학과: 임상병리사가 하루를 걸어 다니는 층 (카페 방식, shared/DESIGN.md §2-3).
// 임상병리사(job.floor: 'lab')만 쓴다. 기록의 일터는 그대로 'hospital' 이다 (places/index.js 의 placeOf).
// 뒤쪽 줄: 채혈실, 검체 처리실(원심분리기), 자동화 검사실(분석기), 현미경실. 앞쪽 줄: 검사실 사무실(전화), 채혈 대기실, 휴게실, 탈의실.
// 이름과 모습은 모두 가상이고, 실제 검사실을 아주 단순하게 줄였다. 바늘과 피는 그리지 않는다.
import { box, cyl, chair, monitor } from '../world/kit.js';
import { hospFloor, BACK, FRONT, LOUNGE, LOCKER, SPOT_BACK, SPOT_FRONT } from './_hosp-floor.js';

const rooms = [
  { id: 'draw', sign: '채혈실', name: '채혈실', ...BACK[0], color: '#e7b4a4' },
  { id: 'process', sign: '검체 처리실', name: '검체 처리실', ...BACK[1], color: '#c2bbd7' },
  { id: 'chem', sign: '자동화 검사실', name: '자동화 검사실', ...BACK[2], color: '#a9c6d9' },
  { id: 'micro', sign: '현미경실', name: '현미경실', ...BACK[3], color: '#b7cddd' },
  { id: 'office', sign: '검사실 사무실', name: '검사실 사무실', ...FRONT[0], color: '#c2bbd7', staff: { coat: '#c7bedc', outfit: 'scrub', hair: 2 }, npc: [-1.4, 0.2] }, // 선배 임상병리사
  { id: 'waiting', sign: '채혈 대기실', name: '채혈 대기실', ...FRONT[1], color: '#e5c18e', staff: { coat: '#c9b6d6', outfit: 'casual', hair: 2 }, npc: [-1.3, 0.35] }, // 채혈을 기다리는 분
  LOUNGE, LOCKER,
];

const CAP = ['#8e6bbf', '#e2b93b', '#7fb7d9'];
function furnish(g, r) {
  if (r.id === 'draw') { // 채혈 책상과 팔 받침 의자 둘. 튜브 꽂이
    box(g, 0, 0.45, -1.95, 3.2, 0.9, 0.55, '#efe4d4'); box(g, 0, 0.915, -1.95, 3.25, 0.03, 0.6, '#f7f1e8');
    for (const x of [-0.9, 0.9]) { chair(g, x, -0.95, '#e7b4a4', Math.PI); box(g, x + 0.42, 0.75, -1.05, 0.14, 0.06, 0.62, '#d9c3b3'); } // 팔 받침
    CAP.forEach((c, i) => { cyl(g, -0.3 + i * 0.18, 1.02, -1.95, 0.05, 0.2, '#eef3f6'); cyl(g, -0.3 + i * 0.18, 1.14, -1.95, 0.055, 0.05, c); });
  }
  if (r.id === 'process') { // 원심분리기 둘이 놓인 긴 작업대
    box(g, 0, 0.45, -1.85, 3.2, 0.9, 0.7, '#d8d1e3'); box(g, 0, 0.915, -1.85, 3.25, 0.03, 0.75, '#f4f1f7');
    for (const x of [-0.8, 0.6]) { cyl(g, x, 1.15, -1.85, 0.34, 0.45, '#e9e9e2'); cyl(g, x, 1.39, -1.85, 0.3, 0.04, '#bfc6cf'); box(g, x, 1.1, -1.5, 0.22, 0.12, 0.02, '#364e61'); }
  }
  if (r.id === 'chem') { // 큰 자동 분석기와 화면
    box(g, 0, 0.7, -1.55, 3.0, 1.4, 1.1, '#e3e8ec'); box(g, 0, 1.42, -1.55, 3.05, 0.05, 1.15, '#c8d2d8');
    box(g, -0.9, 1.05, -0.99, 0.9, 0.55, 0.03, '#364e61'); box(g, -0.9, 1.05, -0.97, 0.8, 0.45, 0.01, '#bfe3d2');
    for (let i = 0; i < 6; i++) { cyl(g, 0.3 + i * 0.18, 1.5, -1.25, 0.05, 0.16, '#eef3f6'); cyl(g, 0.3 + i * 0.18, 1.6, -1.25, 0.055, 0.04, CAP[i % 3]); }
  }
  if (r.id === 'micro') { // 현미경 둘이 놓인 책상과 의자
    box(g, 0, 0.42, -1.85, 3.0, 0.84, 0.8, '#e5d9c4'); box(g, 0, 0.855, -1.85, 3.05, 0.03, 0.85, '#f3ebdc');
    for (const x of [-0.7, 0.7]) { box(g, x, 0.92, -1.85, 0.4, 0.06, 0.3, '#5c6a7a'); const arm = box(g, x, 1.15, -1.98, 0.08, 0.42, 0.08, '#5c6a7a'); arm.rotation.x = 0.15; cyl(g, x, 1.3, -1.82, 0.05, 0.25, '#3f4a57'); }
    chair(g, -0.6, -1.0, '#b7cddd', Math.PI);
  }
  if (r.id === 'office') { // 긴 책상, 전화, 모니터
    box(g, -0.4, 0.5, -1.2, 3.2, 1.0, 0.55, '#d8d1e3'); box(g, -0.4, 1.02, -1.2, 3.3, 0.05, 0.62, '#f4f1f7');
    monitor(g, -1.2, -1.2); monitor(g, 0.2, -1.2); box(g, 0.75, 1.08, -1.15, 0.3, 0.07, 0.22, '#e46d5a'); // 빨간 전화
    chair(g, -0.9, -0.55, '#c2bbd7', Math.PI); chair(g, 0.4, -0.55, '#c2bbd7', Math.PI);
  }
  if (r.id === 'waiting') { // 대기 의자 한 줄과 번호 화면
    box(g, 0, 0.42, -1.2, 2.6, 0.08, 0.5, '#e5c18e'); box(g, 0, 0.7, -1.42, 2.6, 0.5, 0.06, '#dcb47e'); for (const x of [-1.1, 0, 1.1]) box(g, x, 0.2, -1.2, 0.08, 0.4, 0.4, '#8f9a9c');
  }
}

export default hospFloor({
  floor: 'lab',
  rooms, furnish,
  quiet: ['lounge', 'locker', 'office', 'process', 'chem', 'micro'], // 기다리는 사람이 따라오지 않는 곳
  sign: '모아 병원 2층 진단검사',
  corridor: '#e4e0ee',
  blocks: [
    [-7.65, -4.35, -5.0, -4.6], [-7.3, -6.4, -4.35, -3.6], [-5.5, -4.55, -4.35, -3.6], // 채혈실: 책상, 의자 둘(팔 받침)
    [-3.65, -0.35, -5.0, -4.45], // 검체 처리실: 작업대
    [0.45, 3.55, -5.0, -3.95], // 자동화 검사실: 분석기
    [4.45, 7.55, -5.0, -4.4], [5.05, 5.75, -4.4, -3.7], // 현미경실: 책상, 의자
    [-7.25, -3.95, 1.69, 2.31], [-6.45, -5.75, 2.35, 2.95], [-5.15, -4.45, 2.35, 2.95], [-6.85, -6.35, 3.15, 3.65], // 사무실: 책상, 의자 둘, 선배
    [-1.95, 0.75, 1.5, 2.3], [-2.15, -1.65, 3.3, 3.8], // 대기실: 의자, 기다리는 분
  ],
  spots: {
    draw: { ...SPOT_BACK[0], name: '채혈실' },
    process: { ...SPOT_BACK[1], name: '검체 처리실' },
    chem: { ...SPOT_BACK[2], name: '자동화 검사실' },
    micro: { ...SPOT_BACK[3], name: '현미경실' },
    office: { ...SPOT_FRONT[0], name: '검사실 사무실' },
    waiting: { ...SPOT_FRONT[1], name: '채혈 대기실' },
    lounge: { ...SPOT_FRONT[2], name: '휴게실' },
    locker: { ...SPOT_FRONT[3], name: '탈의실' },
  },
});
