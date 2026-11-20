// 환경미화 직원 — 병원 환경을 돌보는 하루. 등장인물과 기록은 모두 가상이다.
// 1층 로비를 내 캐릭터로 걸어 다니며(카페 방식, shared/DESIGN.md §2-3), 동료·안내 데스크·전화·방문자로 찾아오는 일을 받는다.
// 한 문장으로: "병원 1층을 돌며 손 닿는 곳을 닦고 쓰레기를 나누다가, 천장에서 물이 샌 로비를 안내판부터 세워 여울 님 같은 방문자가 안전하게 지나가게 했다."
// 손으로 하는 장면은 단순하게 만든 체험이다(손 닿는 곳 닦기, 쓰레기 나누기, 젖은 바닥 닦기).
import { floorDay } from './_floor-day.js';

const job = {
  id: 'cleaner', name: '환경미화 직원', title: '병원 환경을 돌보는 하루', place: 'hospital', room: 'support',
  floor: 'lobby', // 병원 전체가 아니라 1층 로비 모형에서 하루를 보낸다 (places/hospital-lobby.js). 기록의 일터는 그대로 'hospital'
  careernet: '356', careernetNote: '커리어넷의 청소원 자료를 썼어요.',
  color: '#a9ad8f', look: { coat: '#b8bca1', hair: 0, outfit: 'vest' }, uniform: '작업복',
  pay: 'salary', shift: { start: '07:00', end: '16:00', breakMin: 60 },
  person: '강여울',
  intro: '다음 사람이 안심하고 공간을 쓰도록 준비해요. 구역 점검, 정리, 동료와의 인계로 이어지는 하루예요.',
  walk: true, // 1층을 걸어 다니며 동료·안내 데스크·전화로 찾아오는 일을 받는다 (src/flow.js)
};

const SIMPLE = '이 장면은 실제 일을 아주 단순하게 만든 체험이에요. 무엇을 어떻게 하는지는 병원마다 정한 작업표를 따라요.';

