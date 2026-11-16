// 일터 목록. 새 일터는 hospital.js 를 본떠 만들고 여기에 더한다.
// 일터마다 icon(그림 글자), color·colorD(일터 색), quiet(기다리는 줄이 생기지 않는 곳)을 적는다.
import hospital from './hospital.js';
import fireStation from './fire-station.js';

export const PLACES = { hospital, 'fire-station': fireStation };
