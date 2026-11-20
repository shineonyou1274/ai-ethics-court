// 병원의 한 층을 걸어 다니며 보내는 하루의 틀 (카페 방식, shared/DESIGN.md §2-3). 의사(5층 외과)와 환경미화 직원(1층 로비)이 쓴다.
// 간호사의 _ward-day.js 와 같은 모양이고, 직업마다 다른 말(탈의실, 쉬는 시간, 퇴근)만 받는다. 간호사 파일은 건드리지 않는다.
// 하루의 순서는 다른 일터와 같다(shared/DESIGN.md §4): 명찰 → 탈의 → 일하기 → 쉬는 시간 → 일하기 → 퇴근.
// 직업 파일은 오전(am)과 오후(pm)의 일만 채운다. 장면마다 atOff(출근 뒤 몇 분, 쉬는 시간은 빼고 센다)를 적는다.
// 장면의 todo(받은 일 목록)와 notice(호출기·동료·전화)는 src/flow.js 가 쓴다.
import { toHHMM, toMin } from '../engine.js';

export function floorDay(job, p) {
  const s0 = toMin(job.shift.start), br = job.shift.breakMin;
  const at = (off) => toHHMM(s0 + off);
  const half = Math.round((toMin(job.shift.end) - s0 - br) / 2); // 쉬는 시간이 시작되는 때(근무의 한가운데)
  const am = (list) => list.map(({ atOff, ...x }) => ({ ...x, at: at(atOff) }));
  const pm = (list) => list.map(({ atOff, ...x }) => ({ ...x, at: at(atOff + br) })); // 쉬는 시간을 지난 장면은 그만큼 뒤로 민다
  const t = p.text;
  return [
    { kind: 'reveal', at: at(-20), place: 'outside', title: '오늘의 명찰을 받았어요', body: job.intro },
    { kind: 'tasks', at: at(-10), place: 'locker', goal: '옷 갈아입기', title: '옷을 갈아입으면, 하루 시작', body: t.locker,
      tasks: [{ label: '사물함에 가방 넣기', result: '가방을 내려놓았어요.', act: 'work' }, { label: `${job.uniform} 입고 명찰 달기`, result: t.dressed, act: 'dress' }] },
    // 돌아보기의 순간으로 세지 않는다. 손으로 하는 장면이 많아, 순간을 여덟 안으로 모은다 (shared/README.md §2)
    { kind: 'records', at: at(0), place: job.room, todo: { label: t.recordsTodo, known: true }, title: p.recordsTitle || '먼저, 오늘의 기록부터', body: t.records, records: p.records },
    ...am(p.am),
    { kind: 'choice', isBreak: true, at: at(half), place: 'lounge', todo: { label: '점심과 쉬는 시간', known: true }, title: '잠깐, 나도 숨을 고르기', body: `쉬는 시간 ${br}분. 내 힘을 돌보는 것도 하루의 일이에요.`,
      speaker: '동료', speech: t.breakSpeech, fact: '근로기준법: 4시간 일하면 30분, 8시간 일하면 1시간 이상 쉬는 시간을 주어야 해요. 쉬는 시간에 일했다면 그건 일한 시간이에요.',
      options: [
        { label: '쉬는 시간을 다 쓰고 돌아간다', fx: { energy: 18 }, reply: '물 한 잔, 따뜻한 밥 한 그릇. 오후를 버틸 힘이 차올랐어요.', moment: '쉬는 시간을 지킨 순간' },
        { label: '쉬면서 동료와 오전 이야기를 나눈다', fx: { energy: 11, team: 6 }, reply: t.breakTalk, moment: '동료와 쉬며 이야기 나눈 순간' },
        { label: '15분만 쉬고 밀린 일을 하러 간다', when: (s) => s.delay > 0, fx: { energy: 2, delay: -15, breakWorked: 15 }, reply: '밀린 일을 조금 따라잡았어요. 대신 쉬지 못한 15분은 일한 시간으로 적혀요.', moment: '쉬는 시간을 줄여 일을 따라잡은 순간' },
      ] },
    ...pm(p.pm),
    { kind: 'pick', at: at(p.pickAt + br), place: p.pickPlace || job.room, todo: { label: t.pickTodo, known: true }, ...p.pick },
    { kind: 'thanks', at: at(half * 2 - 35 + br), place: p.thanksPlace || job.room, title: '오늘 남은 한마디', body: p.thanksBody || '바쁜 하루 사이, 짧은 인사가 오래 남기도 해요.', speaker: `${job.person} 님`, lines: p.thanks },
    { kind: 'leave', at: job.shift.end, place: 'locker', todo: { label: `${job.shift.end} 퇴근`, known: true }, title: `${job.uniform}을 벗고, 오늘을 접어요`, body: t.leave },
  ];
}
