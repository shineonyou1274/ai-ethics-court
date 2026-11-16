// 소방서 직업들이 함께 쓰는 하루의 틀. 직업 파일은 자기만의 고민(첫 만남, 팀, 출동, 손으로 하는 일)만 채운다.
// 오전은 살피고 준비하는 일(교대 점검, 예방 점검, 훈련), 오후는 출동과 그 뒤의 정리로 흐른다.
// 하루의 순서는 다른 일터와 같다(shared/DESIGN.md §4): 명찰 → 탈의 → 일하기 → 쉬는 시간 → 일하기 → 퇴근.
// 시각은 출근 시각에서 몇 분 뒤인지로 적는다. 쉬는 시간(break)을 지난 장면은 그만큼 뒤로 민다.
import { toHHMM, toMin } from '../engine.js';

export function fireStationDay(job, p) {
  const s0 = toMin(job.shift.start), br = job.shift.breakMin;
  const at = (off) => toHHMM(s0 + off);
  const half = Math.round((toMin(job.shift.end) - s0 - br) / 2); // 쉬는 시간이 시작되는 때(근무의 한가운데)
  const after = (off) => at(off + br);
  // 손으로 하는 장면(kind: 'hands')을 끼워 넣는다. p.before.first 는 그 장면 앞에, p.after.order 는 그 장면 뒤에 온다. atOff 는 출근 뒤 몇 분인지.
  const timed = (list = []) => list.map(({ atOff, ...x }) => ({ ...x, at: at(atOff) }));
  const wrap = (key, scene) => [...timed(p.before?.[key]), scene, ...timed(p.after?.[key])];
  return [
    { kind: 'reveal', at: at(-20), place: 'outside', title: '오늘의 명찰을 받았어요', body: job.intro },
    { kind: 'tasks', at: at(-10), place: 'locker', title: '옷을 갈아입으면, 하루 시작', body: '직원 출입구를 지나 대원 탈의실에 왔어요. 밤 근무 팀이 아직 자리를 지키고 있어요.',
      tasks: [{ label: '사물함에 가방 넣기', result: '가방을 내려놓았어요.', act: 'work' }, { label: `${job.uniform} 입고 명찰 달기`, result: `${job.uniform} 차림으로 밤 근무 팀과 인사를 나눴어요.`, act: 'dress' }] },
    { kind: 'records', at: at(0), place: job.room, title: p.recordsTitle || '먼저, 교대 기록부터', body: '밤사이 있었던 일과 오늘 할 일을 한 장씩 펼쳐 봐요.', records: p.records, moment: '교대 기록을 읽은 순간', type: 'C' },
    ...wrap('first', { kind: 'choice', at: at(40), place: p.firstPlace || job.room, ...p.first }),
    ...wrap('order', { kind: 'order', at: at(85), place: p.orderPlace || job.room, ...p.order }),
    { kind: 'choice', at: at(Math.round(half * 0.7)), place: 'meeting', ...p.team },
    { kind: 'choice', isBreak: true, at: at(half), place: 'lounge', title: '잠깐, 나도 숨을 고르기', body: `쉬는 시간 ${br}분. 벨이 울리면 바로 나가야 하니, 쉴 수 있을 때 쉬는 것도 일이에요.`,
      speaker: '동료', speech: '“먼저 먹고 와요. 무전은 제가 듣고 있을게요.”', fact: '근로기준법: 4시간 일하면 30분, 8시간 일하면 1시간 이상 쉬는 시간을 주어야 해요. 쉬는 시간에 일했다면 그건 일한 시간이에요.',
      options: [
        { label: '쉬는 시간을 다 쓰고 돌아간다', fx: { energy: 18 }, reply: '따뜻한 밥 한 그릇, 물 한 잔. 오후를 버틸 힘이 차올랐어요.', moment: '쉬는 시간을 지킨 순간' },
        { label: '쉬면서 동료와 오전 이야기를 나눈다', fx: { energy: 11, team: 6 }, reply: '“아까 호스 펼 때 손발이 잘 맞던데요.” 웃으며 나눈 이야기가 오후의 호흡을 맞춰 줘요.', moment: '동료와 쉬며 이야기 나눈 순간' },
        { label: '15분만 쉬고 밀린 일을 하러 간다', when: (s) => s.delay > 0, fx: { energy: 2, delay: -15, breakWorked: 15 }, reply: '밀린 일을 조금 따라잡았어요. 대신 쉬지 못한 15분은 일한 시간으로 적혀요.', moment: '쉬는 시간을 줄여 일을 따라잡은 순간' },
      ] },
    ...wrap('incident', { kind: 'choice', at: after(half + 50), place: p.incidentPlace || job.room, ...p.incident }),
    { kind: 'pick', at: after(half + 120), place: p.pickPlace || job.room, ...p.pick },
    { kind: 'thanks', at: after(half * 2 - 40), place: job.room, title: '오늘 남은 한마디', body: p.thanksBody || '바쁜 하루 사이, 짧은 인사가 오래 남기도 해요.', speaker: `${job.person} 님`, lines: p.thanks },
    { kind: 'leave', at: job.shift.end, place: 'locker', title: `${job.uniform}을 벗고, 오늘을 접어요`, body: '정해진 퇴근 시각이에요. 저녁 근무 팀이 들어와요.' },
  ];
}
