// 환경미화 직원 — 병원 환경을 돌보는 하루. 등장인물과 기록은 모두 가상이다.
import { hospitalDay } from './_hospital-day.js';

const job = {
  id: 'cleaner', name: '환경미화 직원', title: '병원 환경을 돌보는 하루', place: 'hospital', room: 'support',
  careernet: '356', careernetNote: '커리어넷의 청소원 자료를 썼어요.',
  color: '#a9ad8f', look: { coat: '#b8bca1', hair: 0, outfit: 'vest' }, uniform: '작업복',
  pay: 'salary', shift: { start: '07:00', end: '16:00', breakMin: 60 },
  person: '강여울',
  intro: '다음 사람이 안심하고 공간을 쓰도록 준비해요. 구역 점검, 정리, 동료와의 인계로 이어지는 하루예요.',
};

job.scenes = hospitalDay(job, {
  recordsTitle: '오늘의 작업표 펼치기',
  records: [['오늘의 일정', '담당 구역 점검 · 정리 · 사용 상태 확인'], ['담당 구역', '로비와 대기 공간'], ['팀 메모', '점심 무렵 방문자가 몰림']],
  firstPlace: 'reception',
  first: {
    title: '첫 만남의 한마디', body: '로비 바닥을 닦는 중이에요. 방문자 여울 님이 지친 얼굴로 다가와요.',
    speaker: '가상 인물 · 강여울', speech: '“여기서 잠깐 앉았다 가도 될까요?”',
    options: [
      { label: '작업을 멈추고, 마른 쪽 의자를 닦아 자리를 내어 드린다', fx: { care: 10, delay: 10, energy: -3 }, reply: '“고마워요, 다리가 너무 아팠어요.” 로비 정리는 10분 늦어졌어요.', moment: '작업을 멈추고 자리를 내어 드린 순간', type: 'S' },
      { label: '미끄럼 주의 안내판을 세우고, 다른 쪽 휴게 의자로 안내한다', fx: { care: 5, delay: 3 }, flag: 'signboard', reply: '여울 님이 안내판을 피해 휴게 의자로 가요. 작업도 이어졌어요.', moment: '안내판을 세우고 길을 알려 드린 순간', type: 'C' },
      { label: '“금방 끝낼게요.” 하고 서둘러 마친 뒤 자리를 비워 드린다', fx: { care: 2, team: 2, energy: -4 }, reply: '손을 빨리 놀려 작업을 마쳤어요. 여울 님은 잠깐 서서 기다렸어요.', moment: '서둘러 작업을 마친 순간', type: 'R' },
    ],
  },
  order: {
    title: '문이 열리기 전부터', body: '담당 구역을 정리할 차례예요. 일의 순서를 맞춰 보세요.',
    steps: ['담당 구역과 작업표 확인하기', '미끄럼 주의 안내판 세우기', '정해진 순서대로 구역 정리하기', '마친 상태를 점검하고 담당자와 공유하기'],
    why: '어디를 할지 알고, 지나가는 사람의 안전을 먼저 챙긴 뒤 정리해야 해요.', moment: '구역 정리 순서를 맞춘 순간', type: 'R',
  },
  team: {
    title: '혼자 하는 일이 아니니까', body: '환경관리팀 회의. 점심 무렵 로비가 붐벼요.',
    speaker: '환경관리팀 동료', speech: '“사람 많은 시간에 로비 정리를 언제 할까요?”',
    options: [
      { label: '붐비기 전 이른 시간으로 당겨 동료와 함께 한다', fx: { team: 6, energy: -6, delay: 4 }, flag: 'early', reply: '둘이 함께 로비를 미리 정리했어요. 아침이 꽤 바빴어요.', moment: '동료와 일을 앞당긴 순간', type: 'E' },
      { label: '붐비는 시간을 피해 오후로 미룬다', fx: { care: 3, energy: 2, delay: 6 }, reply: '방문자 통행은 편해졌어요. 오후 할 일이 늘었어요.', moment: '방문자를 피해 시간을 옮긴 순간', type: 'C' },
      { label: '하던 시간에 하던 대로 한다', fx: { energy: 3 }, flag: 'usual', reply: '회의가 금방 끝났어요. 점심 무렵 로비는 여전히 붐빌 거예요.', moment: '늘 하던 대로 하기로 한 순간', type: 'C' },
    ],
  },
  // 손으로 하는 일 — 3D 로비에서 안내판을 세우고 물기를 직접 닦는다
  before: {
    incident: [{
      kind: 'hands', game: 'mop', closeup: true, atOff: 345, place: 'reception', title: '로비 바닥이 젖었어요',
      body: '로비 천장에서 물이 새어 바닥에 흘러요. 방문자가 “여기 바닥이 미끄러워요!” 하고 외쳐요.',
      moment: '안내판을 세우고 물기를 닦아 낸 순간', type: 'R',
      fact: '젖은 바닥은 넘어지는 사고가 잦은 곳이에요. 닦기 전에 미끄럼 주의 안내판부터 세워 사람들이 피해 가게 해요.',
      grades: {
        safe: { fx: { care: 4, delay: 4, energy: -3 }, text: '안내판을 먼저 세우고 물기를 걷어 냈어요. 사람들이 안내판을 보고 돌아가요.' },
        risky: { fx: { care: -3, team: -1, delay: 2, energy: -3 }, flag: 'noSign', moment: '안내판 없이 닦기 시작한 순간', text: '물기는 걷었지만, 안내판 없이 닦는 동안 지나가던 분이 미끄러질 뻔했어요.' },
      },
    }],
  },
  incident: {
    title: '계획대로만 흘러가진 않아요', body: '닦아 내도 천장에서 물이 계속 떨어져요. 어떻게 할까요?',
    speaker: '방문자', speech: '“저기 또 떨어져요!”',
    ripple: [
      { if: (s) => s.flags.usual, text: '붐비는 시간에 작업까지 겹쳐 통행이 막혔어요.', fx: { delay: 8, care: -4 } },
      { if: (s) => s.flags.early, text: '로비를 미리 정리해 둬서 바로 손쓸 수 있어요.', fx: { delay: -5 } },
    ],
    options: [
      { label: '양동이를 받쳐 두고, 물이 고일 때마다 내가 닦는다', fx: { care: 6, delay: 8, energy: -6 }, reply: '양동이에 물이 똑똑 떨어져요. 고일 때마다 닦느라 팔이 뻐근해요.', moment: '물이 고일 때마다 직접 닦아 낸 순간', type: 'R' },
      { label: '시설팀에 새는 곳을 알리고, 그동안 통행을 안내한다', fx: { team: 6, care: 3, delay: 6, energy: -2 }, reply: '시설팀이 천장을 고치러 왔어요. 고칠 때까지 길을 안내했어요.', moment: '시설팀과 힘을 모은 순간', type: 'C' },
      { label: '동료를 불러 한 명은 닦고 한 명은 안내한다', fx: { team: 4, care: 5, delay: 5, energy: -4 }, reply: '둘이 나눠 맡으니 금방 정리됐어요.', moment: '동료와 일을 나눈 순간', type: 'E' },
    ],
  },
  pick: {
    id: 'handoff', title: '다음 동료에게 남길 메모', body: '교대할 동료에게 남길 메모에 꼭 적을 것 세 가지를 골라요.', need: 3, moment: '인계 메모를 고른 순간', type: 'C',
    items: [
      { label: '물이 샌 곳과 시설팀에 알린 시각', ok: true },
      { label: '정리를 마친 구역과 남은 구역', ok: true },
      { label: '안내판을 세워 둔 곳', ok: true },
      { label: '로비에서 들은 방문자의 사정', ok: false, why: '일과 상관없는 다른 사람의 이야기예요.' },
      { label: '“아마 다 말랐을 거예요.”라는 짐작', ok: false, why: '확인하지 않은 건 "확인 필요"로 적어요.' },
      { label: '다른 직원에 대한 내 불평', ok: false, why: '감정과 사실을 나누고, 필요한 사실만 적어요.' },
    ],
  },
  thanks: [
    { if: (s) => s.g.care >= 65, text: '“앉아서 쉴 곳을 정리해 주셨네요. 덕분에 잠깐 숨을 돌렸어요.”', fx: { care: 2 } },
    { if: (s) => s.flags.signboard, text: '“안내판 덕분에 미끄러운 데를 피해서 갔어요.”', fx: { care: 2 } },
    { text: '“다들 바빠 보여서 서 있다 가려고요. 그래도 복도가 참 깨끗하네요.”' },
  ],
});

export default job;
