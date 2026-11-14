// 약사 — 병원 약제실의 하루. 등장인물과 기록은 모두 가상이다.
// 약 이름이나 복용법을 가르치지 않는다. 판단은 설명할 시간, 확인하는 방법, 팀과 나누는 일만 다룬다.
import { hospitalDay } from './_hospital-day.js';

const job = {
  id: 'pharmacist', name: '약사', title: '병원 약제실의 하루', place: 'hospital', room: 'pharmacy',
  careernet: '23', color: '#89a9af', look: { coat: '#f7f7f1', hair: 1, outfit: 'white' }, uniform: '가운',
  pay: 'salary', shift: { start: '09:00', end: '18:00', breakMin: 60 },
  person: '오가온',
  intro: '처방을 검토하고 의료진과 확인하며, 환자가 약에 관한 설명을 이해할 수 있도록 돕는 하루예요.',
};

job.scenes = hospitalDay(job, {
  records: [['오늘의 일정', '처방 검토 · 조제 과정 확인 · 상담'], ['가상 접수번호', 'PH-0624'], ['가온 님의 요청', '설명을 다시 듣고 싶음 · 질문 메모 있음']],
  first: {
    title: '첫 만남의 한마디', body: '상담 창구에 가온 님이 메모를 들고 왔어요. 검토할 처방도 쌓여 있어요.',
    speaker: '가상 인물 · 오가온', speech: '“받은 설명 중 헷갈리는 부분을 다시 여쭤보고 싶어요.”',
    options: [
      { label: '가온 님의 질문 메모를 처음부터 하나씩 함께 짚는다', fx: { care: 11, delay: 14, energy: -3 }, reply: '메모의 물음표가 하나씩 지워졌어요. 그동안 검토할 처방이 더 쌓였어요.', moment: '질문 메모를 함께 짚은 순간', type: 'S' },
      { label: '가장 헷갈리는 한 가지를 먼저 풀고, 나머지는 안내문으로 드린다', fx: { care: 6, delay: 5 }, flag: 'sheet', reply: '“이게 제일 궁금했어요.” 나머지는 집에서 볼 수 있는 안내문에 담았어요.', moment: '가장 급한 질문부터 푼 순간', type: 'C' },
      { label: '처방 검토를 먼저 마치고, 오후 상담 시간을 잡아 드린다', fx: { care: -1, team: 4 }, flag: 'appointment', reply: '“3시에 다시 올게요.” 처방 검토가 제때 이어졌어요. 오후에 지킬 약속이 생겼어요.', moment: '상담 시간을 따로 잡은 순간', type: 'C' },
    ],
  },
  order: {
    title: '한 번 더 확인하는 아침', body: '바쁘게 들어오는 처방 사이에서도 확인 과정을 건너뛰지 않아요. 순서를 맞춰 보세요.',
    steps: ['처방을 접수하기', '대상자 정보와 처방 내용 대조하기', '확인이 필요한 부분은 담당 의료진에게 묻기', '확인된 처방의 조제와 복약 안내 준비하기'],
    why: '누구의 처방인지, 맞는 처방인지 확인한 뒤에 준비해야 해요.', moment: '처방 확인 순서를 맞춘 순간', type: 'C',
  },
  team: {
    title: '혼자 하는 일이 아니니까', body: '확인이 필요한 처방이 하나 있어요.',
    speaker: '약제실 동료', speech: '“이 처방, 의료진에게 어떻게 물어볼까요?”',
    options: [
      { label: '담당 의료진에게 직접 전화해 바로 확인한다', fx: { team: 5, delay: 6, energy: -3 }, reply: '통화 한 번에 답을 받았어요. 다른 일은 잠깐 멈췄어요.', moment: '직접 전화해 확인한 순간', type: 'E' },
      { label: '메신저로 묻고, 답이 올 때까지 다른 처방을 먼저 본다', fx: { team: 2, delay: 2 }, flag: 'waiting', reply: '질문을 보내 두고 다음 처방을 봐요. 답은 아직이에요.', moment: '질문을 보내 두고 다른 일을 이어 간 순간', type: 'C' },
      { label: '질문을 모아 두었다가 오후 회의 때 한꺼번에 묻는다', fx: { energy: 3, team: -2 }, flag: 'batched', reply: '오전이 조용히 지나갔어요. 그 처방은 아직 멈춰 있어요.', moment: '질문을 모아 두기로 한 순간', type: 'C' },
    ],
  },
  incident: {
    title: '계획대로만 흘러가진 않아요', body: '상담 요청이 몰려, 동료와 상담 시간을 나눠야 해요.',
    speaker: '약제실 동료', speech: '“상담 기다리시는 분이 다섯 분이에요!”',
    ripple: [
      { if: (s) => s.flags.batched, text: '오전에 미뤄 둔 질문의 답을 아직 못 받아, 처리할 처방까지 쌓였어요.', fx: { delay: 8, team: -3 } },
      { if: (s) => s.flags.waiting, text: '메신저 답이 와 있어요. 멈춰 있던 처방 하나가 풀렸어요.', fx: { delay: -4 } },
      { if: (s) => s.flags.appointment, text: '가온 님과 잡아 둔 오후 상담 시간도 다가와요.', fx: { energy: -3 } },
    ],
    options: [
      { label: '오래 기다린 분부터 내가 맡고, 나머지는 동료에게 부탁한다', fx: { care: 6, team: 3, delay: 8, energy: -4 }, reply: '동료와 나눠 맡으니 줄이 줄어들기 시작해요.', moment: '동료와 상담을 나눈 순간', type: 'E' },
      { label: '한 분 한 분 충분히 시간을 들여 설명한다', fx: { care: 10, team: -5, delay: 14, energy: -3 }, reply: '설명을 들은 분들은 고개를 끄덕여요. 기다리는 줄은 동료가 버텨 줬어요.', moment: '한 분씩 충분히 설명한 순간', type: 'S' },
      { label: '자주 묻는 내용을 짧은 안내문으로 만들어 함께 드린다', fx: { care: 4, team: 2, delay: 6, energy: -2 }, reply: '같은 질문이 줄었어요. 안내문을 만드는 데 시간이 조금 들었어요.', moment: '안내문을 만들어 나눈 순간', type: 'A' },
    ],
  },
  pick: {
    id: 'handoff', title: '질문을 이어 주는 기록', body: '상담 기록에 꼭 남길 것 세 가지를 골라요.', need: 3, moment: '상담 기록을 고른 순간', type: 'C',
    items: [
      { label: '가온 님이 헷갈려한 부분', ok: true },
      { label: '오늘 다시 설명한 내용', ok: true },
      { label: '아직 답을 기다리는 질문', ok: true },
      { label: '가온 님 가족의 병에 대한 내 짐작', ok: false, why: '확인하지 않은 짐작은 기록에 남기지 않아요.' },
      { label: '“이 약은 안 먹어도 될 것 같다.”는 내 생각', ok: false, why: '처방을 바꾸는 판단은 담당 의료진과 함께 정해요.' },
      { label: '상담실 밖에서 들은 다른 환자 이야기', ok: false, why: '다른 사람의 이야기는 이 기록에 넣지 않아요.' },
    ],
  },
  thanks: [
    { if: (s) => s.flags.appointment && s.delay >= 15, text: '“약속한 상담이 조금 늦어졌지만, 기다린 보람이 있었어요.”' },
    { if: (s) => s.g.care >= 65, text: '“제가 헷갈렸던 부분부터 다시 짚어 주셔서 고마워요. 질문을 적어 오길 잘했네요.”', fx: { care: 2 } },
    { if: (s) => s.flags.sheet, text: '“안내문에 적어 주신 건 집에서 다시 볼게요.”', fx: { care: 2 } },
    { text: '“다들 바쁘신 것 같아서 메모를 다 못 여쭤봤어요.”' },
  ],
});

export default job;
