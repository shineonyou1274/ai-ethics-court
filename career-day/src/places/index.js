// 일터 목록. 새 일터는 hospital.js 를 본떠 만들고 여기에 더한다.
// 일터마다 icon(그림 글자), color·colorD(일터 색), quiet(기다리는 줄이 생기지 않는 곳)을 적는다.
import hospital from './hospital.js';
import fireStation from './fire-station.js';
import hospitalWard from './hospital-ward.js';

import { department } from './department.js';

export const PLACES = { hospital, 'fire-station': fireStation };
// 한 일터 안의 다른 층: 직업이 floor 를 적으면 그 층의 모형에서 하루를 보낸다(간호사 → 7층 병동).
// 기록의 일터(job.place)와 첫 화면의 일터는 그대로다. floor 가 없는 직업은 일터 모형 그대로 쓴다(병원의 다른 일곱 직업).
export const FLOORS = { 'hospital/ward': hospitalWard };
FLOORS['hospital/pharmacist'] = department('pharmacist', [["pharmacy", "조제실", "desk"], ["counter", "투약 창구", "desk"], ["meeting", "상담실", "seat"], ["store", "약품 창고", "shelf"]]);
FLOORS['hospital/admin'] = department('admin', [["reception", "접수 창구", "desk"], ["counter", "수납 창구", "desk"], ["meeting", "대기 의자", "seat"], ["store", "서류실", "shelf"]]);
FLOORS['hospital/physio'] = department('physio', [["rehab", "치료실", "desk"], ["counter", "운동 매트", "mat"], ["meeting", "평행봉", "bars"], ["store", "기구 정리대", "shelf"]]);
export const placeOf = (job) => (job.floor && FLOORS[`${job.place}/${job.floor}`]) || PLACES[job.place];
