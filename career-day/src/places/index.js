// 일터 목록. 새 일터는 hospital.js 를 본떠 만들고 여기에 더한다.
// 일터마다 icon(그림 글자), color·colorD(일터 색), quiet(기다리는 줄이 생기지 않는 곳)을 적는다.
import hospital from './hospital.js';
import fireStation from './fire-station.js';
import hospitalWard from './hospital-ward.js';
import hospitalSurgery from './hospital-surgery.js'; // 의사: 5층 외과 병동·수술실
import hospitalLobby from './hospital-lobby.js'; // 환경미화 직원: 1층 로비
import hospitalLab from './hospital-lab.js'; import hospitalRadiology from './hospital-radiology.js'; // 임상병리사: 2층 진단검사의학과 · 방사선사: 지하 1층 영상의학과

export const PLACES = { hospital, 'fire-station': fireStation };
// 한 일터 안의 다른 층: 직업이 floor 를 적으면 그 층의 모형에서 하루를 보낸다(간호사 → 7층 병동).
// 기록의 일터(job.place)와 첫 화면의 일터는 그대로다. floor 가 없는 직업은 일터 모형 그대로 쓴다(병원의 다른 일곱 직업).
export const FLOORS = { 'hospital/ward': hospitalWard };
FLOORS['hospital/surgery'] = hospitalSurgery;
FLOORS['hospital/lobby'] = hospitalLobby;
Object.assign(FLOORS, { 'hospital/lab': hospitalLab, 'hospital/radiology': hospitalRadiology }); // 임상병리사 · 방사선사
export const placeOf = (job) => (job.floor && FLOORS[`${job.place}/${job.floor}`]) || PLACES[job.place];
