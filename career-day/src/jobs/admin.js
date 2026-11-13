// 원무행정 직원 — 접수와 안내의 하루. 등장인물과 기록은 모두 가상이다.
import { hospitalDay } from './_hospital-day.js';

const job = {
  id: 'admin', name: '원무행정 직원', title: '접수와 안내의 하루', place: 'hospital', room: 'reception',
  careernet: '1257', careernetNote: '커리어넷에 원무행정 직원이 따로 없어서, 임금은 가까운 직업인 병원코디네이터의 자료를 썼어요. 실제 임금과 다를 수 있어요.',
  // 커리어넷에 없는 직업이라 '하는 일'은 직접 적는다. 병원 원무과의 일반적인 업무만 적었다.
  works: ['병원을 찾은 사람의 접수와 수납을 맡아요.', '진료 예약을 잡고, 바뀐 일정과 진료실 위치를 안내해요.', '진단서 같은 서류 발급을 돕고, 그 과정에서 개인정보를 지켜요.'],
  color: '#c7a569', look: { coat: '#d8b581', hair: 2, outfit: 'vest' }, uniform: '근무복',
  pay: 'salary', shift: { start: '08:30', end: '17:30', breakMin: 60 },
  person: '정이든',
  intro: '병원을 처음 찾은 사람의 막막함을 덜어요. 접수, 일정 연결, 서류 안내로 하루가 바빠요.',
};

