// 약속 검사: node shared/test.mjs
// 1) 일당 계산이 약속대로인가  2) 예시 기록이 checkRecord 를 통과하는가  3) 앱 안의 복사본이 원본과 같은가
import { readFileSync, existsSync } from 'node:fs';
import { salaryDay, hourlyOf, makeRecord, checkRecord, MIN_WAGE, saveRecordSafe, loadRecords, careernetUrl } from './workday.js';

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

console.log('저장');
const mem = {}; globalThis.localStorage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); } };
ok(typeof sample.id === 'string' && sample.id.length > 5, '기록마다 id 가 붙음');
ok(saveRecordSafe(sample).ok && loadRecords().length === 1, '저장하면 ok');
const again = saveRecordSafe(sample); ok(again.ok && again.duplicate && loadRecords().length === 1, '같은 기록을 두 번 저장하지 않음');
mem['workday-records-v1'] = JSON.stringify([...loadRecords(), { ...sample, id: 'other-tab' }]);
ok(saveRecordSafe(makeRecord({ ...sample, annual: 3004, workedMin: 480, shiftMin: 480, job: sample.job, shift: sample.shift, ending: sample.ending, like: sample.like, hard: sample.hard, id: undefined })).ok && loadRecords().length === 3, '다른 탭이 그사이 저장한 기록을 지우지 않음');
globalThis.localStorage = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } };
const blocked = saveRecordSafe(makeRecord({ app: 'x', place: 'cafe', job: sample.job, annual: 3004, shift: sample.shift, workedMin: 480, shiftMin: 480, ending: sample.ending, like: sample.like, hard: sample.hard }));
ok(!blocked.ok && blocked.error, '저장이 막히면 ok: false 와 까닭');
delete globalThis.localStorage;
ok(careernetUrl('180') === 'https://www.career.go.kr/cloud/w/job/view?seq=180', '커리어넷 출처 주소');

console.log('복사본');
const original = readFileSync(new URL('./workday.js', import.meta.url), 'utf8');
for (const copy of ['../barista-day/dist/shared/workday.js']) {
  const url = new URL(copy, import.meta.url);
  if (!existsSync(url)) { console.log(`  · ${copy} 아직 없음`); continue; }
  ok(readFileSync(url, 'utf8') === original, `${copy} 가 원본과 같음`);
}

console.log(fail ? `\n✗ ${fail}개 실패` : '\n✓ 약속을 모두 지킴');
process.exit(fail ? 1 : 0);
