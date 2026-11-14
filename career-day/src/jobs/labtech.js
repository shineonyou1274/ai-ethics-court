// 임상병리사 — 진단검사실의 하루. 등장인물과 기록은 모두 가상이다.
// 검사 방법을 가르치지 않는다. 판단은 확인하는 시간, 알리는 방법, 팀과의 조율만 다룬다.
import { hospitalDay } from './_hospital-day.js';

const job = {
  id: 'labtech', name: '임상병리사', title: '진단검사실의 하루', place: 'hospital', room: 'lab',
  careernet: '941', color: '#a89dc9', look: { coat: '#c7bedc', hair: 0, outfit: 'scrub' }, uniform: '검사실 근무복',
  pay: 'salary', shift: { start: '08:30', end: '17:30', breakMin: 60 },
  person: '김새봄',
  intro: '검체를 받는 순간부터 확인, 검사, 결과 전달까지. 결과를 기다리는 사람과 의료진을 정확하게 이어 줘요.',
};

job.scenes = hospitalDay(job, {
  records: [['오늘의 일정', '검체 접수 · 장비 점검 · 검사 기록'], ['가상 의뢰번호', 'LAB-0318'], ['팀 메모', '확인된 진행 상태만 담당 팀에 전달']],
  first: {
    title: '첫 만남의 한마디', body: '검사실 창구로 새봄 님이 찾아왔어요. 뒤에서는 검체가 계속 들어와요.',
    speaker: '가상 인물 · 김새봄', speech: '“제 검사가 어디까지 진행됐는지 궁금해요.”',
    options: [
      { label: '진행 상황을 찾아 지금 단계와 남은 시간을 자세히 알려 준다', fx: { care: 10, delay: 12, energy: -3 }, reply: '“아, 이제 거의 끝났군요.” 새봄 님 얼굴이 풀렸어요. 그동안 들어온 검체가 쌓였어요.', moment: '진행 상황을 자세히 알려 드린 순간', type: 'S' },
      { label: '예상 시간만 알려 드리고, 결과는 담당 의료진이 설명한다고 안내한다', fx: { care: 3, team: 3, delay: 2 }, reply: '“그렇군요, 진료실에서 기다릴게요.” 검사실 일은 멈추지 않았어요.', moment: '맡은 범위를 지켜 안내한 순간', type: 'C' },
      { label: '접수 화면의 단계 표시를 새봄 님과 함께 읽는다', fx: { care: 6, delay: 6 }, flag: 'showedScreen', reply: '“접수, 검사 중, 확인… 지금 여기군요.” 다음에 혼자서도 볼 수 있게 됐어요.', moment: '단계 표시를 함께 읽은 순간', type: 'I' },
    ],
  },
  order: {
    title: '작은 라벨, 큰 책임', body: '검체마다 그 결과를 기다리는 사람이 있어요. 일의 순서를 맞춰 보세요.',
    steps: ['검체 라벨과 의뢰 기록 대조하기', '장비 점검 기록 확인하기', '검사를 진행하고 결과 살피기', '확인된 결과를 담당 팀에 전달하기'],
    why: '누구의 검체인지 먼저 맞아야, 장비와 결과도 믿을 수 있어요.', moment: '검체 확인 순서를 맞춘 순간', type: 'C',
  },
  team: {
    title: '혼자 하는 일이 아니니까', body: '검사실 회의. 오늘 오후에 장비 점검이 잡혀 있어요.',
    speaker: '검사실 동료', speech: '“오후 장비 점검 동안 들어오는 검사는 어떻게 할까요?”',
    options: [
      { label: '점검 전에 급한 검사부터 먼저 돌려 두자고 한다', fx: { team: 6, delay: 6, energy: -4 }, flag: 'priority', reply: '급한 검사부터 줄을 세웠어요. 오전이 조금 더 바빠졌어요.', moment: '급한 검사를 먼저 챙긴 순간', type: 'E' },
      { label: '점검 시간을 병동에 미리 알린다', fx: { care: 5, team: 2, delay: 4 }, flag: 'notified', reply: '병동에서 “그 시간은 피해서 보낼게요.” 하고 답이 왔어요.', moment: '점검 시간을 미리 알린 순간', type: 'C' },
      { label: '점검이 끝나면 한꺼번에 처리하기로 한다', fx: { energy: 3 }, reply: '회의가 금방 끝났어요. 점검 시간에 들어올 검사는 아직 아무도 몰라요.', moment: '나중에 몰아서 하기로 한 순간', type: 'C' },
    ],
  },
  incident: {
    title: '계획대로만 흘러가진 않아요', body: '접수된 검체 하나의 라벨 일부가 번져 있어요.',
    speaker: '검사실 동료', speech: '“이 라벨, 이름 끝 글자가 안 보여요.”',
    ripple: [
      { if: (s) => !s.flags.priority && !s.flags.notified, text: '장비 점검 시간에 들어온 검사까지 한꺼번에 쌓였어요.', fx: { delay: 8, care: -3 } },
      { if: (s) => s.flags.priority, text: '급한 검사를 미리 돌려 둔 덕에 확인할 여유가 조금 있어요.', fx: { delay: -5 } },
    ],
    options: [
      { label: '의뢰한 병동에 연락해, 확인될 때까지 이 검사를 멈춘다', fx: { care: 4, team: 3, delay: 12 }, reply: '병동이 확인해 줄 때까지 기다렸어요. 틀린 결과가 나갈 일은 없어요.', moment: '확인될 때까지 멈춘 순간', type: 'C' },
      { label: '접수 기록, 바코드, 의뢰서를 하나씩 대조해 확인하고 병동에 알린다', fx: { care: 3, team: 1, delay: 8, energy: -5 }, reply: '세 기록이 모두 같은 사람을 가리켰어요. 병동에도 확인 결과를 알렸어요.', moment: '기록을 대조해 원인을 찾은 순간', type: 'I' },
      { label: '다시 채혈이 필요할 수 있다고 담당 팀에 알리고 다음 검체로 넘어간다', fx: { team: 6, care: -3, delay: 3 }, reply: '검사실 일은 이어졌어요. 그 환자는 피를 한 번 더 뽑아야 할 수도 있어요.', moment: '다시 받기로 하고 넘어간 순간', type: 'E' },
    ],
  },
  pick: {
    id: 'handoff', title: '결과를 기다리는 팀에게', body: '담당 팀에 보낼 메시지에 꼭 넣을 것 세 가지를 골라요.', need: 3, moment: '전달할 내용을 고른 순간', type: 'C',
    items: [
      { label: '검체 번호와 대상자 확인을 마쳤다는 것', ok: true },
      { label: '끝난 검사와 아직 진행 중인 검사', ok: true },
      { label: '장비 점검으로 늦어질 수 있는 예상 시간', ok: true },
      { label: '결과를 보고 한 내 짐작: “큰 문제 없을 듯”', ok: false, why: '결과를 해석해 설명하는 건 담당 의료진의 일이에요.' },
      { label: '번진 라벨에서 짐작해 채운 이름', ok: false, why: '짐작한 정보는 적지 않아요. 확인된 것만 전해요.' },
      { label: '다른 사람의 검사 결과도 함께 붙여 보내기', ok: false, why: '필요한 사람에게 필요한 결과만 보내요. 개인정보예요.' },
    ],
  },
  thanks: [
    { if: (s) => s.g.care >= 65, text: '“진행 상황을 알려 주셔서 기다리는 게 덜 답답했어요.”', fx: { care: 2 } },
    { if: (s) => s.flags.showedScreen, text: '“단계 표시를 같이 봐서, 이제 어디쯤인지 혼자서도 알겠어요.”', fx: { care: 2 } },
    { text: '“검사실은 처음 봤어요. 이렇게 확인할 게 많은 줄 몰랐네요.”' },
  ],
});

export default job;
