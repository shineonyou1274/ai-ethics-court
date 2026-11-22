// 의사(5층 외과)와 환경미화 직원(1층 로비)의 3D 가까이 보기 손 장면. 틀은 tidy.js, 무대는 src/world/closeups-hosp.js.
// 모두 실제 일을 아주 단순하게 줄인 체험이다. 장면의 '알아 두기'에 그렇게 밝힌다.
import { tidy } from './tidy.js';

// ── 의사 ──
const STEP = { palm: '① 손바닥', back: '② 손등', between: '③ 손가락 사이', knuckle: '④ 손가락 마디', thumb: '⑤ 엄지', tips: '⑥ 손끝' };
const ORDER = Object.keys(STEP);
const HOW = {
  palm: '손바닥과 손바닥을 마주 대고 문질러요.', back: '손바닥으로 다른 손의 손등을 감싸 문질러요.', between: '손가락을 깍지 껴서 사이사이를 문질러요.',
  knuckle: '두 손을 맞잡고 손가락 마디를 문질러요.', thumb: '엄지를 다른 손으로 감싸 돌려 가며 문질러요.', tips: '손끝을 반대쪽 손바닥에 대고 손톱 밑까지 문질러요.',
};
const eul = (w) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 === 0 ? '를' : '을'; }; // 받침 따라 을/를
const DONE = Object.fromEntries(ORDER.map((id, k) => [id, k < ORDER.length - 1
  ? `${STEP[id].slice(2)}${eul(STEP[id])} 마쳤어요. 다음은 ${STEP[ORDER[k + 1]]}: ${HOW[ORDER[k + 1]]}`
  : '여섯 단계를 모두 문질렀어요. 이제 종이 타월로 수도꼭지를 잠가요.']));
export const handwash = tidy({
  stage: 'handwash', title: '손 위생 여섯 단계', hint: '위쪽 3D 화면에서 직접 해요. 손 위의 번호 자리를 차례로 손가락으로 문지르고, 종이 타월은 끌어서 수도꼭지에 대요.',
  start: `501호 앞 세면대예요. 번호 ① 손바닥부터: ${HOW.palm}`,
  items: [
    ...ORDER.map((id, k) => ({ id, label: `${STEP[id]} 문지르기`, kind: 'rub', done: DONE[id] })),
    { id: 'towel', label: '종이 타월로 수도꼭지 잠그기', kind: 'move', done: '종이 타월로 잠갔어요. 씻은 손이 수도꼭지에 다시 닿지 않았어요.' },
  ],
  order: [...ORDER, 'towel'],
  early: (id, first) => (id === 'towel' ? '잠깐! 아직 문지를 단계가 남았어요. 다 마친 뒤에 수도꼭지를 잠가요.'
    : `여섯 단계는 차례대로 해요. 먼저 ${STEP[first]}: ${HOW[first]}`),
  finish: '손끝까지 깨끗해요. 이제 병실에 들어가요.',
  good: 'thorough', bad: 'rushed',
});

export const wristband = tidy({
  stage: 'wristband', title: '팔찌로 환자 확인', hint: '위쪽 3D 화면에서 직접 해요. 차트를 끌어서, 팔찌와 이름·생년월일이 모두 같은 분의 침대 초록 원에 놓아요.',
  start: '차트에는 윤하늘 · 1968.04.12. 세 침대의 팔찌를 읽어 보세요.',
  items: [{ id: 'chart', label: '팔찌와 이름·생년월일이 모두 같은 분 찾기', kind: 'move', done: '이름도, 생년월일도 같아요. 3번 침대의 하늘 님이에요.' }],
  miss: (id, slot) => (slot === 'bed1' ? '이름이 달라요. 1번 침대는 윤하람 님이에요. 생년월일만 같아요. 이름과 생년월일을 둘 다 견줘요.'
    : '이름은 같지만 생년월일이 달라요. 같은 이름의 환자분이 계실 수 있어서, 두 가지를 모두 견줘요.'),
  finish: '“아, 회진 시간이군요.” 하늘 님이 책을 덮어요.',
  good: 'sure', bad: 'recheck',
});

export const gowning = tidy({
  stage: 'gowning', title: '수술 복장 갖추기', hint: '위쪽 3D 화면에서 직접 해요. 탁자의 물건은 끌어서 내 캐릭터에 놓고, 손은 개수대에서 손가락으로 문질러요.',
  start: '수술 준비실이에요. 무엇부터 할까요?',
  items: [
    { id: 'capmask', label: '수술 모자와 마스크 쓰기', kind: 'move', done: '모자와 마스크를 썼어요. 이제 손을 씻어요.' },
    { id: 'scrub', label: '개수대에서 수술 전 손 세척', kind: 'rub', done: '손끝부터 팔꿈치까지 씻었어요. 씻은 손은 가슴 높이로 들어요.' },
    { id: 'gown', label: '멸균 가운 입기', kind: 'move', done: '간호사가 펼쳐 준 멸균 가운에 팔을 넣었어요.' },
    { id: 'gloves', label: '멸균 장갑 끼기', kind: 'move', done: '장갑이 가운 소매를 덮었어요.' },
  ],
  order: ['capmask', 'scrub', 'gown', 'gloves'],
  early: {
    scrub: '모자와 마스크부터 써요. 손을 씻은 뒤에 머리나 얼굴을 만지면 다시 씻어야 해요.',
    gown: '수술 전 손 세척부터 해요. 씻은 손으로 멸균 가운을 입어요.',
    gloves: '장갑은 가운을 입은 뒤에 껴요. 장갑이 가운 소매를 덮어야 해요.',
  },
  finish: '한 번에 갖춰 입었어요. 이제 수술실로 가요.',
  good: 'ready', bad: 'redo',
});

