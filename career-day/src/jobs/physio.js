// 물리치료사 — 재활치료실의 하루. 등장인물과 기록은 모두 가상이다.
// 치료 방법을 가르치지 않는다. 판단은 시간, 소통, 팀과의 조율에 관한 것만 다룬다.
import { hospitalDay } from './_hospital-day.js';

const job = {
  id: 'physio', name: '물리치료사', title: '재활치료실의 하루', place: 'hospital', room: 'rehab',
  careernet: '369', color: '#c89884', look: { coat: '#d9aa98', hair: 0, outfit: 'scrub' }, uniform: '치료복',
  pay: 'salary', shift: { start: '09:00', end: '18:00', breakMin: 60 },
  person: '한서우',
  intro: '환자가 되찾고 싶은 일상을 듣고, 담당 팀이 세운 재활 계획에 따라 작은 변화를 함께 살펴요.',
};

job.scenes = hospitalDay(job, {
  records: [['오늘의 일정', '개별 치료 · 재활팀 회의'], ['서우 님의 목표', '동네 빵집에 스스로 다녀오기'], ['지난 기록', '움직임이 걱정된다고 말함']],
  first: {
    title: '첫 만남의 한마디', body: '치료실에 들어선 서우 님이 창밖을 보며 말해요. 다음 예약 환자도 곧 와요.',
    speaker: '가상 인물 · 한서우', speech: '“동네 빵집에 제 발로 다시 가 보고 싶어요.”',
    options: [
      { label: '빵집까지의 거리, 계단, 쉬어 갈 곳을 자세히 묻는다', fx: { care: 9, delay: 12, energy: -3 }, flag: 'goalSplit', reply: '“계단이 다섯 칸 있어요. 중간에 벤치도 있고요.” 막연한 바람이 구체적인 길이 됐어요.', moment: '목표를 작은 길로 쪼갠 순간', type: 'I' },
      { label: '좋은 목표라고 기록하고, 계획된 치료부터 시작한다', fx: { team: 3, care: 2 }, reply: '치료가 제때 시작됐어요. 목표는 기록에 한 줄로 남았어요.', moment: '계획대로 치료를 시작한 순간', type: 'C' },
      { label: '“금방 가실 수 있을 거예요!” 하고 크게 응원한다', fx: { care: 8, energy: -1 }, flag: 'overpromise', reply: '서우 님 얼굴이 환해져요. 그런데 ‘금방’은 내가 약속할 수 있는 말이었을까요?', moment: '크게 응원한 순간', type: 'S' },
    ],
  },
  order: {
    title: '치료 시간을 준비해요', body: '오전 치료를 시작할 차례예요. 일의 순서를 맞춰 보세요.',
    steps: ['담당 팀의 치료 계획 확인하기', '계획에 맞게 치료 공간 정리하기', '서우 님과 함께 치료 진행하기', '반응과 변화를 기록하기'],
    why: '계획을 알아야 공간을 맞게 준비하고, 진행한 것을 남겨야 다음 치료로 이어져요.', moment: '치료 준비 순서를 맞춘 순간', type: 'R',
  },
  team: {
    title: '혼자 하는 일이 아니니까', body: '재활팀 회의. 여러 전문직이 맡을 일을 맞춰요.',
    speaker: '재활팀 동료', speech: '“서우 님 이야기, 회의에서 어떻게 전할까요?”',
    options: [
      { label: '서우 님 말 그대로 “빵집에 가고 싶다”를 먼저 전한다', fx: { care: 5, team: 3, delay: 4 }, flag: 'sharedGoal', reply: '팀원들이 “그럼 우리 목표는 빵집이네요.” 해요.', moment: '환자의 말을 팀에 그대로 전한 순간', type: 'S' },
      { label: '측정 기록과 변화를 숫자로 정리해 전한다', fx: { team: 7, delay: 4, energy: -2 }, reply: '숫자로 정리하니 팀이 금방 알아들었어요. 서우 님의 바람은 표에 들어가지 않았어요.', moment: '변화를 숫자로 정리한 순간', type: 'I' },
      { label: '회의는 짧게 끝내고 치료실 준비를 하러 간다', fx: { team: -4, energy: 3, delay: -5 }, reply: '준비 시간을 벌었어요. 팀은 서우 님 목표를 아직 잘 몰라요.', moment: '회의보다 준비를 먼저 챙긴 순간', type: 'R' },
    ],
  },
  incident: {
    title: '계획대로만 흘러가진 않아요', body: '오후 치료 시간. 서우 님이 오늘은 유난히 지쳤다고 말해요.',
    speaker: '가상 인물 · 한서우', speech: '“오늘은 좀… 힘이 없어요.”',
    ripple: [
      { if: (s) => s.flags.overpromise, text: '“금방 갈 수 있다고 하셨잖아요…” 서우 님이 실망한 눈치예요.', fx: { care: -8 } },
      { if: (s) => s.flags.goalSplit, text: '오전에 쪼개 둔 목표 덕에 “오늘은 계단 두 칸만” 같은 작은 목표를 바로 꺼낼 수 있어요.', fx: { care: 4 } },
    ],
    options: [
      { label: '담당 팀과 상의해 오늘 계획을 가볍게 조정한다', fx: { care: 6, team: 4, delay: 12, energy: -4 }, reply: '팀과 짧게 통화해 오늘 계획을 줄였어요. 서우 님이 “다행이다.” 해요.', moment: '팀과 상의해 계획을 조정한 순간', type: 'I' },
      { label: '계획대로 하되 쉬는 간격을 길게 둔다', fx: { care: 7, delay: 15, energy: -2 }, reply: '천천히, 자주 쉬며 진행했어요. 다음 예약이 15분 밀렸어요.', moment: '쉬는 간격을 늘려 기다린 순간', type: 'S' },
      { label: '짧게 쉬고 계획대로 진행한다', fx: { care: -5, team: 3, energy: -2 }, reply: '일정은 지켰어요. 서우 님은 끝날 때까지 말이 없었어요.', moment: '계획대로 진행한 순간', type: 'C' },
    ],
  },
  pick: {
    id: 'handoff', title: '다음 치료사에게 남길 기록', body: '오늘 치료 기록에 꼭 남길 것 세 가지를 골라요.', need: 3, moment: '치료 기록을 고른 순간', type: 'C',
    items: [
      { label: '서우 님의 목표: 동네 빵집에 다녀오기', ok: true },
      { label: '오늘 지쳐 있었고, 그래서 어떻게 했는지', ok: true },
      { label: '전보다 덜 망설인 순간', ok: true },
      { label: '서우 님 가족 사정에 대한 내 짐작', ok: false, why: '확인하지 않은 짐작은 기록에 남기지 않아요.' },
      { label: '“다음엔 꼭 빵집까지 갈 수 있음”', ok: false, why: '결과를 약속하는 말은 기록에 쓰지 않아요.' },
      { label: '휴게실 커피가 맛있었음', ok: false, why: '치료와 상관없는 이야기예요.' },
    ],
  },
  thanks: [
    { if: (s) => s.flags.overpromise && s.g.care < 60, text: '“너무 기대했나 봐요. 그래도 오늘 나와서 다행이에요.”' },
    { if: (s) => s.g.care >= 65, text: '“제 목표를 기억해 주셔서요. 빵집 가는 길이 조금 덜 멀게 느껴져요.”', fx: { care: 2 } },
    { if: (s) => s.flags.goalSplit, text: '“계단 다섯 칸부터. 이제 뭘 연습할지 알겠어요.”', fx: { care: 3 } },
    { text: '“오늘은 힘들었어요. 다음엔 조금 더 천천히 해도 될까요?”' },
  ],
});

export default job;
