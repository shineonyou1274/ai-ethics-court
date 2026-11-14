// 약속 검사: node shared/test.mjs
// 1) 일당 계산이 약속대로인가  2) 예시 기록이 checkRecord 를 통과하는가  3) 앱 안의 복사본이 원본과 같은가
import { readFileSync, existsSync } from 'node:fs';
import { salaryDay, hourlyOf, makeRecord, checkRecord, MIN_WAGE } from './workday.js';

let fail = 0;
const ok = (cond, msg) => { console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`); if (!cond) fail++; };

console.log('일당 계산');
ok(salaryDay(3004, 480).hourly === 11980, '바리스타(커리어넷 180, 3,004만 원) 시급 11,980원');
ok(salaryDay(3004, 480).total === 95840, '바리스타 8시간 기본급 95,840원');
ok(salaryDay(3004, 510).overtime === Math.round(11980 * 1.5 * 0.5 / 10) * 10, '30분 연장은 1.5배');
ok(hourlyOf(2200).hourly === MIN_WAGE.hourly && hourlyOf(2200).floored, '자료 시급이 최저시급보다 낮으면 최저시급');

console.log('예시 기록');
const sample = makeRecord({
  app: 'barista-day', place: 'cafe', job: { id: 'barista', name: '바리스타', careernet: '180' },
  annual: 3004, wageYear: 2021, wageBasis: '음료조리사',
  shift: { start: '08:30', end: '17:30', breakMin: 60 }, workedMin: 495, shiftMin: 480,
  ending: { name: '손님 취향을 맞춰 간 하루' },
  like: { label: '붓는 양을 맞춘 순간', type: 'R' }, hard: { label: '컵을 씻어 선반에 정리한 순간', type: 'C' },
  extra: { sales: 13500, materials: 2150, drinks: 3 },
});
ok(checkRecord(sample).length === 0, '바리스타 예시 기록 통과 ' + checkRecord(sample).join(', '));
ok(checkRecord({ ...sample, pay: { ...sample.pay, total: sample.pay.total + 1000 } }).length > 0, '일당을 다르게 계산하면 걸림');
ok(checkRecord({ ...sample, studentName: '가나다' }).length > 0, '학생 이름을 넣으면 걸림');

console.log('복사본');
const original = readFileSync(new URL('./workday.js', import.meta.url), 'utf8');
for (const copy of ['../barista-day/dist/shared/workday.js']) {
  const url = new URL(copy, import.meta.url);
  if (!existsSync(url)) { console.log(`  · ${copy} 아직 없음`); continue; }
  ok(readFileSync(url, 'utf8') === original, `${copy} 가 원본과 같음`);
}

console.log(fail ? `\n✗ ${fail}개 실패` : '\n✓ 약속을 모두 지킴');
process.exit(fail ? 1 : 0);
