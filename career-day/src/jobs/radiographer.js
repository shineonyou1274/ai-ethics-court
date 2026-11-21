// 방사선사 — 영상검사실의 하루. 등장인물과 기록은 모두 가상이다.
// 지하 1층 영상의학과를 내 캐릭터로 걸어 다니며(카페 방식, shared/DESIGN.md §2-3), 간호사·의사·전화로 찾아오는 일을 받는다.
// 한 문장으로: "넘어져 손목을 다친 로운 님(82세)의 사진을 꼭 필요한 곳만, 문을 닫고 찍었고, 오후 CT 때 곁에 있겠다는 약속을 응급 촬영이 몰린 오후에 지켰다(또는 못 지켰다)."
// 영상을 읽고 진단하는 일은 다루지 않는다(의사의 일). 판단은 안내, 시간 조율, 팀과 나누는 일을 다룬다.
// 손으로 하는 일(촬영대 준비, 자리 잡기, 문 닫고 촬영, 다시 찍을 사진 고르기)은 아주 단순하게 그린 체험이다.
import { floorDay } from './_floor-day.js';

const job = {
  id: 'radiographer', name: '방사선사', title: '영상검사실의 하루', place: 'hospital', room: 'office',
  floor: 'radiology', // 병원 전체가 아니라 지하 1층 영상의학과 모형에서 하루를 보낸다 (places/hospital-radiology.js). 기록의 일터는 그대로 'hospital'
  careernet: '10', color: '#83a9c2', look: { coat: '#a9c6d9', hair: 2, outfit: 'scrub' }, uniform: '검사복',
  pay: 'salary', shift: { start: '09:00', end: '18:00', breakMin: 60 },
  person: '이로운',
  intro: '찍을 곳만 정확하게 찍고, 필요 없는 방사선은 줄여요. 사람의 몸을 비추는 일이라, 기계만큼 사람을 살펴요.',
  walk: true, // 층을 걸어 다니며 간호사·의사·전화로 찾아오는 일을 받는다 (src/flow.js)
};

// 약속: 아침에 "오후 CT 때 곁에 있겠다"고 하면 받은 일 목록에 오르고, 응급 촬영이 몰린 오후에 지키면 '마침', 아니면 '못 함'
const promised = (s) => !!s.flags.promise, kept = (s) => !!s.flags.kept;
const SIMPLE = '이 장면은 실제 촬영 과정을 아주 단순하게 만든 체험이에요.';

