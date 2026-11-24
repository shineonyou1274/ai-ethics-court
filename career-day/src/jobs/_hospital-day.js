// 병원 직업들이 함께 쓰는 하루의 틀. 직업 파일은 자기만의 고민(첫 만남, 팀, 돌발, 손으로 하는 일)만 채운다.
// 쉬는 시간 보기에는 흥미 유형(type)을 달지 않는다. 쉬는 것은 직업의 일이 아니라서, 돌아보기의 '순간' 목록에서도 빠진다.
// 시각은 출근 시각에서 몇 분 뒤인지로 적는다. 쉬는 시간(break)을 지난 장면은 그만큼 뒤로 민다.
import { toHHMM, toMin } from '../engine.js';

export function hospitalDay(job, p) {
  const s0 = toMin(job.shift.start), br = job.shift.breakMin;
  const at = (off) => toHHMM(s0 + off);
  const half = Math.round((toMin(job.shift.end) - s0 - br) / 2); // 쉬는 시간이 시작되는 때(근무의 한가운데)
  const after = (off) => at(off + br);
  // 직업마다 손으로 하는 장면(kind: 'hands')을 끼워 넣을 수 있다. p.before.first 처럼 '어느 장면 앞'에 넣는다.
  // 끼워 넣는 장면의 at 은 출근 시각에서 몇 분 뒤인지(atOff)로 적는다.
  const put = (key, scene) => [...(p.before?.[key] || []).map(({ atOff, ...x }) => ({ ...x, at: at(atOff) })), scene];
  return [
    { kind: 'reveal', at: at(-20), place: 'outside', title: '오늘의 명찰을 받았어요', body: job.intro },
    { kind: 'tasks', at: at(-10), place: 'locker', title: '옷을 갈아입으면, 하루 시작', body: '직원 출입구를 지나 탈의실에 왔어요. 가방을 넣고 일할 준비를 해요.',
      tasks: [{ label: '사물함에 가방 넣기', result: '가방을 내려놓았어요.', act: 'work' }, { label: `${job.uniform} 입고 명찰 달기`, result: `${job.uniform} 차림으로 동료들에게 인사했어요.`, act: 'dress' }] },
    { kind: 'records', at: at(0), place: job.room, title: p.recordsTitle || '먼저, 오늘의 기록부터', body: '오늘 만날 사람과 해야 할 일을 한 장씩 펼쳐 봐요.', records: p.records, moment: '오늘의 기록을 읽은 순간', type: 'C' },
    ...put('first', { kind: 'choice', at: at(25), place: p.firstPlace || job.room, ...p.first }),
    ...put('order', { kind: 'order', at: at(70), place: p.orderPlace || p.firstPlace || job.room, ...p.order }),
    ...(p.after?.order || []).map(({ atOff, ...x }) => ({ ...x, at: at(atOff) })),
    { kind: 'choice', at: at(Math.round(half * 0.7)), place: 'meeting', ...p.team },
    { kind: 'choice', isBreak: true, at: at(half), place: 'lounge', title: '잠깐, 나도 숨을 고르기', body: `쉬는 시간 ${br}분. 내 힘을 돌보는 것도 하루의 일이에요.`,
      speaker: '동료', speech: '“먼저 쉬고 와요. 제가 자리 볼게요.”', fact: '근로기준법: 4시간 일하면 30분, 8시간 일하면 1시간 이상 쉬는 시간을 주어야 해요. 쉬는 시간에 일했다면 그건 일한 시간이에요.',
      options: [
        { label: '쉬는 시간을 다 쓰고 돌아간다', fx: { energy: 18 }, reply: '물 한 잔, 따뜻한 밥 한 그릇. 오후를 버틸 힘이 차올랐어요.', moment: '쉬는 시간을 지킨 순간' },
        { label: '쉬면서 동료와 오전 이야기를 나눈다', fx: { energy: 11, team: 6 }, reply: '“아까 그 일, 저도 그랬어요.” 웃으며 나눈 이야기가 오후의 손발을 맞춰 줘요.', moment: '동료와 쉬며 이야기 나눈 순간' },
        { label: '15분만 쉬고 밀린 일을 하러 간다', when: (s) => s.delay > 0, fx: { energy: 2, delay: -15, breakWorked: 15 }, reply: '밀린 일을 조금 따라잡았어요. 대신 쉬지 못한 15분은 일한 시간으로 적혀요.', moment: '쉬는 시간을 줄여 일을 따라잡은 순간' },
      ] },
    ...put('incident', { kind: 'choice', at: after(half + 50), place: job.room, ...p.incident }),
    { kind: 'pick', at: after(half + 120), place: p.pickPlace || job.room, ...p.pick },
    { kind: 'thanks', at: after(half * 2 - 40), place: p.firstPlace || job.room, title: '오늘 남은 한마디', body: '바쁜 하루 사이, 짧은 인사가 오래 남기도 해요.', speaker: `${job.person} 님`, lines: p.thanks },
    { kind: 'leave', at: job.shift.end, place: 'locker', title: '근무복을 벗고, 오늘을 접어요', body: '정해진 퇴근 시각이에요.' },
  ];
}
