// 의사 — 외과 의사의 하루. 등장인물과 기록은 모두 가상이다.
// 판단은 설명할 시간, 팀과 나누는 일, 늦어질 때 알리는 일을 다룬다.
// 손으로 하는 일(손 위생, 환자 확인, 수술 복장, 봉합)은 시중 체험처럼 단순하게 그리고, 진단이나 치료 판단은 가르치지 않는다.
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
  // 손으로 하는 일 ①② — 회진 전에 손 위생, 병실에서 팔찌로 환자 확인
  before: {
    first: [
      {
        kind: 'hands', game: 'scrub', atOff: 12, place: 'ward', title: '병실에 들어가기 전, 손부터',
        body: '회진을 시작해요. 환자를 만나기 전과 후에는 꼭 손 위생을 해요. 거품 낸 손 위의 균을 손가락으로 문질러 지워 보세요.',
        moment: '손 위생 여섯 단계를 지킨 순간', type: 'C',
        fact: '세계보건기구(WHO)는 손바닥, 손등, 손가락 사이, 손가락 마디, 엄지, 손끝까지 여섯 단계로 꼼꼼히 문지르라고 권해요. 물로 씻을 때는 40~60초가 걸려요.',
        grades: {
          thorough: { fx: { care: 1, delay: 2 }, flag: 'cleanHands', text: '여섯 단계를 모두 마쳤어요. 손끝까지 개운해요. 회진은 2분 늦게 시작했어요.' },
          rushed: { fx: { energy: 1 }, flag: 'rushedHands', moment: '손 위생을 서둘러 마친 순간', text: '몇 단계만 빠르게 문지르고 나왔어요. 회진은 제때 시작해요.' },
        },
      },
      {
        kind: 'hands', game: 'band', atOff: 18, place: 'ward', title: '이분이 하늘 님이 맞나요?',
        body: '하늘 님 병실이에요. 이 병실에는 비슷한 이름의 환자분이 있어요. 팔찌를 읽고 차트와 두 가지 이상이 맞는 분을 찾아요.',
        moment: '팔찌로 환자를 확인한 순간', type: 'C',
        fact: '병원에서는 이름 하나만으로 환자를 확인하지 않아요. 이름과 생년월일(또는 등록번호)처럼 두 가지 이상을 견주어 확인해요.',
        chart: { name: '윤하늘', birth: '1968.04.12', no: '20-0412' },
        beds: [
          { bed: '1번 침대', name: '윤하람', birth: '1968.04.12', no: '20-0419', hair: '#6b4f3a', say: '(창가 쪽 환자분이 고개를 들어요) “선생님, 저 부르셨어요?”' },
          { bed: '2번 침대', name: '윤하늘', birth: '1975.09.03', no: '21-0903', hair: '#2f2a28', say: '“네, 제가 윤하늘이에요!”' },
          { bed: '3번 침대', name: '윤하늘', birth: '1968.04.12', no: '20-0412', hair: '#8c8c8c', say: '(책을 덮으며) “아, 회진 시간이군요.”', right: true },
        ],
        ripple: [{ if: (s) => s.flags.rushedHands, text: '병실 앞에서 감염관리 간호사가 손 소독제를 건네요. “환자분 만나기 전에 한 번 더요.”', fx: { delay: 2, team: -1 } }],
        grades: {
          sure: { fx: { care: 1, team: 2 }, text: '두 가지 정보가 모두 맞는 분을 한 번에 찾았어요.' },
          recheck: { fx: { care: 1, delay: 4 }, moment: '팔찌를 다시 확인해 바로잡은 순간', text: '한 번 엇갈렸지만 다시 확인해서 바로잡았어요. 확인하는 데 시간이 조금 더 들었어요.' },
        },
      },
    ],
  },
  // 손으로 하는 일 ③ — 수술 복장과 타임아웃
  order: {
    kind: 'hands', game: 'gown', title: '수술실, 나를 먼저 준비해요',
    body: '오전 수술. 멸균 상태를 지키려면 입는 순서가 정해져 있어요. 순서대로 끌어다 입고, 시작 전에 팀이 함께 확인해요.',
    moment: '수술복을 갖춰 입고 팀과 확인한 순간', type: 'R',
    fact: '수술실에서는 시작 직전에 팀 모두가 손을 멈추고 환자, 수술 부위, 수술 이름을 함께 소리 내어 확인해요. 이것을 타임아웃이라고 해요.',
    items: [
      { id: 'cap', rank: 0, icon: '🧢', label: '수술 모자', tip: '머리카락이 떨어지지 않게 모자를 썼어요.' },
      { id: 'mask', rank: 0, icon: '😷', label: '마스크', tip: '코와 입을 덮었어요.' },
      { id: 'scrub', rank: 1, icon: '🧼', label: '수술 전 손 세척', tip: '손끝부터 팔꿈치까지 몇 분 동안 꼼꼼히 씻었어요. 이제 씻은 손은 가슴 높이로 들어요.' },
      { id: 'gown', rank: 2, icon: '🥼', label: '멸균 가운', tip: '간호사가 펼쳐 준 멸균 가운에 팔을 넣었어요.' },
      { id: 'gloves', rank: 3, icon: '🧤', label: '멸균 장갑', tip: '장갑이 가운 소매를 덮도록 꼈어요.' },
    ],
    timeout: [
      { who: '수술실 간호사', icon: '🩺', say: '“환자분 윤하늘 님, 1968년 4월 12일생. 확인했습니다.”' },
      { who: '마취과 의사', icon: '💤', say: '“마취 준비와 환자분 상태, 확인했습니다.”' },
      { who: '나 · 집도의', icon: '🙋', say: '“오늘 할 수술과 수술 부위 표시, 확인했습니다.”' },
    ],
    grades: {
      ready: { fx: { team: 4 }, text: '한 번에 갖춰 입었어요. 타임아웃까지 마치자 팀이 고개를 끄덕여요.' },
      redo: { fx: { delay: 5, team: -1, energy: -2 }, moment: '수술복을 다시 갖춰 입은 순간', text: '순서가 엇갈린 부분을 새로 갖췄어요. 팀이 잠깐 기다렸어요.' },
    },
  },
  // 손으로 하는 일 ④ — 피부 봉합
  after: {
    order: [
      {
        kind: 'hands', game: 'suture', atOff: 115, place: 'theatre', title: '마지막 한 땀',
        body: '수술을 마치고 피부를 닫아요. 지도하는 선배 의사가 곁에서 지켜봐요. 바늘을 위 점에서 아래 점까지 끌어 한 땀씩 꿰매요.',
        moment: '고른 간격으로 봉합한 순간', type: 'R',
        fact: '봉합은 오래 연습해야 느는 손기술이에요. 외과 의사는 연습용 모형으로 수없이 꿰매 보며 익혀요.',
        grades: {
          neat: { fx: { team: 3, energy: -3 }, text: '다섯 땀이 고르게 놓였어요. “좋아요, 깔끔해요.” 선배가 고개를 끄덕여요.' },
          retie: { fx: { delay: 6, energy: -4 }, moment: '봉합을 다시 꿰맨 순간', text: '몇 땀을 다시 꿰맸어요. “서두르지 말고, 간격부터 봐요.” 시간이 조금 더 들었어요.' },
        },
      },
    ],
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