export const suturepad = tidy({
  stage: 'suturepad', title: '연습 패드로 봉합 연습', hint: '위쪽 3D 화면에서 직접 해요. 파란 점에서 점까지 손가락으로 문질러 한 땀씩 꿰매고, 가위는 끌어서 실 끝에 놓아요.',
  start: '연습용 패드예요. 1번 땀부터, 위 점에서 아래 점까지 문질러요.',
  items: [
    ...[1, 2, 3, 4, 5].map((n) => ({ id: `s${n}`, label: `${n}번 땀 꿰매기`, kind: 'rub', done: n < 5 ? `${n}번 땀을 꿰맸어요. 간격을 보며 ${n + 1}번으로.` : '다섯 땀을 다 꿰맸어요. 이제 실 끝을 잘라요.' })),
    { id: 'cut', label: '가위로 실 끝 자르기', kind: 'move', done: '실 끝을 잘랐어요.' },
  ],
  order: ['s1', 's2', 's3', 's4', 's5', 'cut'],
  early: (id, first) => (id === 'cut' ? '아직 꿰맬 땀이 남았어요. 다 꿰맨 뒤에 실을 잘라요.'
    : `왼쪽부터 차례로 꿰매요. 먼저 ${first.slice(1)}번 땀이에요. 간격이 고르게요.`),
  finish: '“좋아요, 간격이 고르네요.” 선배가 고개를 끄덕여요.',
  good: 'neat', bad: 'retie',
});

// ── 환경미화 직원 ──
export const touchwipe = tidy({
  stage: 'touchwipe', title: '손이 많이 닿는 곳 닦기', hint: '위쪽 3D 화면에서 직접 해요. 얼룩을 손가락으로 문질러 닦고, 쓴 티슈는 끌어서 봉투에 넣어요.',
  start: '퇴원한 108호예요. 방 안쪽부터 문 쪽으로 닦아 나와요. 어디부터 할까요?',
  items: [
    { id: 'table', label: '방 안쪽 협탁 위 닦기', kind: 'rub', done: '협탁을 닦았어요. 다음은 침대 난간이에요.' },
    { id: 'rail', label: '침대 난간 닦기', kind: 'rub', done: '난간을 닦았어요. 이제 나가면서 문 손잡이를 닦아요.' },
    { id: 'handle', label: '나가면서 문 손잡이 닦기', kind: 'rub', done: '문 손잡이까지 닦았어요.' },
    { id: 'bag', label: '쓴 소독 티슈를 봉투에 넣기', kind: 'move', done: '쓴 티슈를 봉투에 넣었어요. 다른 곳을 닦을 때는 새 티슈를 써요.' },
  ],
  order: ['table', 'rail', 'handle', 'bag'],
  early: {
    rail: '방 안쪽의 협탁부터 닦아요. 안쪽에서 문 쪽으로 닦아야 닦은 곳을 다시 지나지 않아요.',
    handle: '문 손잡이는 마지막에, 나가면서 닦아요. 먼저 닦으면 방을 닦는 동안 다시 만지게 돼요.',
    bag: '잠깐! 아직 닦을 곳이 남았어요. 다 닦은 뒤에 쓴 티슈를 버려요.',
  },
  finish: '다음 분이 써도 깨끗해요. 손이 닿는 곳을 모두 닦았어요.',
  good: 'clean', bad: 'redo',
});

const THING = { med: '닫힌 의료폐기물 상자를', bottle: '빈 페트병을', snack: '과자 봉지·휴지를', paper: '접은 종이 상자를' };
const BIN_OF = { med: '의료폐기물', bottle: '플라스틱', snack: '일반', paper: '종이' };
const WHY = {
  med: '닫힌 의료폐기물 상자는 열지 않고, 상자째 의료폐기물 자리에 둬요.',
  bottle: '빈 페트병은 다시 쓸 수 있어요. 플라스틱 수거함에 넣어요.',
  snack: '과자 봉지와 쓴 휴지는 다시 쓰기 어려워요. 일반 수거함에 넣어요.',
  paper: '접은 종이 상자는 종이 수거함에 넣어요.',
};
export const wastesort = tidy({
  stage: 'wastesort', title: '쓰레기 나누기', hint: '위쪽 3D 화면에서 직접 해요. 수레의 쓰레기를 끌어서 알맞은 수거함 위 초록 원에 놓아요.',
  start: '로비와 병실에서 모은 쓰레기예요. 수거함 이름표를 보고 나눠요.',
  items: Object.keys(BIN_OF).map((id) => ({ id, label: `${THING[id]} 알맞은 수거함에`, kind: 'move', done: `${THING[id]} ${BIN_OF[id]} ${id === 'med' ? '자리에 두었어요' : '수거함에 넣었어요'}.` })),
  miss: (id, slot) => (slot === 'medical' ? `의료폐기물 자리에는 닫힌 전용 상자만 둬요. ${WHY[id]}` : `앗, 그 수거함이 아니에요. ${WHY[id]}`),
  finish: '다 나눴어요. 수거차가 오면 바로 실을 수 있어요.',
  good: 'sorted', bad: 'redo',
});
