// 간호사 — 병동 낮 근무의 하루. 등장인물과 기록은 모두 가상이다.
import { hospitalDay } from './_hospital-day.js';

const job = {
  id: 'nurse', name: '간호사', title: '병동 낮 근무의 하루', place: 'hospital', room: 'nurse',
  careernet: '354', color: '#dc9b89', look: { coat: '#e8b1a1', hair: 1, outfit: 'scrub' }, uniform: '간호복',
  pay: 'salary', shift: { start: '07:00', end: '15:30', breakMin: 30 },
  person: '박다온',
  intro: '인계받은 이야기에서 시작해, 환자 곁의 변화와 요청을 다음 근무자에게 이어 줘요. 병동은 세 교대로 돌아가고, 오늘 나는 낮 근무예요.',
};

job.scenes = hospitalDay(job, {
  records: [['오늘의 일정', '아침 인계 · 병동 순회 · 다음 근무 인계'], ['다온 님의 요청', '오늘 일정을 다시 듣고 싶어 함'], ['인계 메모', '오후 검사 시간이 바뀔 수 있음']],
  firstPlace: 'ward',
  first: {
    title: '첫 만남의 한마디', body: '병실을 도는 중, 다온 님이 조심스럽게 말을 꺼내요. 다른 병실에서도 기다리는 사람이 있어요.',
    speaker: '가상 인물 · 박다온', speech: '“오늘 일정이 어떻게 되는지 다시 듣고 싶어요.”',
    options: [
      { label: '곁에 앉아 일정을 처음부터 천천히 설명한다', fx: { care: 12, delay: 15, energy: -4 }, reply: '다온 님 어깨가 한결 내려가요. 다른 병실 순회는 15분 늦어졌어요.', moment: '다온 님 곁에 앉아 설명한 순간', type: 'S' },
      { label: '핵심만 짧게 말하고, 쪽지에 적어 침대 옆에 붙인다', fx: { care: 6, delay: 5 }, flag: 'memo', reply: '“이거 보면 되겠네요.” 다시 궁금할 때 볼 수 있는 쪽지가 생겼어요.', moment: '일정을 쪽지로 정리해 붙인 순간', type: 'C' },
      { label: '순회를 먼저 마치고 다시 오겠다고 약속한다', fx: { care: -2, team: 3 }, flag: 'promise', reply: '“네, 기다릴게요.” 순회는 제때 끝났어요. 지켜야 할 약속이 하나 남았어요.', moment: '순회를 먼저 챙긴 순간', type: 'C' },
    ],
  },
  order: {
    title: '기록 너머, 환자 곁으로', body: '오전 순회를 할 차례예요. 일의 순서를 맞춰 보세요.',
    steps: ['야간 근무자에게 인계 듣기', '병실을 돌며 상태와 요청 확인하기', '필요한 도움을 담당 의료진에게 알리기', '확인한 내용을 기록으로 남기기'],
    why: '들은 것을 직접 확인하고, 알리고, 남겨야 다음 사람이 이어받을 수 있어요.', moment: '병실을 직접 돌며 순회한 순간', type: 'R',
  },
  team: {
    title: '혼자 하는 일이 아니니까', body: '오전 회의. 의료진과 오늘 일정을 맞춰요.',
    speaker: '함께 일하는 동료', speech: '“다온 님 오후 검사 이동, 누가 챙기면 좋을까요?”',
    options: [
      { label: '“제가 맡을게요.”', fx: { team: 8, energy: -6, delay: 8 }, flag: 'ownTransfer', reply: '동료가 고마워해요. 오후 할 일이 하나 늘었어요.', moment: '일을 먼저 맡겠다고 나선 순간', type: 'E' },
      { label: '이송 담당 팀에 요청하고, 시간은 내가 다온 님께 알린다', fx: { team: 4, care: 4, delay: 3 }, reply: '각자 잘하는 일로 나눴어요. 다온 님도 시간을 미리 알게 됐어요.', moment: '일을 알맞은 사람에게 나눈 순간', type: 'S' },
      { label: '“오후 상황을 보고 정해요.”', fx: { energy: 2 }, flag: 'unclear', reply: '회의가 빨리 끝났어요. 그런데 누가 맡을지는 아직 비어 있어요.', moment: '결정을 뒤로 미룬 순간', type: 'C' },
    ],
  },
  incident: {
    title: '계획대로만 흘러가진 않아요', body: '호출 벨이 한꺼번에 울리고, 한 환자가 불안하다고 말해요.',
    speaker: '병동 상황', speech: '“간호사님, 저 좀 무서워요…”',
    ripple: [
      { if: (s) => s.flags.unclear, text: '오전에 정하지 않은 검사 이동까지 겹쳤어요. 맡을 사람을 급히 찾느라 시간이 들었어요.', fx: { delay: 10, team: -4 } },
      { if: (s) => s.flags.ownTransfer, text: '내가 맡기로 한 검사 이동 시간도 다가와요.', fx: { energy: -4 } },
    ],
    options: [
      { label: '불안한 환자 곁에 머물고, 다른 호출은 동료에게 부탁한다', fx: { care: 10, team: -6, delay: 8 }, reply: '환자의 숨이 조금 고르게 돌아왔어요. 동료는 호출 두 개를 한꺼번에 맡았어요.', moment: '불안한 환자 곁에 머문 순간', type: 'S' },
      { label: '“10분 뒤 꼭 다시 올게요.” 하고 호출을 순서대로 처리한다', fx: { care: -4, team: 5, energy: -6, delay: 3 }, reply: '호출이 하나씩 정리됐어요. 10분 뒤 돌아가니 “정말 오셨네요.” 해요.', moment: '호출을 순서대로 정리한 순간', type: 'C' },
      { label: '동료와 1분 상의해 나눠 맡는다', fx: { team: 7, care: 3, delay: 10, energy: -3 }, reply: '“제가 302호 갈게요.” 짧은 상의 덕에 겹친 일이 풀렸어요. 상의한 만큼 시간이 들었어요.', moment: '동료와 짧게 상의해 나눈 순간', type: 'E' },
    ],
  },
  pickPlace: 'nurse',
  pick: {
    id: 'handoff', title: '다음 근무자가 알아야 할 것', body: '교대 전, 인계 쪽지에 꼭 적을 것 세 가지를 골라요.', need: 3, moment: '인계 쪽지를 고른 순간', type: 'C',
    items: [
      { label: '다온 님이 일정 재설명을 원함', ok: true },
      { label: '오후 검사 시간이 바뀜', ok: true },
      { label: '오전에 불안을 말한 환자가 있었음', ok: true },
      { label: '오늘 점심 메뉴가 별로였음', ok: false, why: '근무와 상관없는 이야기예요.' },
      { label: '“아마 괜찮을 거예요.”라는 내 짐작', ok: false, why: '확인한 사실과 짐작은 구분해서 전해요.' },
      { label: '옆 침대 환자 이야기도 다온 님 칸에 함께 적기', ok: false, why: '다른 사람의 정보는 그 사람 기록에만 적어요.' },
    ],
  },
  thanks: [
    { if: (s) => s.flags.promise && s.delay >= 15, text: '“아까 다시 오신다고 하셨는데… 많이 바쁘셨죠?”', fx: { care: -6 } },
    { if: (s) => s.flags.promise, text: '“약속대로 다시 와 주셨네요. 그것만으로도 안심이 됐어요.”', fx: { care: 5 } },
    { if: (s) => s.g.care >= 65, text: '“다시 물어봐도 된다고 해 주셔서 마음이 편했어요.”', fx: { care: 2 } },
    { if: (s) => s.flags.memo, text: '“붙여 주신 쪽지, 몇 번이나 봤어요. 덕분에 안 헷갈렸어요.”', fx: { care: 3 } },
    { text: '“바쁘신 것 같아서 더 못 물어봤어요. 다음엔 물어봐도 될까요?”' },
  ],
});

export default job;