job.scenes = floorDay(job, {
  text: {
    locker: '직원 출입구를 지나 1층 탈의실에 왔어요. 아직 문을 열기 전이라 로비가 조용해요.',
    dressed: '작업복 차림으로 환경관리팀 동료들과 인사했어요.',
    recordsTodo: '아침 작업표 확인',
    records: '환경관리실에서 오늘의 작업표를 받아요. 카드를 한 장씩 펼쳐 봐요.',
    breakSpeech: '“먼저 쉬고 와요. 로비는 제가 볼게요.”',
    breakTalk: '“108호 닦을 때 손잡이 마지막에 하는 거, 저도 그렇게 배웠어요.” 웃으며 나눈 이야기가 오후의 손발을 맞춰 줘요.',
    pickTodo: '다음 동료에게 인계 메모',
    leave: '퇴근 시각이에요. 저녁 근무 동료가 와요.',
  },
  recordsTitle: '오늘의 작업표 펼치기',
  records: [['오늘의 일정', '담당 구역 점검 · 정리 · 사용 상태 확인'], ['담당 구역', '1층 로비와 대기 공간 · 108호 · 엘리베이터 앞'], ['팀 메모', '점심 무렵 방문자가 몰림 · 9시에 폐기물 수거차']],
  am: [
    { kind: 'order', atOff: 8, place: 'support', drain: 0, title: '문이 열리기 전부터', body: '담당 구역을 정리할 차례예요. 일의 순서를 맞춰 보세요.',
      steps: ['담당 구역과 작업표 확인하기', '미끄럼 주의 안내판 세우기', '정해진 순서대로 구역 정리하기', '마친 상태를 점검하고 담당자와 공유하기'],
      why: '어디를 할지 알고, 지나가는 사람의 안전을 먼저 챙긴 뒤 정리해야 해요.', moment: '구역 정리 순서를 맞춘 순간', type: 'R' },
    { kind: 'choice', atOff: 25, place: 'lobby', title: '첫 만남의 한마디', body: '로비 바닥을 닦는 중이에요. 방문자 여울 님이 지친 얼굴로 다가와요.',
      todo: { label: '로비 바닥 정리', known: true },
      speaker: '가상 인물 · 강여울', speech: '“여기서 잠깐 앉았다 가도 될까요?”',
      options: [
        { label: '작업을 멈추고, 마른 쪽 의자를 닦아 자리를 내어 드린다', fx: { care: 10, delay: 10, energy: -3 }, reply: '“고마워요, 다리가 너무 아팠어요.” 로비 정리는 10분 늦어졌어요.', moment: '작업을 멈추고 자리를 내어 드린 순간', type: 'S' },
        { label: '미끄럼 주의 안내판을 세우고, 다른 쪽 휴게 의자로 안내한다', fx: { care: 5, delay: 3 }, flag: 'signboard', reply: '여울 님이 안내판을 피해 휴게 의자로 가요. 작업도 이어졌어요.', moment: '안내판을 세우고 길을 알려 드린 순간', type: 'C' },
        { label: '“금방 끝낼게요.” 하고 서둘러 마친 뒤 자리를 비워 드린다', fx: { care: 2, team: 2, energy: -4 }, reply: '손을 빨리 놀려 작업을 마쳤어요. 여울 님은 잠깐 서서 기다렸어요.', moment: '서둘러 작업을 마친 순간', type: 'R' },
      ] },
    // 손으로 하는 일 ① 동료의 부탁: 퇴원한 108호의 손 닿는 곳을 방 안쪽부터 닦는다
    { kind: 'hands', game: 'touchwipe', closeup: true, atOff: 55, place: 'r108', drain: 0, title: '손이 많이 닿는 곳부터',
      notice: { via: '동료', text: '“108호 분이 퇴원하셨어요. 손 닿는 곳 소독 부탁해요. 오후에 새 분이 오세요.”' },
      todo: { label: '108호 소독 · 새 환자 준비', via: '동료' },
      body: '108호예요. 협탁, 침대 난간, 문 손잡이처럼 손이 많이 닿는 곳을 소독 티슈로 닦아요.',
      moment: '손 닿는 곳을 차례로 닦은 순간', type: 'C',
      fact: `여러 사람의 손이 닿는 곳은 병이 옮기 쉬워서 자주 닦아요. 닦은 곳을 다시 지나지 않게 안쪽에서 문 쪽으로 닦고, 쓴 티슈는 바로 버려요. ${SIMPLE}`,
      grades: {
        clean: { fx: { care: 3, team: 2, delay: 3 }, text: '협탁, 난간, 문 손잡이까지 차례로 닦고 쓴 티슈를 버렸어요. 간호사가 “바로 쓸 수 있겠네요.” 해요.' },
        redo: { fx: { delay: 6, energy: -2 }, moment: '순서를 바로잡아 다시 닦은 순간', text: '쓴 티슈를 먼저 버리려다 새 티슈로 마저 닦았어요. 시간이 조금 더 들었어요.' },
      } },
    // 손으로 하는 일 ② 전화: 수거차가 오기 전에 쓰레기를 나눈다 (수거함 넷 모두에 같은 원)
    { kind: 'hands', game: 'wastesort', closeup: true, atOff: 95, place: 'waste', drain: 0, title: '수거차가 오기 전에',
      notice: { via: '전화', text: '“폐기물 수거차가 9시에 들어가요. 그 전에 나눠 놓아 주세요.”' },
      todo: { label: '쓰레기 나누기 · 9시 수거', via: '전화' },
      body: '폐기물 보관실이에요. 로비와 병실에서 모은 쓰레기를 수거함에 나눠요.',
      moment: '쓰레기를 알맞은 수거함에 나눈 순간', type: 'R',
      fact: `병원에서 나온 의료폐기물은 전용 상자에 담아 닫은 채로 따로 모아요. 날카로운 것이 들어 있을 수 있어서 상자를 열거나 손으로 옮겨 담지 않아요. ${SIMPLE}`,
      grades: {
        sorted: { fx: { team: 3, delay: 2 }, text: '넷 모두 알맞은 수거함에 넣었어요. 수거차가 바로 싣고 갔어요.' },
        redo: { fx: { delay: 5, energy: -1 }, moment: '수거함을 다시 보고 나눈 순간', text: '한 번 다른 수거함에 넣을 뻔했어요. 이름표를 다시 보고 나눴어요. 시간이 조금 더 들었어요.' },
      } },
    { kind: 'choice', atOff: 150, place: 'support', title: '혼자 하는 일이 아니니까', body: '환경관리팀 회의. 점심 무렵 로비가 붐벼요.',
      todo: { label: '환경관리팀 회의', known: true },
      speaker: '환경관리팀 동료', speech: '“사람 많은 시간에 로비 정리를 언제 할까요?”',
      options: [
        { label: '붐비기 전 이른 시간으로 당겨 동료와 함께 한다', fx: { team: 6, energy: -6, delay: 4 }, flag: 'early', reply: '둘이 함께 로비를 미리 정리했어요. 아침이 꽤 바빴어요.', moment: '동료와 일을 앞당긴 순간', type: 'E' },
        { label: '붐비는 시간을 피해 오후로 미룬다', fx: { care: 3, energy: 2, delay: 6 }, reply: '방문자 통행은 편해졌어요. 오후 할 일이 늘었어요.', moment: '방문자를 피해 시간을 옮긴 순간', type: 'C' },
        { label: '하던 시간에 하던 대로 한다', fx: { energy: 3 }, flag: 'usual', reply: '회의가 금방 끝났어요. 점심 무렵 로비는 여전히 붐빌 거예요.', moment: '늘 하던 대로 하기로 한 순간', type: 'C' },
      ] },
    // 안내 데스크의 부탁: 엘리베이터 앞 통로를 막은 휠체어를 정리한다 (짧은 장면, 순간으로 세지 않는다)
    { kind: 'tasks', atOff: 200, place: 'elev', drain: 0, title: '엘리베이터 앞 길 트기', goal: '휠체어 정리',
      notice: { via: '안내 데스크', text: '“엘리베이터 앞에 휠체어가 여러 대 놓여 길이 좁아요.”' },
      todo: { label: '엘리베이터 앞 휠체어 정리', via: '안내 데스크' },
      body: '엘리베이터 앞이에요. 다 쓴 휠체어가 통로에 놓여 있어요.',
      moment: '엘리베이터 앞 길을 튼 순간', type: null,
      tasks: [
        { label: '휠체어를 접어 보관대에 세우기', result: '휠체어 세 대를 접어 보관대에 세웠어요.', act: 'work' },
        { label: '손잡이 난간과 버튼을 한 번 닦기', result: '사람들이 짚는 난간과 버튼을 닦았어요. 통로가 넓어졌어요.', act: 'work' },
      ] },
  ],
  pm: [
    // 손으로 하는 일 ③ 안내 데스크: 로비 천장에서 물이 샌다. 안내판을 세우고 대걸레로 닦는다 (3D)
    { kind: 'hands', game: 'mop', closeup: true, atOff: 290, place: 'lobby', title: '로비 바닥이 젖었어요',
      notice: { via: '안내 데스크', text: '“로비 천장에서 물이 새요! 방문자분이 미끄러울 뻔했대요.”' },
      todo: { label: '로비 물 샘 · 바닥 닦기', via: '안내 데스크' },
      body: '로비 천장에서 물이 새어 바닥에 흘러요. 방문자가 “여기 바닥이 미끄러워요!” 하고 외쳐요.',
      moment: '안내판을 세우고 물기를 닦아 낸 순간', type: 'R',
      fact: `젖은 바닥은 넘어지는 사고가 잦은 곳이에요. 닦기 전에 미끄럼 주의 안내판부터 세워 사람들이 피해 가게 해요. ${SIMPLE}`,
      ripple: [{ if: (s) => s.flags.signboard, text: '아침에 여울 님께 안내판을 세워 드렸던 게 떠올라요. 안내판은 늘 수레 맨 위에 있어요.' }],
      grades: {
        safe: { fx: { care: 4, delay: 4, energy: -3 }, text: '안내판을 먼저 세우고 물기를 걷어 냈어요. 사람들이 안내판을 보고 돌아가요.' },
        risky: { fx: { care: -3, team: -1, delay: 2, energy: -3 }, flag: 'noSign', moment: '안내판 없이 닦기 시작한 순간', text: '물기는 걷었지만, 안내판 없이 닦는 동안 지나가던 분이 미끄러질 뻔했어요.' },
      } },
    { kind: 'choice', atOff: 305, place: 'lobby', title: '계획대로만 흘러가진 않아요', body: '닦아 내도 천장에서 물이 계속 떨어져요. 어떻게 할까요?',
      notice: { via: '방문자', text: '“저기 또 떨어져요!”' },
      todo: { label: '계속 떨어지는 물', via: '방문자' },
      speaker: '방문자', speech: '“이쪽으로 지나가도 돼요?”',
      ripple: [
        { if: (s) => s.flags.usual, text: '붐비는 시간에 작업까지 겹쳐 통행이 막혔어요.', fx: { delay: 8, care: -4 } },
        { if: (s) => s.flags.early, text: '로비를 미리 정리해 둬서 바로 손쓸 수 있어요.', fx: { delay: -5 } },
      ],
      options: [
        { label: '양동이를 받쳐 두고, 물이 고일 때마다 내가 닦는다', fx: { care: 6, delay: 8, energy: -6 }, reply: '양동이에 물이 똑똑 떨어져요. 고일 때마다 닦느라 팔이 뻐근해요.', moment: '물이 고일 때마다 직접 닦아 낸 순간', type: 'R' },
        { label: '시설팀에 새는 곳을 알리고, 그동안 통행을 안내한다', fx: { team: 6, care: 3, delay: 6, energy: -2 }, reply: '시설팀이 천장을 고치러 왔어요. 고칠 때까지 길을 안내했어요.', moment: '시설팀과 힘을 모은 순간', type: 'C' },
        { label: '동료를 불러 한 명은 닦고 한 명은 안내한다', fx: { team: 4, care: 5, delay: 5, energy: -4 }, reply: '둘이 나눠 맡으니 금방 정리됐어요.', moment: '동료와 일을 나눈 순간', type: 'E' },
      ] },
  ],
  pickAt: 380,
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
  thanksPlace: 'lobby',
  thanksBody: '진료를 마치고 나가던 여울 님이 로비에서 말을 건네요.',
  thanks: [
    { if: (s) => s.flags.noSign, text: '“아까 젖은 바닥에서 한 번 휘청했어요. 다음엔 안내판이 있으면 좋겠어요.”', fx: { care: -2 } },
    { if: (s) => s.g.care >= 65, text: '“앉아서 쉴 곳을 정리해 주셨네요. 덕분에 잠깐 숨을 돌렸어요.”', fx: { care: 2 } },
    { if: (s) => s.flags.signboard, text: '“안내판 덕분에 미끄러운 데를 피해서 갔어요.”', fx: { care: 2 } },
    { text: '“다들 바빠 보여서 서 있다 가려고요. 그래도 복도가 참 깨끗하네요.”' },
  ],
});

export default job;
