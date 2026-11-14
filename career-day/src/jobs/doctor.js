// 의사 — 외과 의사의 하루. 등장인물과 기록은 모두 가상이다.
// 수술이나 진단 방법을 가르치지 않는다. 판단은 설명할 시간, 팀과 나누는 일, 늦어질 때 알리는 일만 다룬다.
import { hospitalDay } from './_hospital-day.js';

const job = {
  id: 'doctor', name: '의사', title: '외과 의사의 하루', place: 'hospital', room: 'clinic',
  careernet: '25', color: '#98bbd3', look: { coat: '#f7f8f3', hair: 0, outfit: 'white' }, uniform: '가운',
  pay: 'salary', shift: { start: '08:00', end: '17:00', breakMin: 60 },
  person: '윤하늘',
  intro: '회진으로 아침을 열고, 수술팀과 호흡을 맞춰요. 수술은 의사 혼자가 아니라 여러 전문직이 함께 하는 일이에요.',
};

job.scenes = hospitalDay(job, {
  records: [['오늘의 일정', '아침 회진 · 오전 수술 · 오후 퇴원 설명'], ['하늘 님의 말', '퇴원 뒤 생활이 걱정됨'], ['팀 메모', '설명 시간을 잡고 담당 간호사와 공유']],
  firstPlace: 'ward',
  first: {
    title: '첫 만남의 한마디', body: '아침 회진. 하늘 님 병실 뒤로도 돌아야 할 병실이 많이 남았어요.',
    speaker: '가상 인물 · 윤하늘', speech: '“퇴원하고 나서 일상으로 잘 돌아갈 수 있을지 걱정돼요.”',
    options: [
      { label: '의자를 끌어 앉아 걱정을 끝까지 듣는다', fx: { care: 12, delay: 15, energy: -3 }, reply: '하늘 님이 이야기를 다 꺼내 놓았어요. 다음 병실 회진은 15분 늦어졌어요.', moment: '하늘 님 곁에 앉아 끝까지 들은 순간', type: 'S' },
      { label: '가장 큰 걱정 두 가지만 듣고, 나머지는 퇴원 설명 때 함께 보자고 한다', fx: { care: 5, delay: 5 }, flag: 'later', reply: '“그럼 그때 마저 여쭤볼게요.” 회진은 크게 밀리지 않았어요. 오후에 지킬 약속이 생겼어요.', moment: '걱정을 나눠 오후로 이어 둔 순간', type: 'C' },
      { label: '담당 간호사에게 하늘 님의 질문을 모아 달라고 부탁하고 다음 병실로 간다', fx: { team: 5, care: 1 }, flag: 'nurseNotes', reply: '간호사가 “제가 정리해 둘게요.” 해요. 회진은 제때 이어졌어요.', moment: '간호사와 질문 모으기를 나눈 순간', type: 'E' },
    ],
  },
  orderPlace: 'theatre',
  order: {
    title: '수술실, 함께 맞추는 호흡', body: '오전 수술. 여러 전문직이 각자의 역할을 맡아요. 함께 하는 순서를 맞춰 보세요.',
    steps: ['수술복으로 갈아입고 팀 브리핑 듣기', '수술 전에 팀이 함께 환자와 계획 확인하기', '수술 중 서로의 신호에 집중하기', '마친 뒤 병동에 인계 기록 남기기'],
    why: '여럿이 함께 하는 수술은 시작 전에 함께 확인하고, 마친 뒤 기록으로 이어 줘야 안전해요.', moment: '수술팀과 순서를 맞춘 순간', type: 'R',
  },
  team: {
    title: '혼자 하는 일이 아니니까', body: '수술을 마치고 팀 회의. 오후 퇴원 설명을 준비해요.',
    speaker: '함께 일하는 동료', speech: '“하늘 님 퇴원 설명, 누가 어떻게 하면 좋을까요?”',
    options: [
      { label: '내가 직접 맡아 처음부터 끝까지 설명한다', fx: { care: 6, team: 2, energy: -5, delay: 8 }, reply: '하늘 님이 의사에게 직접 듣게 됐어요. 오후 내 일이 꽤 늘었어요.', moment: '설명을 직접 맡은 순간', type: 'S' },
      { label: '간호사·약사와 나눠 각자 맡은 부분을 설명하기로 한다', fx: { team: 8, care: 3, delay: 4 }, reply: '생활 관리는 간호사가, 약은 약사가, 수술 이야기는 내가. 설명이 촘촘해졌어요.', moment: '설명을 전문직끼리 나눈 순간', type: 'E' },
      { label: '설명 자료를 한 장으로 만들어 두고 질문만 받는다', fx: { care: 2, energy: 2, delay: 3 }, flag: 'handout', reply: '그림을 넣은 한 장짜리 자료가 생겼어요. 하늘 님이 집에서도 볼 수 있어요.', moment: '설명 자료를 만든 순간', type: 'A' },
    ],
  },
  incident: {
    title: '계획대로만 흘러가진 않아요', body: '응급 수술이 생겨 오후 일정이 밀려요. 하늘 님 보호자도 늦게 도착한대요.',
    speaker: '팀 연락', speech: '“선생님, 응급 수술 들어가셔야 해요!”',
    ripple: [
      { if: (s) => s.flags.nurseNotes, text: '아침에 간호사가 모아 둔 하늘 님 질문 목록이 도착했어요. 무엇을 설명해야 할지 바로 보여요.', fx: { care: 3 } },
      { if: (s) => s.flags.later, text: '“퇴원 설명 때 함께 보자.”고 한 시간이 응급 수술과 겹쳤어요.', fx: { delay: 6, care: -3 } },
    ],
    options: [
      { label: '하늘 님께 직접 가서 늦어지는 까닭을 짧게 알리고 수술에 들어간다', fx: { care: 6, delay: 8, energy: -4 }, reply: '“다른 분이 급하시군요. 기다릴게요.” 하늘 님이 고개를 끄덕여요.', moment: '늦어지는 까닭을 직접 알린 순간', type: 'S' },
      { label: '담당 간호사에게 대신 알려 달라고 부탁하고 바로 수술에 들어간다', fx: { team: 5, care: -2, delay: 2 }, reply: '수술은 제때 시작됐어요. 하늘 님은 간호사에게 소식을 들었어요.', moment: '간호사에게 알림을 부탁한 순간', type: 'E' },
      { label: '퇴원 설명을 동료 의사에게 넘기고 수술에 집중한다', fx: { team: 3, care: 2, delay: 5, energy: -2 }, reply: '동료가 설명을 맡아 줬어요. 동료에게 하늘 님 이야기를 넘기는 데 시간이 조금 들었어요.', moment: '동료 의사에게 설명을 넘긴 순간', type: 'C' },
    ],
  },
  pickPlace: 'clinic',
  pick: {
    id: 'handoff', title: '퇴원 설명에 꼭 넣을 것', body: '하늘 님 퇴원 설명에 꼭 넣을 것 세 가지를 골라요.', need: 3, moment: '퇴원 설명을 고른 순간', type: 'C',
    items: [
      { label: '다음 진료 날짜', ok: true },
      { label: '집에서 조심할 일과 그 까닭', ok: true },
      { label: '불편할 때 연락할 곳', ok: true },
      { label: '수술 중 있었던 팀원의 작은 실수 이야기', ok: false, why: '환자에게 필요한 정보만 전해요. 팀의 일은 팀 안에서 다뤄요.' },
      { label: '“금방 다 나을 거예요.”라는 약속', ok: false, why: '회복은 사람마다 달라요. 결과를 약속하는 말은 하지 않아요.' },
      { label: '옆 병실 환자의 수술 이야기', ok: false, why: '다른 사람의 정보는 그 사람에게만 속해요.' },
    ],
  },
  thanks: [
    { if: (s) => s.g.care >= 65, text: '“아침에 한 걱정을 기억하고 계셨네요. 이제 집에 가서 뭘 해야 할지 알겠어요.”', fx: { care: 2 } },
    { if: (s) => s.flags.handout, text: '“주신 자료, 집에 가서 가족이랑 같이 볼게요.”', fx: { care: 2 } },
    { if: (s) => s.flags.nurseNotes, text: '“간호사 선생님이 제 질문을 다 적어 가셨더라고요. 하나도 안 빠졌어요.”', fx: { team: 2 } },
    { text: '“바쁘신데 붙잡기 미안해서 다 못 여쭤봤어요.”' },
  ],
});

export default job;
