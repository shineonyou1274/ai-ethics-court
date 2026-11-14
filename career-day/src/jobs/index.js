// 직업 목록. 새 직업은 이 폴더에 파일 하나를 만들고 아래에 한 줄을 더하면 된다.
// (파일 이름이 _ 로 시작하면 여러 직업이 같이 쓰는 틀이다.)
import doctor from './doctor.js';
import nurse from './nurse.js';
import labtech from './labtech.js';
import radiographer from './radiographer.js';
import admin from './admin.js';
import pharmacist from './pharmacist.js';
import physio from './physio.js';
import cleaner from './cleaner.js';

export const JOBS = [doctor, nurse, labtech, radiographer, admin, pharmacist, physio, cleaner];
export const jobById = (id) => JOBS.find((j) => j.id === id);
