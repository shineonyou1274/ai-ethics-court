// 방사선사 — 영상검사실의 하루. 등장인물과 기록은 모두 가상이다.
// 검사 방법이나 영상 판독을 가르치지 않는다. 판단은 안내, 시간 조율, 팀과 나누는 일만 다룬다.
import { hospitalDay } from './_hospital-day.js';

const job = {
  id: 'radiographer', name: '방사선사', title: '영상검사실의 하루', place: 'hospital', room: 'imaging',
  careernet: '10', color: '#83a9c2', look: { coat: '#a9c6d9', hair: 2, outfit: 'scrub' }, uniform: '검사복',
  pay: 'salary', shift: { start: '09:00', end: '18:00', breakMin: 60 },
  person: '이로운',
  intro: '검사실의 장비와 사람을 함께 살펴요. 준비 확인, 검사 안내, 영상 전달로 이어지는 하루예요.',
};

job.scenes = hospitalDay(job, {
  records: [['오늘의 일정', '예약 확인 · 영상검사 · 기록 전달'], ['가상 예약번호', 'IMG-0512'], ['로운 님의 말', '검사 과정을 미리 알고 싶어 함']],
  first: {
    title: '첫 만남의 한마디', body: '큰 장비 앞에서 로운 님이 굳어 있어요. 대기실에는 다음 예약자들이 있어요.',
    speaker: '가상 인물 · 이로운', speech: '“기계가 낯설어요. 무엇을 하게 되는지 알고 싶어요.”',
    options: [
      { label: '장비를 함께 보며 소리와 움직임을 하나씩 미리 알려 준다', fx: { care: 11, delay: 12, energy: -3 }, reply: '“윙 소리가 나도 놀라지 않을게요.” 로운 님 어깨가 풀렸어요. 다음 예약이 밀렸어요.', moment: '장비를 함께 보며 설명한 순간', type: 'S' },
      { label: '검사 순서를 그린 카드를 보여 주고 질문을 받는다', fx: { care: 7, delay: 6 }, flag: 'card', reply: '그림 카드 네 장으로 순서를 짚었어요. “세 번째가 제일 길군요.”', moment: '그림 카드로 순서를 보여 드린 순간', type: 'A' },
      { label: '짧게 안내하고, 검사 중에도 마이크로 계속 말을 걸겠다고 약속한다', fx: { care: 4, team: 2, delay: 2 }, flag: 'mic', reply: '“혼자가 아니라는 거죠?” 검사는 제때 시작됐어요.', moment: '검사 중에도 곁에 있겠다고 약속한 순간', type: 'E' },
    ],
  },
  order: {
    title: '큰 장비 앞의 작은 긴장', body: '다음 검사를 준비할 차례예요. 일의 순서를 맞춰 보세요.',
    steps: ['예약과 의뢰 정보 확인하기', '검사실과 장비 준비하기', '대상자 본인 확인하고 과정 안내하기', '검사하고 영상을 담당 팀에 전달하기'],
    why: '맞는 검사인지 먼저 확인하고, 준비된 검사실에서 본인을 확인한 뒤 시작해요.', moment: '검사 준비 순서를 맞춘 순간', type: 'R',
  },
  team: {
    title: '혼자 하는 일이 아니니까', body: '병동과 오후 검사 일정을 맞춰요.',
    speaker: '병동 간호사', speech: '“환자분 검사실로 모시는 시간, 언제로 잡을까요?”',
    options: [
      { label: '검사실 상황을 보고 정확한 시간을 정해 알린다', fx: { team: 6, delay: 4, energy: -3 }, flag: 'fixedTime', reply: '“14시 20분으로 할게요.” 병동이 이동 준비를 시작했어요.', moment: '정확한 시간을 정해 알린 순간', type: 'E' },
      { label: '여유 있게 30분 간격으로 잡는다', fx: { care: 4, energy: 2, delay: 6 }, reply: '서두를 일은 없어졌어요. 대신 하루 검사 수가 줄어 뒤 예약이 밀려요.', moment: '여유 있게 간격을 잡은 순간', type: 'C' },
      { label: '앞 검사가 끝나면 그때 연락하겠다고 한다', fx: { energy: 3 }, flag: 'callLater', reply: '통화가 금방 끝났어요. 병동은 아직 언제 출발할지 몰라요.', moment: '시간을 뒤로 미룬 순간', type: 'C' },
    ],
  },
  incident: {
    title: '계획대로만 흘러가진 않아요', body: '앞 검사가 길어져, 다음 예약자들의 대기 시간이 늘어나요.',
    speaker: '대기실', speech: '“제 차례 아직인가요?”',
    ripple: [
      { if: (s) => s.flags.callLater, text: '이동 시간을 정해 두지 않아, 병동 환자분이 일찍 내려와 오래 기다리고 있어요.', fx: { delay: 8, care: -4 } },
      { if: (s) => s.flags.fixedTime, text: '이동 시간을 정확히 정해 둔 덕에 병동과는 엇갈리지 않아요.', fx: { team: 3 } },
    ],
    options: [
      { label: '대기실에 직접 나가 예상 시간을 알리고 사과한다', fx: { care: 8, team: -2, delay: 6, energy: -4 }, reply: '“알려 주시니 기다릴 만해요.” 그동안 검사실은 동료 혼자 맡았어요.', moment: '대기실에 나가 사정을 알린 순간', type: 'S' },
      { label: '동료와 검사실을 나눠 순서를 다시 짠다', fx: { team: 6, care: 3, delay: 8, energy: -3 }, reply: '다른 검사실을 함께 열어 순서를 나눴어요. 짜는 데 시간이 들었지만 줄이 줄어요.', moment: '동료와 순서를 다시 짠 순간', type: 'E' },
      { label: '순서대로 빠르게 진행하는 데 집중한다', fx: { care: -4, team: 2, energy: -5, delay: -4 }, reply: '밀린 시간을 조금 따라잡았어요. 기다리는 분들은 사정을 모른 채 앉아 있어요.', moment: '검사를 빠르게 이어 간 순간', type: 'R' },
    ],
  },
  pick: {
    id: 'handoff', title: '영상과 함께 보낼 기록', body: '담당 팀에 영상과 함께 보낼 기록에 꼭 넣을 것 세 가지를 골라요.', need: 3, moment: '함께 보낼 기록을 고른 순간', type: 'C',
    items: [
      { label: '검사한 부위와 검사 종류', ok: true },
      { label: '검사 중 대상자가 불편하다고 말한 점', ok: true },
      { label: '다시 찍은 사진이 있다면 그 까닭', ok: true },
      { label: '영상을 보고 내가 짐작한 진단', ok: false, why: '영상을 읽고 진단하는 건 의사의 일이에요.' },
      { label: '필요 없는 얼굴 사진도 함께 찍어 보내기', ok: false, why: '검사에 필요하지 않은 정보는 모으지 않아요.' },
      { label: '오늘 예약자 명단 전체', ok: false, why: '이 검사와 상관없는 다른 사람의 정보예요.' },
    ],
  },
  thanks: [
    { if: (s) => s.g.care >= 65, text: '“제가 질문할 때 기다려 주셔서 고마워요. 낯선 기계 앞에서도 혼자가 아닌 것 같았어요.”', fx: { care: 2 } },
    { if: (s) => s.flags.card, text: '“그림 카드 덕분에 다음 순서를 알고 있으니 덜 무서웠어요.”', fx: { care: 2 } },
    { if: (s) => s.flags.mic, text: '“마이크로 계속 말 걸어 주셔서 끝까지 버틸 수 있었어요.”', fx: { care: 2 } },
    { text: '“생각보다 금방 끝났네요. 그래도 좀 긴장했어요.”' },
  ],
});

export default job;