job.scenes = floorDay(job, {
  text: {
    locker: '직원 출입구를 지나 지하 1층 탈의실에 왔어요. 밤사이 응급 촬영을 맡은 당직 방사선사가 인계를 기다려요.',
    dressed: '검사복 차림으로 당직 방사선사와 인사를 나눴어요.',
    recordsTodo: '아침 인계 듣기',
    records: '방사선사실에서 당직 방사선사에게 밤사이 이야기를 들어요. 카드를 한 장씩 펼쳐 봐요.',
    breakSpeech: '“먼저 밥 먹고 와요. 촬영실은 제가 볼게요.”',
    breakTalk: '“로운 님 손목, 한 번에 잘 나왔더라고요.” 웃으며 나눈 이야기가 오후의 손발을 맞춰 줘요.',
    pickTodo: '영상과 함께 보낼 기록',
    leave: '퇴근 시각이에요. 저녁 근무자에게 촬영실을 넘겨요.',
  },
  recordsTitle: '먼저, 밤사이 이야기부터',
  records: [['오늘의 일정', '일반촬영실 · 오후 CT 돕기'], ['10시 · 이로운 님 (82세)', '넘어져 오른 손목이 아픔 · 귀가 조금 어두우심 · 손녀와 함께 · 오후 3시 머리 CT'], ['팀 메모', '촬영 전 본인 확인 두 가지 · 촬영실에 함께 들어갈 보호자는 임신 여부 확인']],
  am: [
    // 손으로 하는 일 ① 촬영대 준비 (병원 모형의 '촬영대 준비'를 그대로 쓴다)
    { kind: 'hands', game: 'xraytable', closeup: true, atOff: 15, place: 'xray', drain: 0, title: '첫 촬영 전에, 촬영대부터',
      todo: { label: '일반촬영실 열기 · 촬영대 준비', known: true },
      body: '일반촬영실이에요. 첫 촬영 전에 촬영대를 닦고, 커버를 깔고, 받침을 놓아요.',
      moment: '촬영대를 직접 준비한 순간', type: 'R',
      fact: `촬영대는 환자가 바뀔 때마다 닦고, 일회용 커버를 새로 깔아요. 자세 받침은 정확한 사진을 찍도록 몸을 받쳐 주는 도구예요. ${SIMPLE}`,
      grades: {
        ready: { fx: { care: 2, team: 2, delay: 2 }, text: '닦고, 커버를 깔고, 받침을 놓았어요. 첫 분을 맞을 준비가 됐어요.' },
        redo: { fx: { delay: 5, energy: -2 }, moment: '순서를 바로잡아 촬영대를 준비한 순간', text: '순서가 한 번 엇갈려 다시 했어요. 첫 촬영이 조금 늦어져요.' },
      } },
    { kind: 'choice', atOff: 55, place: 'waiting', title: '첫 만남의 한마디', body: '대기실이에요. 로운 님이 손목을 감싸 쥐고 있어요. 손녀 가람 님은 임신 초기라 촬영실에 들어가지 않아요.',
      todo: { label: '10시 촬영 · 이로운 님 손목', known: true, now: (s, i) => s.i >= i && s.i <= i + 2, done: (s, i) => s.i > i + 2 }, // 첫 만남, 자리 잡기, 촬영까지 '지금'
      speaker: '가상 인물 · 이로운', speech: '“가만히 있을 수 있을까 몰라. 오후엔 그 큰 통 같은 데도 들어가야 한다며?”',
      options: [
        { label: '로운 님 곁에서 촬영 순서를 천천히, 크게 말씀드리고 손목 받침을 미리 보여 드린다', fx: { care: 10, delay: 9, energy: -3 }, reply: '“아, 손만 올려놓으면 되는구나.” 로운 님 어깨가 풀렸어요. 다음 예약이 조금 밀렸어요.', moment: '로운 님께 순서를 천천히 알려 드린 순간', type: 'S' },
        { label: '가람 님께 조정실 창 너머에서 마이크로 할머니께 말을 걸어 달라고 부탁한다', fx: { care: 5, team: 4, delay: 4 }, flag: 'grandMic', reply: '“그럼 제 목소리 들리게 할게요.” 가람 님이 조정실 앞으로 가요.', moment: '가람 님과 할 일을 나눈 순간', type: 'E' },
        { label: '오후 CT 때 내가 CT실에 가서 곁에서 설명해 드리겠다고 약속한다', fx: { care: 6, delay: 3, energy: -1 }, flag: 'promise', reply: '“그럼 그때 또 봐요.” 로운 님이 고개를 끄덕여요. 오후에 지킬 약속이 생겼어요.', moment: '오후 CT를 함께하겠다고 약속한 순간', type: 'C' },
      ] },
    // 손으로 하는 일 ② 자리 잡기: 판 → 모래주머니 → R 표시 → 빛을 손목에만
    { kind: 'hands', game: 'positioning', closeup: true, atOff: 62, place: 'xray', drain: 0, title: '찍을 곳만, 정확하게',
      body: '일반촬영실이에요. 로운 님 오른 손목을 찍어요. 판과 받침을 놓고, 빛을 손목에만 맞춰요.',
      moment: '손목 자리를 잡고 빛을 맞춘 순간', type: 'R',
      fact: `X선은 찍을 곳에만 비추도록 빛의 크기(조리개)를 줄여요. 그러면 몸의 다른 곳은 방사선을 받지 않아요. 왼쪽·오른쪽을 헷갈리지 않게 납으로 만든 R·L 글자를 함께 찍어요. ${SIMPLE}`,
      grades: {
        steady: { fx: { care: 2, team: 1 }, text: '손목이 판 가운데에 편하게 놓였어요. 빛은 손목에만 비춰요.' },
        redo: { fx: { delay: 5, energy: -2 }, moment: '자리를 다시 잡은 순간', text: '한 번 엇갈려 다시 잡았어요. 로운 님이 조금 더 기다렸어요.' },
      } },
    // 손으로 하는 일 ③ 누르기 전에: 나는 조정실로, 문은 닫고
    { kind: 'hands', game: 'expose', closeup: true, atOff: 70, place: 'control', drain: 0, title: '누르기 전에, 나와서 닫고',
      body: '조정실이에요. 납유리 창 너머로 로운 님이 보여요. 복도에는 가람 님이 기다려요.',
      moment: '문을 닫고 촬영한 순간', type: 'C',
      fact: `방사선을 덜 받는 세 가지 방법은 시간(짧게), 거리(멀리), 가림(차폐)이에요. 그래서 찍을 때는 납유리 창이 있는 조정실로 나오고, 촬영실 문을 닫아 밖의 사람을 지켜요. 우리나라는 「의료법」과 「진단용 방사선 발생장치의 안전관리에 관한 규칙」으로 촬영실과 일하는 사람의 안전을 관리해요. ${SIMPLE}`,
      grades: {
        safe: { fx: { team: 2, care: 1 }, text: '조정실로 나와 문을 닫고 찍었어요. 로운 님 말고는 아무도 방사선을 받지 않았어요.' },
        rushed: { fx: { delay: 3, team: -1 }, flag: 'rushedShot', moment: '서둘러 누르려다 멈춘 순간', text: '다 갖추기 전에 누르려다 멈췄어요. 나와서 문을 닫고 찍었어요. 조금 늦어졌어요.' },
      } },
    { kind: 'choice', atOff: 150, place: 'office', title: '혼자 하는 일이 아니니까', body: '방사선사실이에요. 병동과 오후 촬영 시간을 맞춰요.',
      notice: { via: '간호사', text: '“7층이에요. 오후에 병동 환자분 가슴 사진 찍으러 내려갈 시간, 정해 주세요.”' },
      todo: { label: '병동 환자 촬영 시간 정하기', via: '간호사' },
      speaker: '병동 간호사', speech: '“환자분 모시고 내려갈 시간, 언제로 할까요?”',
      // 촬영을 서둘렀으면 여기서 다시 돌아온다 (손 장면에 두면 폰에서 안내 한 줄이 아래로 밀려서, 고르는 장면에 둔다)
      ripple: [{ if: (s) => s.flags.rushedShot, text: '선배가 조정실 문 앞의 표시를 가리켜요. “스위치 누르기 전엔 문부터 봐요.”', fx: { delay: 2, team: -1 } }],
      options: [
        { label: '촬영실 상황을 보고 정확한 시간을 정해 알린다', fx: { team: 6, delay: 4, energy: -3 }, flag: 'fixedTime', reply: '“14시 20분으로 할게요.” 병동이 이동 준비를 시작했어요.', moment: '정확한 시간을 정해 알린 순간', type: 'E' },
        { label: '여유 있게 30분 간격으로 잡는다', fx: { care: 4, energy: 2, delay: 6 }, reply: '서두를 일은 없어졌어요. 대신 하루 촬영 수가 줄어 뒤 예약이 밀려요.', moment: '여유 있게 간격을 잡은 순간', type: 'C' },
        { label: '앞 촬영이 끝나면 그때 연락하겠다고 한다', fx: { energy: 3 }, flag: 'callLater', reply: '통화가 금방 끝났어요. 병동은 아직 언제 내려올지 몰라요.', moment: '시간을 뒤로 미룬 순간', type: 'C' },
      ] },
  ],
  pm: [
    // 손으로 하는 일 ④ 의사: 판독 보내기 전에 사진 확인. 흐리거나 잘린 사진만 다시 찍는다
    { kind: 'hands', game: 'imagecheck', closeup: true, atOff: 250, place: 'reading', drain: 0, title: '보낼까, 다시 찍을까',
      notice: { via: '의사', text: '“판독실이에요. 오전 사진 셋, 판독 보내기 전에 같이 봐요.”' },
      todo: { label: '오전 사진 확인 · 판독실', via: '의사' },
      body: '판독실이에요. 오전에 찍은 사진 세 장을 봐요. 읽을 수 있는 사진은 보내고, 흐리거나 잘린 사진만 다시 찍어요.',
      moment: '사진을 보고 다시 찍을지 정한 순간', type: 'I',
      fact: `다시 찍으면 그만큼 방사선을 한 번 더 받아요. 그래서 흐리거나 필요한 곳이 잘린 사진만 다시 찍어요. 사진을 읽고 진단하는 건 영상의학과 의사의 일이에요. ${SIMPLE}`,
      grades: {
        sure: { fx: { team: 3, care: 1 }, text: '“딱 필요한 것만 다시 찍네요.” 의사 선생님이 고개를 끄덕여요.' },
        recheck: { fx: { delay: 4 }, moment: '사진을 다시 보고 고른 순간', text: '한 번 엇갈렸지만 다시 보고 바로 골랐어요. 시간이 조금 더 들었어요.' },
      } },
    // 오후의 돌발: 응급 촬영이 몰린다. 약속했다면, CT실에 갈지 여기서 고른다
    { kind: 'choice', atOff: 290, place: 'xray', title: '계획대로만 흘러가진 않아요', body: '응급 촬영 두 분이 한꺼번에 내려왔어요. 곧 로운 님 CT 시간이에요.',
      notice: { via: '전화', text: '“응급실이에요. 넘어진 환자분 두 분, 바로 사진 부탁해요!”' },
      todo: [
        { label: '응급 촬영 두 분', via: '전화' },
        { label: '로운 님 CT 때 곁에서 설명하기', via: '약속', at: '15:00', known: promised,
          now: (s, i) => s.i === i || (kept(s) && s.i === i + 1), done: (s, i) => kept(s) && s.i > i + 1, missed: (s, i) => s.i > i && !kept(s) }, // 지키러 가는 다음 장면(CT실)까지 '지금'
      ],
      speaker: '응급실 간호사', speech: '“두 분 다 손목이랑 발목이 많이 부었어요!”',
      ripple: [
        { if: (s) => s.flags.callLater, text: '오후 시간을 정해 두지 않아, 병동 환자분까지 한꺼번에 내려와 기다려요.', fx: { delay: 8, care: -4 } },
        { if: (s) => s.flags.fixedTime, text: '병동 촬영 시간을 정해 둔 덕에 응급 촬영과 엇갈리지 않아요.', fx: { team: 3 } },
        { if: (s) => s.flags.grandMic, text: '가람 님이 CT실 앞에서 기다려요. “CT 때도 마이크로 할머니께 말 걸어 드릴게요.”', fx: { care: 2 } },
        { if: promised, text: '로운 님 CT 때 곁에 있겠다는 약속이 응급 촬영과 겹쳐요.' },
      ],
      options: [
        { label: '응급 환자부터 찍고, 로운 님 CT는 CT실 동료에게 맡긴다', fx: { team: 5, care: -1, delay: 3, energy: -3 }, reply: '응급 사진이 제때 나갔어요. 로운 님은 CT실 동료가 맞았어요.', moment: '응급 촬영부터 한 순간', type: 'R' },
        { label: '선배에게 일반촬영실을 잠깐 부탁하고, 응급 환자를 나눠 찍는다', fx: { team: 6, care: 3, delay: 6, energy: -2 }, reply: '두 촬영실을 함께 열어 순서를 나눴어요. 줄이 금방 줄어요.', moment: '선배와 촬영을 나눈 순간', type: 'E' },
        { label: '대기실에 나가 늦어지는 까닭과 예상 시간을 알린다', fx: { care: 7, team: -1, delay: 5, energy: -3 }, reply: '“알려 주니 기다릴 만해요.” 그동안 선배가 응급 촬영을 시작했어요.', moment: '대기실에 사정을 알린 순간', type: 'S' },
        { label: '응급 촬영을 마치자마자 약속대로 CT실에 가서 로운 님 곁에 선다', when: promised, fx: { care: 8, team: -2, delay: 10, energy: -4 }, flag: 'kept', reply: '두 분 사진을 서둘러 마치고 CT실로 가요. 일반촬영실은 잠깐 기다려요.', moment: '약속을 지키려고 오후를 다시 짠 순간', type: 'S' },
      ] },
    // 약속을 지키러 가기로 했을 때만 열린다: CT실에서 로운 님 곁에
    { kind: 'tasks', atOff: 310, place: 'ct', skip: (s) => !kept(s), drain: 0, goal: '약속대로 CT 곁에 서기', title: '약속한 대로, CT실에서',
      body: '응급 촬영을 마치고 CT실에 왔어요. “정말 왔네.” 로운 님이 눈을 크게 떠요.',
      moment: '약속대로 CT 곁을 지킨 순간', type: null, // 돌아보기의 순간은 앞의 고르기가 맡는다
      tasks: [
        { label: '로운 님 귀 가까이, CT 순서를 크게 말씀드리기', result: '“누우면 대가 천천히 들어가요. 통은 앞뒤가 뚫려 있어요.”', act: 'talk' },
        { label: '“움직이지 마세요” 소리를 미리 들려 드리기', result: '“이 소리가 나면 잠깐만 가만히 계시면 돼요.” 로운 님이 고개를 끄덕여요.', act: 'talk' },
        { label: '조정실에서 마이크로 계속 말 걸기', result: '“거의 다 됐어요, 로운 님.” CT가 무사히 끝났어요.', act: 'talk' },
      ] },
  ],
  pickAt: 395, pickPlace: 'office',
  pick: {
    id: 'handoff', title: '영상과 함께 보낼 기록', body: '판독실에 영상과 함께 보낼 기록에 꼭 넣을 것 세 가지를 골라요.', need: 3, moment: '함께 보낼 기록을 고른 순간', type: 'C',
    notice: { via: '의사', text: '“오늘 사진들, 기록이랑 같이 보내 줘요.”' },
    todo: { label: '영상과 함께 보낼 기록', via: '의사' },
    items: [
      { label: '찍은 곳과 촬영 종류', ok: true },
      { label: '촬영 중 아프다고 한 곳', ok: true },
      { label: '다시 찍은 사진이 있다면 그 까닭', ok: true },
      { label: '사진을 보고 한 내 짐작: “뼈가 부러진 듯”', ok: false, why: '사진을 읽고 진단하는 건 의사의 일이에요.' },
      { label: '필요 없는 다른 곳도 함께 찍은 사진', ok: false, why: '검사에 필요한 곳만 찍어요. 방사선을 아껴요.' },
      { label: '오늘 촬영한 사람 명단 전체', ok: false, why: '이 촬영과 상관없는 다른 사람의 정보예요.' },
    ],
  },
  thanksPlace: 'waiting',
  thanksBody: '검사를 모두 마친 로운 님이 가람 님 팔을 잡고 대기실을 나서요.',
  thanks: [
    { if: kept, text: '“통 속에 들어갈 때 와 줘서, 하나도 안 무서웠어.”', fx: { care: 5 } },
    { if: promised, text: '“CT 할 때 온다더니… 바빴나 봐. 그래도 잘 끝났어.”', fx: { care: -6 } },
    { if: (s) => s.g.care >= 65, text: '“손목 찍을 때 천천히, 크게 말해 줘서 잘 들렸어.”', fx: { care: 2 } },
    { if: (s) => s.flags.grandMic, text: '“손녀 목소리가 들려서 가만히 있을 수 있었어.”', fx: { care: 2 } },
    { text: '“사진은 금방 찍네. 그래도 많이 떨렸어.”' },
  ],
});

export default job;