job.scenes = hospitalDay(job, {
  recordsTitle: '오늘의 접수 현황 열기',
  records: [['오늘의 일정', '방문 접수 · 일정 확인 · 서류 안내'], ['가상 접수번호', 'ADM-0719'], ['공지', '오늘부터 2번 진료실이 3층으로 옮김']],
  first: {
    title: '첫 만남의 한마디', body: '아침 접수 창구에 줄이 길어요. 처음 온 이든 님이 다가와요.',
    speaker: '가상 인물 · 정이든', speech: '“처음 와서 어디로 가야 할지 모르겠어요.”',
    options: [
      { label: '창구를 잠시 비우고 진료실 앞까지 함께 걸어간다', fx: { care: 12, team: -5, delay: 10, energy: -3 }, reply: '“덕분에 안 헤맸어요.” 그동안 창구 줄은 더 길어졌어요.', moment: '이든 님과 함께 걸어간 순간', type: 'S' },
      { label: '안내도에 가는 길을 그려 드리고 다음 사람을 받는다', fx: { care: 5, delay: 2 }, reply: '이든 님이 안내도를 꼭 쥐고 걸어가요. 줄도 계속 줄어요.', moment: '안내도에 길을 그려 드린 순간', type: 'A' },
      { label: '안내 데스크 동료에게 함께 가 달라고 부탁한다', fx: { care: 7, team: 2, delay: 4, energy: -1 }, flag: 'askedHelp', reply: '동료가 이든 님을 모시고 갔어요. 동료 자리가 잠시 비었어요.', moment: '동료에게 안내를 부탁한 순간', type: 'E' },
    ],
  },
  order: {
    title: '처음 온 사람의 접수', body: '다음 방문자를 접수할 차례예요. 일의 순서를 맞춰 보세요.',
    steps: ['방문 목적 듣기', '신분과 예약 정보 확인하기', '접수하고 번호표 드리기', '갈 곳과 순서 안내하기'],
    why: '무엇 때문에 왔는지 들어야 맞는 접수를 할 수 있고, 접수가 끝나야 갈 곳을 알려 줄 수 있어요.', moment: '접수 순서를 맞춘 순간', type: 'C',
  },
  team: {
    title: '혼자 하는 일이 아니니까', body: '창구 직원 회의. 오늘부터 2번 진료실이 3층으로 옮겼어요.',
    speaker: '창구 동료', speech: '“진료실 바뀐 거, 방문하는 분들께 어떻게 알리죠?”',
    options: [
      { label: '큰 안내판을 만들어 엘리베이터 앞에 붙인다', fx: { care: 4, delay: 10, energy: -3 }, flag: 'sign', reply: '색 화살표까지 그린 안내판이 붙었어요. 만드는 데 시간이 걸렸어요.', moment: '안내판을 만든 순간', type: 'A' },
      { label: '창구 직원끼리 메신저로 바로 공유한다', fx: { team: 6, delay: 2 }, flag: 'shared', reply: '창구 직원은 모두 알게 됐어요. 방문자는 물어봐야 알 수 있어요.', moment: '동료들과 변경 사항을 맞춘 순간', type: 'C' },
      { label: '물어보는 분께 그때그때 알려 드린다', fx: { energy: 3 }, reply: '회의가 금방 끝났어요. 아직 모르는 방문자가 많아요.', moment: '그때그때 안내하기로 한 순간', type: 'S' },
    ],
  },
  incident: {
    title: '계획대로만 흘러가진 않아요', body: '진료실이 옮긴 걸 모르는 방문자들이 2층에서 기다리고 있대요.',
    speaker: '2층 직원', speech: '“여기 몇 분이 2번 진료실을 찾으세요!”',
    ripple: [
      { if: (s) => s.flags.sign, text: '엘리베이터 앞 안내판 덕분에 헤매는 분이 두 분뿐이에요.', fx: { delay: -6, care: 3 } },
      { if: (s) => !s.flags.sign && !s.flags.shared, text: '아무도 몰라서 기다리는 분이 많아요.', fx: { delay: 8, care: -4 } },
    ],
    options: [
      { label: '창구를 맡기고 직접 2층으로 올라가 안내한다', fx: { care: 9, team: -4, delay: 12, energy: -7 }, reply: '한 분 한 분 3층으로 모셨어요. 창구에 남은 동료가 줄을 혼자 맡았어요.', moment: '직접 올라가 안내한 순간', type: 'S' },
      { label: '2층 직원에게 전화로 안내를 부탁한다', fx: { team: 5, care: 2, delay: 4 }, reply: '2층 직원이 대신 안내했어요. 창구 줄도 멈추지 않았어요.', moment: '다른 층 동료와 힘을 모은 순간', type: 'C' },
      { label: '안내 방송을 요청한다', fx: { care: 4, team: 1, delay: 5, energy: -1 }, reply: '“2번 진료실은 3층으로 옮겼습니다.” 방송을 듣고 사람들이 움직여요.', moment: '방송으로 한꺼번에 알린 순간', type: 'E' },
    ],
  },
  pick: {
    id: 'handoff', title: '서류 한 장 너머의 사정', body: '이든 님이 서류 발급을 부탁해요. 꼭 확인할 것 세 가지를 골라요.', need: 3, moment: '서류 확인 항목을 고른 순간', type: 'C',
    items: [
      { label: '신분증으로 본인인지 확인', ok: true },
      { label: '어떤 서류가 필요한지 확인', ok: true },
      { label: '어디에 낼 서류인지 듣고 맞는 양식 안내', ok: true },
      { label: '줄 선 사람들이 다 들리게 진료 내용을 크게 확인', ok: false, why: '건강 정보는 다른 사람이 듣지 않게 확인해요.' },
      { label: '가족이라며 온 사람에게 확인 없이 대신 발급', ok: false, why: '본인 동의나 정해진 서류 없이 남에게 주면 안 돼요.' },
      { label: '빨리 하려고 다른 사람 서류와 한꺼번에 처리', ok: false, why: '서류가 섞이면 개인정보가 새어 나갈 수 있어요.' },
    ],
  },
  thanks: [
    { if: (s) => s.g.care >= 65, text: '“어디부터 해야 할지 몰랐는데, 혼자서도 찾아갈 수 있었어요.”', fx: { care: 2 } },
    { if: (s) => s.flags.askedHelp, text: '“같이 가 주신 분께도 고맙다고 전해 주세요.”', fx: { team: 2 } },
    { if: (s) => s.flags.sign, text: '“엘리베이터 앞 안내판 보고 바로 찾았어요.”', fx: { care: 2 } },
    { text: '“다들 바빠 보여서 그냥 물어물어 찾았어요.”' },
  ],
});

export default job;
