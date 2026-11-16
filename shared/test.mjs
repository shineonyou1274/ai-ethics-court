// 약속 검사: node shared/test.mjs
// 1) 일당 계산이 약속대로인가  2) 예시 기록이 checkRecord 를 통과하는가  3) 앱 안의 복사본이 원본과 같은가
import { readFileSync, existsSync } from 'node:fs';
import { encodeRecords, decodeCodes, toCsv } from './collect.js';
import { salaryDay, hourlyOf, makeRecord, checkRecord, MIN_WAGE, saveRecordSafe, loadRecords, careernetUrl, currentSession, loadMine, startNewSession, keepSession, needsWhoCheck, walletSummary } from './workday.js';

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

console.log('기기를 함께 쓸 때');
{
  const mem2 = {}; globalThis.localStorage = { getItem: (k) => mem2[k] ?? null, setItem: (k, v) => { mem2[k] = String(v); } };
  mem2['workday-records-v1'] = JSON.stringify([{ ...sample, id: 'old', session: undefined }]);
  const s1 = currentSession();
  ok(loadMine().length === 1, '세션이 없던 예전 기록은 처음 사람의 것으로 봄');
  ok(needsWhoCheck() === true, '앞사람 기록이 남아 있으면 누구인지 물음');
  keepSession(); ok(needsWhoCheck() === false, "'이어서 하기'를 고르면 오늘은 다시 묻지 않음");
  const mine = makeRecord({ ...sample, annual: 3004, workedMin: 500, shiftMin: 480, id: undefined, session: undefined });
  ok(mine.session === s1.id, '새 기록에 지금 세션이 붙음');
  saveRecordSafe(mine);
  startNewSession();
  ok(loadMine().length === 0 && loadRecords().length === 2, '새로 출근하는 사람: 앞사람 기록은 남기고 숨김');
  saveRecordSafe(makeRecord({ ...sample, annual: 3004, workedMin: 480, shiftMin: 480, id: undefined, session: undefined }));
  const sum = walletSummary();
  ok(sum.days === 1 && sum.minutes === 480 && sum.jobs.length === 1, '지갑 요약은 지금 사람 것만 (일한 시간, 다녀온 직업)');
  startNewSession({ wipe: true });
  ok(loadRecords().length === 0, '모두 지우고 시작하면 이 기기의 기록이 비워짐');
  delete globalThis.localStorage;
}

console.log('교사 기록 모으기');
const code = encodeRecords([sample, { ...sample, id: 'b2', job: { id: 'nurse', name: '간호사', careernet: '354' } }], '3번 김하늘');
ok(/^WD1\.[A-Za-z0-9_-]+\.[a-z0-9]{4}$/.test(code), '코드 모양 WD1.본문.검사');
const back = decodeCodes(`카톡으로 받은 글\n${code}\n다른 말`);
ok(back.students.length === 1 && back.students[0].name === '3번 김하늘' && back.students[0].records.length === 2, '붙여 넣은 글 속 코드를 찾아 풂 (한글 이름 포함)');
ok(back.students[0].records[1].jobName === '간호사' && back.students[0].records[0].pay === sample.pay.total && back.students[0].records[0].likeType === 'R', '직업·일당·흥미 유형이 그대로');
const broken = code.slice(0, 20) + (code[20] === 'A' ? 'B' : 'A') + code.slice(21);
ok(decodeCodes(broken).errors.length === 1 && decodeCodes(broken).students.length === 0, '글자가 바뀐 코드는 오류로 알림');
ok(!JSON.stringify(back).includes('13500'), '가게 매출 같은 다른 돈은 코드에 넣지 않음');
ok(toCsv(back.students[0].records.map((r) => ({ ...r, name: '3번' }))).startsWith('\uFEFF"번호나 이름"'), 'CSV 머리줄');

console.log('복사본');
for (const [file, copy] of [['workday.js', '../barista-day/dist/shared/workday.js'], ['collect.js', '../barista-day/dist/shared/collect.js'], ['design.css', '../barista-day/dist/shared/design.css']]) {
  const url = new URL(copy, import.meta.url);
  if (!existsSync(url)) { console.log(`  · ${copy} 아직 없음`); continue; }
  ok(readFileSync(url, 'utf8') === readFileSync(new URL('./' + file, import.meta.url), 'utf8'), `${copy} 가 원본과 같음`);
}

console.log(fail ? `\n✗ ${fail}개 실패` : '\n✓ 약속을 모두 지킴');
process.exit(fail ? 1 : 0);
