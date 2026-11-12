// 이야기의 뼈대: 막, 질문 카드, 등장인물 규칙.
// 화면이나 3D를 모르는 순수 데이터 모듈이다.

export const STEP = 30; // 질문과 질문 사이에 걷는 거리

export const ACTS = ['문 열기', '지나온 길', '지금의 나', '앞으로의 길', '해 질 녘', '돌아보기'];

// rel: 주인공 나이와의 차이. 함께 나이 들어 간다.
export const ROLES = {
  mom: { label: '엄마', rel: 30, color: '#f4a6b7', elder: true },
  dad: { label: '아빠', rel: 32, color: '#8fb4e6', elder: true },
  grandma: { label: '할머니', rel: 58, color: '#d9a7d6', elder: true },
  grandpa: { label: '할아버지', rel: 60, color: '#a9b8a0', elder: true },
  sibling: { label: '형제자매', rel: 3, color: '#f7c873' },
  teacher: { label: '선생님', rel: 26, color: '#9ccfc0', elder: true },
  friend: { label: '친구', rel: 0, color: '#7fc8e8' },
  partner: { label: '사랑하는 사람', rel: 1, color: '#ffa9a0' },
  mentor: { label: '스승', rel: 22, color: '#b6a4e8' },
  coworker: { label: '동료', rel: 2, color: '#8fd3a8' },
  child: { label: '아이', rel: -30, color: '#ffd166' },
  junior: { label: '내가 돕는 사람', rel: -24, color: '#9ad0f5' },
  pet: { label: '반려동물', rel: 0, color: '#e8c39e', pet: true },
  custom: { label: '소중한 사람', rel: 0, color: '#f2b5d4' },
  unknown: { label: '?', rel: 0, color: '#ffffff' },
};

export const VALUES = [
  ['가족', '#ffb4a2'], ['우정', '#7fc8e8'], ['사랑', '#ff8fab'], ['자유', '#8ecae6'],
  ['도전', '#ffb703'], ['성장', '#95d5b2'], ['배움', '#b8a4f0'], ['건강', '#80ed99'],
  ['안정', '#a3c4f3'], ['재미', '#ffd166'], ['창작', '#f4a261'], ['나눔', '#f9a8d4'],
  ['정의', '#90caf9'], ['성실', '#c5e1a5'], ['용기', '#ff9e80'], ['평화', '#b2dfdb'],
  ['인정', '#ffe082'], ['자연', '#a5d6a7'],
];

const HINTS = [
  '네 이야기를 끝까지 들어 주는 사람',
  '너와 전혀 다른 길을 걸어온 사람',
  '네가 잘하는 걸 먼저 알아봐 주는 사람',
  '함께 있으면 자꾸 웃게 되는 사람',
  '쓴소리도 해 주는 믿음직한 사람',
  '같은 꿈을 꾸는 사람',
];

const PLAN = [
  ['middle', '중학교 입학', 13],
  ['highschool', '고등학교 입학', 16],
  ['school', '대입·진로', 19],
  ['job', '취업', 26],
  ['marry', '결혼·동반자', 31],
  ['home', '자녀', 35],
  ['retire', '은퇴', 65],
];
const EDU = ['middle', 'highschool', 'school'];
/** 계획표에 더할 수 있는 '이루고 싶은 일'. fly: 그 장면까지 비행기를 타고 간다. */
export const WISHES = [
  ['집 장만', 38, 'home'], ['자동차 구입', 28, 'car'], ['세계여행', 30, 'fly'], ['부모님 여행 보내 드리기', 32, 'fly'], ['유학·해외에서 살아 보기', 24, 'fly'],
  ['특허 등록', 33], ['창업', 35], ['책 출간', 40], ['대학원·다시 공부', 30], ['이직', 34],
  ['반려동물 입양', 27], ['마라톤 완주', 29], ['무대에 서기', 26], ['봉사·기부', 45], ['귀촌·시골살이', 60],
];
/** 직접 쓴 일도 낱말을 보고 종류를 알아챈다: 비행기(fly), 내 집(home), 내 차(car). */
export const wishKind = (t) => (/여행|유학|해외|세계|외국/.test(t) ? 'fly' : /자동차|차 구입|차를|차 사|운전|드라이브|캠핑카/.test(t) ? 'car' : /집|아파트|주택|보금자리/.test(t) ? 'home' : '');
const basisOf = (S) => (S.ageBasis === 'korean' ? 1 : 0);
/** 이미 지난 입학(중학교·고등학교)은 계획이 아니라 지나온 길의 장면이 된다. */
export const pastEdu = (S) => { const now = S.now ?? 15, b = basisOf(S); return { middle: now >= 13 + b ? 13 + b : null, highschool: now >= 16 + b ? 16 + b : null }; };
/**
 * 굵직한 사건의 계획표. 사건마다 계획함(yes)·미정(maybe)·안 함(no) 세 상태가 있고,
 * 나이는 비워 둘 수 있다. 계획함이고 나이가 정해졌을 때만 장면이 생긴다.
 * 학생이 더한 '이루고 싶은 일'은 extra 줄로 뒤에 붙는다.
 */
export function planOf(S) {
  const now = S.now ?? 15;
  const basis = basisOf(S);
  const past = pastEdu(S);
  const valid = (v) => Number.isInteger(v) && v >= 1 && v <= 100;
  const rows = PLAN.filter(([k]) => past[k] == null).map(([k, label, def]) => {
    const p = (S.plan || {})[k];
    const status = p?.status || (p ? (p.on === false ? 'no' : 'yes') : 'maybe');
    const age = p && Object.prototype.hasOwnProperty.call(p, 'age') ? (valid(p.age) ? p.age : null) : EDU.includes(k) ? def + basis : Math.min(100, Math.max(now + 1, def));
    return { k, label, status, on: status === 'yes', age, title: '' };
  });
  const legacy = (S.plan || {}).customEvent;
  const extras = [...(((S.plan || {}).extras) || [])];
  if (legacy && typeof legacy.title === 'string' && legacy.title.trim() && !extras.some((x) => x.id === 'customEvent')) extras.push({ id: 'customEvent', title: legacy.title, age: legacy.age, status: legacy.status || 'yes' });
  for (const x of extras.slice(0, 8)) {
    const status = x.status || 'yes';
    rows.push({ k: x.id === 'customEvent' ? 'customEvent' : 'x' + x.id, id: x.id, extra: true, label: x.title, title: x.title, status, on: status === 'yes', age: valid(x.age) ? x.age : null, kind: x.kind || (x.fly ? 'fly' : ''), fly: (x.kind || (x.fly ? 'fly' : '')) === 'fly' });
  }
  return rows;
}

// 같은 씨앗이면 같은 순서, 새로 시작하면 다른 순서가 나오는 난수
function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const SCHOOL_WAYS = [{ k: 'general', label: '일반 학교' }, { k: 'alt', label: '대안학교' }, { k: 'home', label: '홈스쿨링' }, { k: 'other', label: '다른 배움의 길' }];

const opt = (k, label, role) => ({ k, label: label || ROLES[k].label, role: role || k });
const snip = (t, n = 14) => { t = String(t || '').trim().replace(/\s+/g, ' '); return t.length > n ? t.slice(0, n) + '…' : t; };

// 갈림길 선택지. dir: 길이 휘는 방향(-1 왼쪽, 0 그대로, 1 오른쪽). delay: 뒤의 계획이 늦어지는 햇수.
const TP1_OPTIONS = [
  { k: 'retry', label: '한 번 더 도전한다', dir: 0, delay: 1 },
  { k: 'turn', label: '다른 길로 방향을 바꾼다', dir: -1 },
  { k: 'rest', label: '잠시 쉬며 나를 돌아본다', dir: 1, delay: 1 },
];
const TP2_OPTIONS = [
  { k: 'renew', label: '하던 일을 새롭게 바꿔 간다', dir: 0 },
  { k: 'move', label: '전혀 다른 일로 옮겨 간다', dir: -1 },
  { k: 'grow', label: '좋아서 하던 것을 두 번째 일로 키운다', dir: 1 },
];
const CHANCE = {
  tier: 2,
      id: 'chance', age: 29, type: 'chips', title: '뜻밖의 제안', max: 1, min: 0, optional: true,
      q: '전혀 다른 나라에서 1년 살아 볼 기회가 갑자기 생겼어. 어떻게 할래?',
      options: [{ k: 'go', label: '떠난다' }, { k: 'stay', label: '지금 자리를 지킨다' }, { k: 'later', label: '조금 미뤄 두고 준비한다' }], text: '그렇게 고른 까닭은?',
    };
const pickOf = (S, id) => (S.a[id] && !S.a[id].skip ? (S.a[id].picks || [])[0] || (S.a[id].custom ? 'custom' : null) : null);

/** 현재 상태로 질문 카드 목록을 만든다. 답이 바뀌어도 앞쪽 순서는 달라지지 않는다. */
export function build(S) {
  const now = S.now ?? 15;
  const name = S.name || '너';
  const P = planOf(S);
  const B = [];
  // 걷는 길이: 짧게(1)는 꼭 필요한 장면만, 보통(2)은 갈림길 두 번까지, 길게(3)는 모든 장면
  const level = { short: 1, mid: 2, long: 3 }[S.pace] || 3;
  const add = (b) => { if ((b.tier || 1) <= level) B.push(b); };

  // ── 0막 문 열기 ──
  add({ id: 'name', act: 0, age: 0, type: 'name', q: '반가워. 이 드라마의 주인공을 뭐라고 부를까?', hint: '실명 대신 별명도 좋아. 옷 색과 머리 모양도 골라 봐.', cta: '이 모습으로 할게' });
  add({ id: 'now', act: 0, age: 0, walk: false, type: 'age', q: `${name}, 지금 몇 살이야?`, hint: '활동지와 같은 나이 기준을 골라 줘. 이 기준으로 현재·고입·대입·모든 계획을 적어. 기준을 바꿔도 숫자는 자동 변환하지 않아.' });
  add({ id: 'pace', act: 0, age: 0, walk: false, type: 'pace', q: '오늘은 얼마나 걸어 볼까?', hint: '선생님이 알려 준 길이를 골라. 나중에 메뉴에서 바꿀 수 있어.' });
  add({ id: 'open', act: 0, age: 0, walk: false, type: 'say', cam: 'front', q: `${name}의 길은 새벽에 시작됐어.`, hint: '맨 처음으로 돌아가서, 마지막 날까지 천천히 걸어 보자. 네가 남기는 답은 길 위의 점이 되고, 언젠가 서로 이어져. 쓰기 어려운 질문은 건너뛰어도 괜찮아.', cta: '첫걸음 떼기' });

  // ── 1막 지나온 길 ──
  add({
    id: 'care', act: 1, age: 1, type: 'chips', scene: true, optional: true, title: '나를 돌봐 준 사람', people: 'picks', max: 3, custom: '직접 쓰기 (예: 이모, 돌봄 선생님)',
    q: '네 인생의 길을 누구와 함께 시작해 볼까?', hint: '너를 돌봐 준 누구든 좋아. 세 명까지 고르거나 직접 적어 봐. 혼자 시작하거나 건너뛰어도 괜찮아.',
    options: [opt('mom'), opt('dad'), opt('grandma'), opt('grandpa'), opt('sibling', '언니·누나', 'sibling'), opt('sibling2', '오빠·형', 'sibling'), opt('teacher'), opt('caregiver', '나를 돌봐 준 다른 사람', 'custom'), { k: 'alone', label: '혼자 시작하기' }],
    text: '떠오르는 어린 시절 기억이 있다면 적어 봐. (선택)',
  });
  if (now > 4) add({ id: 'childhood4', tier: 3, act: 1, age: 4, type: 'text', scene: true, optional: true, dot: '어릴 적 놀이', title: '어릴 적 나', q: '4살 무렵, 너는 어떤 아이였어?', hint: '좋아하던 놀이가 있다면 떠올려 봐. 기억나지 않으면 비워 두거나 건너뛰어도 돼.', starters: ['그때 나는 '] });
  if (now > 7) add({ id: 'childhood7', tier: 3, act: 1, age: 7, type: 'text', scene: true, optional: true, dot: '어린 날의 나', title: '조금 자란 나', q: '7살 무렵, 너는 어떤 아이였어?', hint: '자주 하던 일이나 함께 놀던 모습을 떠올려 봐. 기억나지 않으면 비워 두거나 건너뛰어도 돼.', starters: ['그때 나는 '] });

  const past = pastEdu(S);
  if (past.middle != null) add({
    id: 'middle', tier: 2, act: 1, age: past.middle, type: 'chips', scene: true, optional: true, dot: '중학교', title: '중학교 입학', max: 1, min: 0,
    q: `${past.middle}살, 중학생이 되는 나이였어. 너는 어떤 길로 배웠어?`, hint: '학교에 다니지 않고 배운 길도 똑같이 네 길이야.',
    options: SCHOOL_WAYS, custom: '직접 쓰기', text: '그때 가장 기억나는 일 (선택)',
  });
  if (past.highschool != null) add({
    id: 'highschool', tier: 2, act: 1, age: past.highschool, type: 'chips', scene: true, optional: true, dot: '고등학교', title: '고등학교 입학', max: 1, min: 0,
    q: `${past.highschool}살, 고등학생이 되는 나이였어. 너는 어떤 길을 골랐어?`, hint: '검정고시나 홈스쿨링도 괜찮아.',
    options: [{ k: 'general', label: '일반고' }, { k: 'vocational', label: '특성화고·마이스터고' }, { k: 'alt', label: '대안학교' }, { k: 'home', label: '홈스쿨링·검정고시' }, { k: 'other', label: '다른 배움의 길' }],
    custom: '직접 쓰기', text: '그 길을 고른 까닭 (선택)',
  });

  // ── 2막 지금의 나 ──
  add({
    id: 'values', act: 2, age: now, type: 'chips', scene: true, optional: true, dot: '소중한 것', title: '내게 소중한 것', min: 0, max: 3, cam: 'front', fx: 'orbs',
    q: `${now}살, 지금의 ${name}. 가장 소중한 것을 세 가지까지 골라 봐.`, hint: '고른 것이 작은 빛이 되어 함께 가. 아직 모르겠으면 건너뛰어도 돼.',
    options: VALUES.map(([v]) => ({ k: v, label: v })),
  });
  add({
    id: 'kid', act: 2, age: now, walk: false, type: 'text', scene: true, optional: true, dot: '빠져들었던 것', title: '빠져들었던 것',
    q: '지금까지 시간 가는 줄 모르고 빠져들었던 건 뭐였어?', hint: '어린 시절부터 지금까지 떠올려 봐. 기억나는 것만 적거나 건너뛰어도 돼.',
    starters: ['나는 ', '그때 제일 신났던 건 ', '혼자서도 몇 시간씩 '],
  });
  add({
    id: 'hard', tier: 2, act: 2, age: now, walk: false, type: 'text', scene: true, optional: true, dot: '나를 일으킨 것', weather: 'rain', title: '비 오던 날',
    q: '지금까지 힘들었던 순간이 있다면, 무엇이 너를 다시 걷게 했어?', hint: '지금 돌아보며 기억나는 만큼만 적어 봐. 적기 어려우면 비워 두거나 건너뛰어도 돼. 이 글은 이 기기에만 남아.',
    starters: ['그때 나는 ', '나를 다시 걷게 한 건 '],
  });
  add({
    id: 'me', tier: 3, act: 2, age: now, walk: false, type: 'text', scene: true, optional: true, dot: '나는 이런 사람', title: '나는 이런 사람', cam: 'front',
    q: '너를 잘 아는 사람이 너를 한 문장으로 소개한다면?',
    starters: ['나는 ', '겉으로는 ', '사람들은 잘 모르지만 나는 '],
  });
  add({
    id: 'beside', tier: 2, act: 2, age: now, walk: false, type: 'chips', scene: true, title: '지금 곁에 있는 사람', people: 'picks', max: 2, optional: true, cam: 'front',
    custom: '직접 쓰기 (별명도 좋아)',
    q: '지금 네 곁에서 함께 걷는 사람은 누구야?', hint: '최대 두 명까지 길에 합류해.',
    options: [opt('friend'), opt('sibling', '형제자매', 'sibling'), opt('teacher'), opt('pet')],
  });

  if (past.highschool != null && now <= 19 + basisOf(S)) add({
    id: 'major', tier: 2, act: 2, age: now, walk: false, type: 'text', scene: true, optional: true, dot: '깊이 배우고 싶은 것', title: '깊이 배우고 싶은 분야', cam: 'front',
    q: '고등학생인 지금, 더 깊이 배워 보고 싶은 분야가 있다면 뭘까?', hint: '과목, 전공, 직업, 기술 무엇이든 좋아. 아직 없다면 궁금한 것 하나만 적어도 돼.',
    starters: ['요즘 궁금한 건 ', '더 배워 보고 싶은 건 '],
  });

  // ── 3막 앞으로의 길 ──
  // 굵직한 사건은 먼저 계획한다. 길 위에서는 계획을 흔드는 갈림길과 뜻밖의 질문을 만난다.
  add({
    id: 'plan', act: 3, age: now, walk: false, type: 'plan', cam: 'front',
    q: '이제부터는 아직 걸어 보지 않은 길이야. 굵직한 일을 몇 살에 맞이할까?',
    hint: '미정·안 함이면 그 장면은 나오지 않아. 나이는 예시일 뿐, 활동지대로 바꿔도 돼. 아래에서 이루고 싶은 일도 더해 봐.', cta: '이 계획으로 출발',
  });
  const row = (k) => P.find((x) => x.k === k);
  const at = (k) => { const r = row(k); return r && r.on && Number.isInteger(r.age) ? r.age : null; };
  const rnd = rng(S.seed ?? (S.hints || [0, 1])[0] * 97 + (S.hints || [0, 1])[1] * 13 + 7);
  const draw = (arr) => arr[Math.floor(rnd() * arr.length)];
  const hints = S.hints || [0, 1];
  const fut = [];
  fut.push({
    id: 'soon', tier: 3, age: now + 3, pin: true, type: 'text', optional: true, dot: '몇 년 뒤의 나', title: '몇 년 뒤의 나',
    q: `${now + 3}살, 지금보다 세 해 뒤의 너는 어떤 하루를 보내고 싶어?`, hint: '학교나 직업을 정하지 않아도 괜찮아. 하고 싶은 일 하나만 짧게 쓰거나 건너뛰어도 돼.',
    starters: ['나는 ', '그때 해 보고 싶은 건 '], prep: '그날을 위해 지금 해 볼 작은 일',
  });

  const EVENTS = {
    middle: (a) => ({
      type: 'chips', title: '중학교 입학', dot: '중학교', max: 1, min: 0, optional: true,
      q: `${a}살, 중학생이 되는 나이야. 어떤 길로 배우고 싶어?`, hint: '학교에 다니지 않고 배우는 길도 괜찮아.',
      options: [...SCHOOL_WAYS, { k: 'later', label: '아직 미정' }], custom: '다른 계획 (선택)', text: '더 적고 싶다면 한마디 (선택)', prep: '지금 해 볼 작은 준비',
    }),
    highschool: (a) => ({
      type: 'chips', title: '고등학교 입학', dot: '고등학교', max: 1, min: 0, optional: true,
      q: `${a}살, 고등학생이 되는 나이야. 어떤 길을 생각해?`, hint: '선택 하나면 충분해. 아직 모르겠으면 미정이나 건너뛰기를 골라도 돼.',
      options: [{ k: 'general', label: '일반고' }, { k: 'vocational', label: '특성화고·마이스터고' }, { k: 'alt', label: '대안학교' }, { k: 'home', label: '홈스쿨링·검정고시' }, { k: 'later', label: '아직 미정' }],
      custom: '다른 계획 (선택)', text: '더 적고 싶다면 한마디 (선택)', ph: '예: 가까운 학교, 좋아하는 분야', prep: '지금 해 볼 작은 준비',
    }),
    school: (a) => ({
      type: 'chips', title: '대입 · 고교 이후 진로', dot: '스무 살의 길', max: 1, min: 0, optional: true,
      q: `${a}살, 네가 정한 대입·진로 계획을 골라 봐.`, hint: '대학에 가지 않는 길이나 미정도 괜찮아. 세상 경험을 고르면 비행기를 타.',
      options: [{ k: 'univ', label: '대학에 진학하기' }, { k: 'skill', label: '전문 기술 배우기' }, { k: 'work', label: '바로 일 시작하기' }, { k: 'world', label: '세상 경험 먼저 하기' }, { k: 'later', label: '아직 미정' }],
      custom: '나만의 길 (직접 쓰기)', text: '더 적고 싶다면 한마디 (선택)', ph: '예: 디자인 공부, 일하며 찾기', prep: '그 길에 서려고 올해 준비할 것',
    }),
    job: (a) => ({
      type: 'chips', title: '취업과 나의 일', dot: '첫 일', max: 1, min: 0, optional: true,
      q: `${a}살, 첫 일터에 들어섰어. 너는 어디에서 어떤 일을 시작했을까?`, hint: '직업 이름을 몰라도 괜찮아. 가까운 쪽을 고르고 아래에 적어 봐.',
      options: [{ k: 'company', label: '회사에 취업하기' }, { k: 'public', label: '공무원·공공기관' }, { k: 'pro', label: '전문직·기술직' }, { k: 'own', label: '내 가게·창업' }, { k: 'free', label: '프리랜서·창작' }],
      custom: '다른 일 (직접 쓰기)', text: '무슨 일을 하는 곳이야? 출근하는 하루를 그려 봐.', prep: '그 일을 얻으려고 지금부터 쌓을 것',
    }),
    marry: (a) => ({
      type: 'chips', title: '결혼과 동반자', people: 'picks', max: 1, optional: true,
      q: `${a}살, 인생을 함께 걸을 사람을 만났어. 너는 어떤 선택을 할까?`, hint: '어느 쪽이든 네 삶이야. 나중에 대본에서 다시 골라도 돼.',
      options: [{ k: 'wed', label: '결혼해서 함께 걷기', role: 'partner', as: '배우자' }, { k: 'with', label: '결혼은 아니어도 소중한 사람과 함께', role: 'partner', as: '동반자' }, { k: 'solo', label: '혼자 걷는 길도 좋아' }, { k: 'later', label: '아직 모르겠어' }],
      text: '어떤 사람과 어떤 사이로 살고 싶어? 혼자라면 그 삶을 무엇으로 채울까?',
    }),
    home: (a) => ({
      type: 'chips', title: '자녀와 가족', people: 'picks', max: 1, optional: true,
      q: `${a}살, 아이에 대해서는 어떤 그림을 그리고 있어?`, hint: '고른 가족이 길에 합류해. 어느 쪽이든 괜찮아.',
      options: [{ k: 'one', label: '아이 한 명', roles: ['child'], names: ['아이'] }, { k: 'two', label: '아이 둘 이상', roles: ['child', 'child'], names: ['첫째', '둘째'] }, { k: 'none', label: '아이 없이 살기' }, { k: 'later', label: '아직 모르겠어' }],
      text: '부모가 된다면 어떤 부모가 되고 싶어? 아니라면 그 시간에 무엇을 할까?', prep: '좋은 가족이 되려고 지금 해 볼 수 있는 것',
    }),
    retire: (a) => ({
      type: 'chips', title: '은퇴와 그 뒤', max: 2, min: 0, optional: true,
      q: `${a}살, 오래 해 온 일을 내려놓는 날이야. 그 뒤의 시간을 무엇으로 채울까?`, hint: '두 가지까지 골라 봐. 여행을 고르면 비행기를 타고 떠나.',
      options: [{ k: 'learn', label: '새로운 것 배우기' }, { k: 'serve', label: '봉사와 나눔' }, { k: 'trip', label: '여행' }, { k: 'family', label: '가족과 보내는 시간' }, { k: 'small', label: '작은 일 계속하기' }],
      custom: '직접 쓰기', text: '은퇴한 다음 날 아침을 그려 봐.',
    }),
  };

  // 첫 번째 갈림길: 처음 계획한 진로(대입 → 취업 순)의 문 앞에서 길이 막힌다.
  const anchorKey = ['school', 'job'].find((k) => at(k) != null && at(k) > now);
  const tp1Age = anchorKey ? at(anchorKey) : now + 6;
  const tp1Pick = pickOf(S, 'tp1');
  const tp1Delay = (TP1_OPTIONS.find((o) => o.k === tp1Pick) || {}).delay || 0;
  // 다시 도전하거나 쉬어 가면, 그 뒤에 계획한 일들이 그만큼 늦어진다.
  const planned = (k) => { const a = at(k); return a == null ? null : a + (a > tp1Age ? tp1Delay : 0); };
  for (const k of Object.keys(EVENTS)) { const a = planned(k); if (a != null) fut.push({ id: k, age: a, planned: true, ...EVENTS[k](a) }); }
  // 학생이 더한 '이루고 싶은 일'
  for (const r of P.filter((x) => x.extra)) {
    const a = planned(r.k);
    if (a == null || !r.title.trim()) continue;
    const t = r.title.trim();
    fut.push({
      id: r.k, age: a, planned: true, fly: r.fly, home: r.kind === 'home', car: r.kind === 'car', cam: r.kind === 'home' ? 'home' : undefined, type: 'text', optional: true, dot: t, title: t,
      q: `${a}살, ‘${t}’. 그날의 너는 어떤 모습일까?`, hint: (r.fly ? '비행기를 타고 도착했어. ' : r.kind === 'home' ? '길가에 네 집이 생겼어. ' : r.kind === 'car' ? '이제부터는 차를 타고 달려. ' : '') + '한두 단어만 써도 되고 건너뛰어도 괜찮아.', ph: '예: 누구와, 어디에서, 어떤 기분으로', prep: '그날을 위해 지금 해 볼 작은 준비',
    });
  }

  fut.push({
    id: 'tp1', age: tp1Age, pin: true, noArch: true, turning: true, fork: true, type: 'chips', title: '막힌 길 앞에서', weather: 'rain', max: 1, min: 0, optional: true, skipLabel: '그냥 계속 걷기 ›',
    q: draw(anchorKey === 'school'
      ? [`${tp1Age}살. 그토록 바라던 곳에서, 기다리던 소식이 오지 않았어.`, `${tp1Age}살. 들어가긴 했는데, 막상 배워 보니 이 길이 아닌 것 같아.`, `${tp1Age}살. 집안 사정으로 계획한 길을 그대로 가기 어려워졌어.`]
      : anchorKey === 'job'
        ? [`${tp1Age}살. 꼭 들어가고 싶던 일터의 문이 열리지 않았어.`, `${tp1Age}살. 어렵게 얻은 첫 일터가 생각과 너무 달라.`, `${tp1Age}살. 일하던 곳이 갑자기 문을 닫았어.`]
        : [`${tp1Age}살. 오래 준비한 일이 뜻대로 되지 않았어.`, `${tp1Age}살. 믿고 있던 계획이 한순간에 어그러졌어.`]) + ' 계획한 길이 막혔을 때, 너는 어느 쪽으로 걸을까?',
    hint: '어느 길도 끝나지 않아. 고른 길 끝에서 또 다른 길이 열려.',
    options: TP1_OPTIONS, custom: '나만의 선택 (직접 쓰기)',
  });
  fut.push({
    id: 'tp1b', age: tp1Age + 1, pin: true, noArch: true, turning: true, type: 'connect', title: '다시 걷는 길', dot: '다시 걷는 길', optional: true,
    q: { retry: '다시 한 해를 걸었어. 이번엔 무엇을 다르게 해 볼까?', turn: '방향을 틀자 처음 보는 길이 나왔어. 이 길에서 너는 무엇을 시작할까?', rest: '걸음을 멈추니 지나온 길이 보였어. 쉬는 동안 무엇을 해 보고 싶어?', custom: '네가 고른 길 위에 섰어. 여기서 너는 무엇을 시작할까?' }[tp1Pick] || '어쨌든 길은 이어져. 다시 걷기 시작한 너는 무엇을 하고 있을까?',
    hint: (tp1Delay ? '계획이 한 해 늦어졌지만 괜찮아. ' : '') + '지금까지 남긴 점 가운데 이 길에서 힘이 될 것을 두 개까지 골라 봐. 점과 점이 이어져.',
    starters: ['이번에는 ', '나는 먼저 '],
  });

  // 두 번째 갈림길: 일이 바뀌는 날. 좋아서 배우던 것이 여기서 쓰일 수 있다.
  const jobAge = planned('job');
  const retireAge = planned('retire');
  let tp2Age = Math.max(now + 9, tp1Age + 8, jobAge != null ? jobAge + 14 : 42);
  if (retireAge != null) tp2Age = Math.min(tp2Age, Math.max(tp1Age + 4, retireAge - 8));
  const tp2Pick = pickOf(S, 'tp2');
  const tp2Text = draw([['세상이 빠르게 바뀌어, 네가 해 오던 일이 점점 사라지고 있어.', true], ['문득, 지금까지와 전혀 다른 일에 가슴이 뛰기 시작했어.', false], ['오래 몸담은 일터가 갑자기 문을 닫았어.', true], ['몸이 지쳐서, 지금까지처럼 일하기가 어려워졌어.', true], ['함께 일하자는 뜻밖의 제안이 왔어. 지금 자리를 떠나야 해.', false]]);
  const shaken = tp2Text[1];
  fut.push({
    id: 'tp2', tier: 2, age: tp2Age, pin: true, noArch: true, turning: true, fork: true, type: 'chips', title: '일이 바뀌는 날', weather: shaken ? 'rain' : undefined, max: 1, min: 0, optional: true, skipLabel: '그냥 계속 걷기 ›',
    q: `${tp2Age}살. ${tp2Text[0]} 너는 어느 쪽으로 걸을까?`,
    hint: '진로는 한 번 정하면 끝나는 게 아니야. 어느 쪽을 골라도 길은 이어져.',
    options: TP2_OPTIONS, custom: '나만의 선택 (직접 쓰기)',
  });
  fut.push({
    id: 'tp2b', tier: 2, age: tp2Age + 1, pin: true, noArch: true, turning: true, type: 'connect', title: '또 다른 길', dot: '또 다른 길', optional: true,
    q: { renew: '익숙한 일에 새 옷을 입히는 중이야. 무엇을 새로 배우고 있어?', move: '낯선 일터의 첫날이야. 어떤 일을 시작했어?', grow: '좋아서 하던 것이 일이 되는 날이야. 무엇을 키워 가고 있어?', custom: '네가 고른 길 위에 섰어. 어떤 일을 하고 있어?' }[tp2Pick] || '길은 조금 달라졌지만 너는 계속 걷고 있어. 요즘 어떤 일을 하고 있어?',
    hint: '예전에 남긴 점이 여기서 쓰일지도 몰라. 두 개까지 골라 이어 봐.',
    starters: ['나는 요즘 ', '예전에 배운 '],
  });

  // 뜻밖의 질문: 늘 만나는 것
  fut.push(
    {
      id: 'meet1', tier: 2, age: 23, surprise: true, type: 'chips', title: '뜻밖의 만남', dot: '만난 사람', people: 'one', wait: true, cam: 'meet', max: 1, min: 0, optional: true,
      q: '길모퉁이에서 누군가 손을 흔들고 있어. 이 사람은 누구일까?', hint: `"${HINTS[hints[0] % HINTS.length]}"`,
      options: [opt('friend', '평생 친구', 'friend'), opt('mentor', '스승·멘토', 'mentor'), opt('coworker', '함께 일하는 동료', 'coworker'), opt('senior', '닮고 싶은 선배', 'mentor')],
      custom: '직접 쓰기', text: '이 사람과 어떤 사이가 되고 싶어?',
    },
    {
      id: 'learn', tier: 2, age: 33, surprise: true, type: 'chips', title: '배우고 싶은 것', dot: '좋아서 배운 것', max: 2, min: 0, optional: true,
      q: '일이나 성적과 상관없이, 그냥 좋아서 배우고 싶은 게 있다면 뭘까?', hint: '직업이 되지 못한 꿈도 취미로 평생 이어 갈 수 있어. 두 가지까지 골라 봐.',
      options: [{ k: 'music', label: '악기·노래' }, { k: 'sport', label: '운동·춤' }, { k: 'lang', label: '외국어' }, { k: 'art', label: '그림·글쓰기' }, { k: 'make', label: '요리·만들기' }, { k: 'study', label: '새로운 공부' }],
      custom: '직접 쓰기', text: '왜 배우고 싶어? 언제, 누구와, 어떻게 배울까?', prep: '지금 맛보기로 시작해 볼 수 있는 것',
    },
    {
      id: 'bye', tier: 3, age: 70, surprise: true, type: 'text', title: '먼저 길을 마친 사람에게', optional: true, fx: 'depart', needElder: true,
      q: '함께 걷던 누군가는 먼저 길을 마치기도 해. 그 사람에게 지금 꼭 전하고 싶은 말이 있다면?',
      hint: '마음이 무거우면 건너뛰어도 돼. 건너뛰면 모두 끝까지 함께 걸어.',
      starters: ['고마웠어요, ', '미처 말하지 못했지만 '], skipLabel: '끝까지 함께 걸을래',
    },
  );
  // 뜻밖의 제안: 떠난다고 고르면 다음 장면까지 비행기를 타고 간다
  fut.push({ surprise: true, hint: '떠난다를 고르면 다음 장면까지 비행기를 타고 가.', ...CHANCE });
  // 뜻밖의 질문: 사람마다 다르게 한 장을 뽑는다
  const DECK = [
    {
      id: 'give', age: 52, type: 'chips', title: '손을 내미는 사람', people: 'one', wait: true, cam: 'meet', max: 1, min: 0, optional: true, fixedRole: 'junior',
      q: '이번엔 네가 누군가에게 손을 내밀 차례야. 너는 누구를, 어떻게 돕고 있을까?', hint: `"${HINTS[hints[1] % HINTS.length]}"이 되어 주는 건 이제 너야.`,
      options: [{ k: 'young', label: '예전의 나 같은 아이' }, { k: 'jr', label: '일을 배우는 후배' }, { k: 'nb', label: '이웃과 마을' }, { k: 'far', label: '먼 곳의 누군가' }],
      custom: '직접 쓰기', text: '어떻게 돕고 있어?',
    },
    { id: 'proud', age: 62, type: 'text', title: '가장 뿌듯한 일', optional: true, q: '문득 걸어온 길을 돌아봤어. 무엇이 가장 뿌듯할까?', starters: ['내가 가장 잘한 일은 ', '끝까지 놓지 않은 것은 '] },
    { id: 'money', age: 38, type: 'text', title: '뜻밖의 큰돈', optional: true, q: '생각지도 못한 큰돈이 생겼어. 가장 먼저 어디에, 누구를 위해 쓸까?', starters: ['가장 먼저 ', '나를 위해서는 '] },
    { id: 'health', age: 48, type: 'text', title: '몸이 보내는 신호', optional: true, q: '몸이 쉬어 가라는 신호를 보냈어. 오래 걷기 위해 바꿀 습관 한 가지는?', starters: ['나는 ', '그만둘 것은 '], prep: '지금부터 들일 수 있는 건강 습관' },
    { id: 'ask', age: 57, type: 'text', title: '오랜 친구의 부탁', optional: true, q: '오랜 친구가 들어주기 어려운 부탁을 해 왔어. 너는 어떻게 할까?', starters: ['나는 ', '친구에게 '] },
    { id: 'talent', age: 28, type: 'text', title: '몰랐던 재능', optional: true, dot: '몰랐던 재능', q: '네가 몰랐던 재능을 누군가 알아봐 줬어. 어떤 재능일까?', starters: ['사람들이 말하길 나는 ', '해 보니 의외로 '] },
    { id: 'moving', age: 31, type: 'text', title: '갑작스러운 이사', optional: true, q: '갑자기 먼 도시로 옮겨 살게 됐어. 낯선 곳에서 가장 먼저 무엇을 할까?', starters: ['가장 먼저 ', '낯선 동네에서 나는 '] },
    {
      id: 'offer', age: 34, type: 'chips', title: '꿈꾸던 연락', max: 1, min: 0, optional: true,
      q: '꿈꾸던 곳에서 함께 일하자는 연락이 왔어. 그런데 지금 가진 걸 내려놓아야 해. 어떻게 할래?',
      options: [{ k: 'go', label: '내려놓고 간다' }, { k: 'stay', label: '지금 자리를 지킨다' }, { k: 'ask', label: '둘 다 할 방법을 찾아본다' }], text: '그렇게 고른 까닭은?',
    },
    { id: 'lost', age: 36, type: 'text', title: '한순간에 잃은 것', optional: true, weather: 'rain', q: '오래 쌓아 온 것을 한순간에 잃었어. 다시 시작할 때 꼭 지키고 싶은 한 가지는?', starters: ['다시 시작한다면 ', '잃고 나서 알게 된 건 '] },
    { id: 'reunion', age: 39, type: 'text', title: '우연히 만난 옛 친구', optional: true, q: '길에서 학창 시절 친구를 우연히 만났어. 친구는 지금의 너를 보고 뭐라고 할까?', starters: ['친구는 ', '우리는 한참 '] },
    { id: 'award', age: 44, type: 'text', title: '뜻밖의 큰 상', optional: true, q: '생각지도 못한 큰 상을 받게 됐어. 무대에 올라 가장 먼저 할 말은?', starters: ['이 상은 ', '제일 먼저 고마운 사람은 '] },
    { id: 'crisis', age: 46, type: 'text', title: '세상이 멈춘 날', optional: true, weather: 'rain', q: '큰 재난으로 세상이 한동안 멈췄어. 그때 너는 누구를 챙기고 무엇을 할까?', starters: ['나는 먼저 ', '집에 머무는 동안 '] },
    { id: 'care2', age: 50, type: 'text', title: '달려가야 하는 날', optional: true, q: '소중한 사람이 아프다는 소식을 들었어. 너는 무엇을 내려놓고 달려갈까?', hint: '마음이 무거우면 건너뛰어도 돼.', starters: ['나는 ', '그 사람 곁에서 '] },
    { id: 'letter', age: 55, type: 'text', title: '스무 살의 편지', optional: true, q: '스무 살의 네가 미래의 너에게 쓴 편지가 도착했어. 뭐라고 적혀 있을까?', starters: ['“지금쯤 너는 ', '“약속해 줘. '] },
  ];
  // 새로 시작할 때마다 다른 세 장이 나온다
  const pool = DECK.map((d) => [rnd(), d]).sort((x, y) => x[0] - y[0]).slice(0, [0, 0, 1, 3][level]).map((x) => x[1]);
  for (const d of pool) fut.push({ surprise: true, sudden: true, ...d });


  const ELDERS = ['mom', 'dad', 'grandma', 'grandpa', 'teacher'];
  const hasElder = ['care', 'beside'].some((id) => !S.a[id]?.skip && (S.a[id]?.picks || []).some((k) => ELDERS.includes(k)));
  // 계획한 사건과 갈림길이 먼저 자리를 잡고, 뜻밖의 질문은 겹치지 않는 나이로 옮긴다
  const list = fut.filter((f) => f.age >= (f.planned ? now + 1 : now + 2) && !(f.needElder && !hasElder));
  const taken = new Set(list.filter((f) => f.planned || f.pin).map((f) => f.age));
  for (const f of list) { if (f.planned || f.pin) continue; while (taken.has(f.age)) f.age += 1; taken.add(f.age); }
  const rank = (f) => (f.id === 'tp1' || f.id === 'tp2' ? 1 : 0); // 같은 나이면 계획한 장면 다음에 갈림길
  list.sort((x, y) => x.age - y.age || rank(x) - rank(y));
  let lastFut = now;
  for (const f of list) { add({ act: 3, scene: true, ...f }); lastFut = f.age; }

  // ── 4막 해 질 녘 ──
  const minLife = Math.max(70, lastFut + 5);
  const life = Math.min(110, Math.max(S.life ?? 85, minLife));
  add({
    id: 'life', act: 4, age: lastFut + 2, type: 'slider', min: minLife, max: 110, def: Math.max(85, minLife),
    q: '해가 기울고 있어. 이 길은 몇 살까지 이어질까?', hint: '아무도 모르는 일이지만 상상해 보자. 요즘 평균은 여든을 조금 넘어.', unit: '살까지',
  });
  add({
    id: 'last', act: 4, age: life, type: 'text', scene: true, optional: true, final: true, title: '마지막 날의 나', cam: 'front',
    q: `${life}살, 길의 끝이야. 마지막 날의 너는 어디에서 어떤 모습으로 있을까?`, starters: ['나는 ', '창밖에는 ', '내 손에는 '],
  });
  add({
    id: 'words', tier: 2, act: 4, age: life, walk: false, type: 'text', scene: true, optional: true, final: true, title: '남겨질 사람들에게', cam: 'front',
    q: '네가 떠난 뒤에도 길을 걸어갈 사람들이 있어. 그들에게 건네는 마지막 인사는?', starters: ['고마웠어. ', '내가 없어도 ', '너희와 걸어서 '],
  });
  add({
    id: 'remember', act: 4, age: life, walk: false, type: 'text', scene: true, final: true, title: '기억되고 싶은 모습', cam: 'front', short: true, optional: true,
    q: '사람들이 너를 어떤 사람으로 기억하면 좋겠어?', hint: '한 줄이면 충분해.',
    starters: ['늘 곁에 있어 준 사람', '끝까지 해낸 사람', '웃게 해 준 사람'], ph: '…한 사람',
  });
  add({ id: 'star', act: 4, age: life, walk: false, type: 'say', final: true, fx: 'finale', cam: 'finale', q: `${name}의 길은 여기까지야.`, hint: '정말 잘 걸었어. 함께 걸은 사람들이 너를 오래 기억할 거야.', cta: '걸어온 길 올려다보기' });
  add({ id: 'constel', act: 4, age: life, walk: false, type: 'constel', final: true, fx: 'finale', cam: 'sky', q: '돌아보니, 점들이 이어져 있었어.', hint: '막힌 길도, 가지 않은 길도 모두 이 별자리의 일부야.', cta: '눈을 떠 보기' });

  // ── 5막 돌아보기 (지금 나이로 되돌아온다) ──
  const left = Math.max(0, life - now);
  const pct = Math.round((now / life) * 100);
  add({
    id: 'wake', act: 5, back: true, type: 'say', fx: 'rewind', cam: 'front',
    q: `너는 아직 ${now}살이야.`,
    hint: `방금 본 길 가운데 걸어온 건 ${pct}%뿐. 남은 ${100 - pct}%, 약 ${left}년(${(left * 365).toLocaleString('ko-KR')}일)이 아직 네 앞에 있어. 계획이 바뀌어도 길은 이어진다는 걸 이제 알아.`,
    cta: '그럼 오늘은',
  });
  add({
    id: 'step', act: 5, back: true, type: 'text', short: true, cam: 'front', title: '오늘 찍는 점 하나',
    q: '그 별자리를 향해, 이번 주에 찍을 수 있는 점 하나는 뭘까?', hint: '작을수록 좋아. 지금은 쓸모를 몰라도 괜찮아. 점은 나중에 이어지니까.',
    starters: ['이번 주에 나는 ', '오늘 집에 가서 '], ph: '예: 고마운 사람에게 문자 보내기',
  });
  add({ id: 'title', act: 5, back: true, type: 'title', cam: 'front', q: '마지막으로, 이 드라마에 제목을 붙여 줘.', hint: '네가 쓴 이야기야. 언제든 다시 고칠 수 있어.', cta: '드라마 완성' });
  add({ id: 'hub', act: 5, back: true, type: 'hub', cam: 'walk' });

  // 거리 매기기
  let d = 0;
  let nowDist = 0;
  B.forEach((b, i) => {
    if (b.back) { b.dist = nowDist; b.age = now; return; }
    if (i > 0 && b.walk !== false) d += STEP;
    b.dist = d;
    if (b.id === 'values') nowDist = d;
  });
  return B;
}

function peopleOf(b, a) {
  if (!a || a.skip) return [];
  const out = [];
  if (b.people === 'picks') {
    for (const k of a.picks || []) {
      const o = b.options.find((x) => x.k === k);
      if (o && o.roles) o.roles.forEach((r, n) => out.push({ id: b.id + ':' + k + n, role: r, label: o.names[n] }));
      else if (o && o.role) out.push({ id: b.id + ':' + k, role: o.role, label: o.as || o.label });
    }
    if (a.custom) out.push({ id: b.id + ':custom', role: 'custom', label: a.custom });
  } else if (b.people === 'one') {
    const o = b.options.find((x) => x.k === (a.picks || [])[0]);
    if (!o && !a.custom) return out;
    const role = b.fixedRole || (o && o.role) || 'custom';
    out.push({ id: b.id, role, label: a.custom || (o ? o.label : ROLES[role].label) });
  }
  return out;
}

/** i번째 카드에 섰을 때 함께 걷는 사람들. 감상 화면에서도 같은 규칙을 쓴다. */
export function partyAt(S, beats, i) {
  let b = beats[i];
  if (b && b.back) i = beats.findIndex((x) => x.id === 'plan');
  b = beats[i];
  let list = [];
  for (let j = 0; j < i; j++) {
    const bj = beats[j];
    const a = S.a[bj.id];
    list.push(...peopleOf(bj, a));
    if (bj.fx === 'depart' && a && !a.skip) list = list.filter((p) => !ROLES[p.role].elder);
  }
  if (b && b.wait) {
    const known = peopleOf(b, S.a[b.id])[0];
    list.push({ ...(known || { id: b.id, role: 'unknown', label: '?' }), wait: b.dist + 3 });
  }
  return list.slice(0, 9);
}

export function orbsAt(S, beats, i) {
  const vi = beats.findIndex((x) => x.id === 'values');
  const a = S.a.values;
  if (!a || !a.picks || i < vi) return [];
  return a.picks.map((v) => (VALUES.find((x) => x[0] === v) || [])[1] || '#fff');
}

/** 답을 사람이 읽는 글로 바꾼다. */
export function answerText(b, a) {
  if (!a || a.skip) return '';
  const parts = [];
  if (b.type === 'chips') {
    const labels = (a.picks || []).map((k) => (b.options.find((o) => o.k === k) || {}).label).filter(Boolean);
    if (a.custom) labels.push(a.custom);
    if (labels.length) parts.push(labels.join(', '));
  }
  if (a.text) parts.push(a.text);
  return parts.join(' — ');
}

const DOT_COLORS = ['#ffd166', '#ff9eb5', '#9ad0f5', '#b8a4f0', '#95d5b2', '#ffb4a2', '#f4a261', '#8ecae6'];
/**
 * i번째 카드까지 길 위에 남긴 점들. 답 하나가 점 하나가 되고, 소중한 것은 고른 만큼 점이 된다.
 * 갈림길에서 이 점들 가운데 힘이 될 것을 골라 잇는다.
 */
export function dotsAt(S, beats, i) {
  const out = [];
  for (let j = 0; j < i && j < beats.length; j++) {
    const b = beats[j];
    const a = S.a[b.id];
    if (!b.dot || b.back || !a || a.skip) continue;
    if (b.id === 'values') {
      for (const v of a.picks || []) out.push({ id: 'values:' + v, node: 'values', label: v, color: (VALUES.find((x) => x[0] === v) || [])[1], dist: b.dist, age: b.age });
      continue;
    }
    const text = answerText(b, a);
    if (!text && b.id !== 'customEvent') continue;
    out.push({ id: b.id, node: b.id, label: text ? snip(text) : b.dot, kind: b.dot, color: DOT_COLORS[out.length % DOT_COLORS.length], dist: b.dist, age: b.age });
  }
  return out;
}

/** 점과 점을 이은 선. 갈림길 뒤의 장면에서 학생이 직접 고른 것만 잇는다. */
export function linksOf(S, beats) {
  const out = [];
  beats.forEach((b, i) => {
    const a = S.a[b.id];
    if (b.type !== 'connect' || !a || a.skip || !(a.links || []).length) return;
    const dots = dotsAt(S, beats, i);
    for (const id of a.links) { const d = dots.find((x) => x.id === id); if (d) out.push({ from: d.node, fromLabel: d.label, fromDist: d.dist, to: b.id, toDist: b.dist, color: d.color }); }
  });
  return out;
}

/** 길이 갈라지는 곳. 고른 쪽으로 길이 휜다. */
export function forksOf(S, beats) {
  return beats.filter((b) => b.fork).map((b) => {
    const a = S.a[b.id];
    const k = a && !a.skip ? (a.picks || [])[0] : null;
    const o = b.options.find((x) => x.k === k);
    const done = !!a && (!!a.skip || !!o || !!a.custom);
    return { id: b.id, dist: b.dist, done, dir: o ? o.dir : a && a.custom ? -1 : 0, chosen: o ? o.label : a && a.custom ? a.custom : '', options: b.options.map((x) => ({ label: x.label, dir: x.dir })) };
  });
}

/** 바로 앞 장면에서 먼 곳으로 떠나기로 했다면, 이 장면까지는 비행기를 타고 간다. */
export function flightInto(S, beats, i) {
  const b = beats[i], p = beats[i - 1];
  if (!b || !p || b.back || b.walk === false) return false;
  if (b.fly) return true; // 여행·유학처럼 먼 곳에서 벌어지는 장면에는 날아서 도착한다
  const a = S.a[p.id];
  if (!a || a.skip) return false;
  const picks = a.picks || [];
  return (p.id === 'chance' && picks.includes('go')) || (p.id === 'retire' && picks.includes('trip')) || (p.id === 'school' && picks.includes('world'));
}

/** 차를 산 뒤로는 장면 사이를 차로 달린다. 해 질 녘부터는 다시 걷는다. */
export function rideInto(S, beats, i) {
  const b = beats[i];
  if (!b || b.back || b.walk === false || b.act !== 3 || flightInto(S, beats, i)) return false;
  // 차를 산 뒤 세 번은 차로 달리고, 그다음부터는 다시 걷는다. 차를 또 사면 다시 탄다.
  let since = 99;
  for (let j = 0; j < i; j++) { if (beats[j].car) since = 0; else if (beats[j + 1] && beats[j + 1].walk !== false) since++; }
  return since < 3;
}
/** 집을 장만한 장면의 길가에는 내 집이 선다. */
export function homesOf(beats) {
  return beats.filter((b) => b.home).map((b) => b.dist);
}

/** 강을 건너는 다리가 놓이는 곳: 어린 시절, 아직 걷지 않은 길로 들어설 때, 해 질 녘으로 넘어갈 때. */
export function riversOf(beats) {
  const d = (id) => (beats.find((b) => b.id === id) || {}).dist;
  return [d('care') != null ? d('care') + STEP / 2 : null, d('plan') != null ? d('plan') + STEP / 2 : null, d('life') != null ? d('life') + STEP / 2 : null].filter((x) => x != null);
}

/** 갈림길을 지나 새 길에 들어선 뒤에는 터널을 하나 빠져나온다. */
export function tunnelsOf(beats) {
  return beats.filter((b) => b.type === 'connect').map((b) => b.dist + 18); // 갈림길 팻말과 다음 나이 팻말 사이에 둔다
}
/** 길의 오르막: 마지막 장면은 언덕 위에 있다. */
export function summitOf(beats) {
  const b = beats.find((x) => x.id === 'last');
  return b ? b.dist : null;
}

/** 감상·내보내기에 쓰는 장면 목록. 답한 장면만 담는다. */
export function scenesOf(S, beats) {
  const out = [];
  const links = linksOf(S, beats);
  beats.forEach((b, i) => {
    if (!b.scene) return;
    const a = S.a[b.id];
    let text = answerText(b, a) || (b.planned && b.type === 'text' && a && !a.skip ? b.title : '');
    const mine = links.filter((l) => l.to === b.id);
    if (!text && mine.length) text = b.title;
    if (!text) return;
    out.push({
      id: b.id, i, act: b.act, age: b.age, dist: b.dist, title: b.title, text, prep: (a && a.prep) || '', weather: b.weather, final: !!b.final,
      turning: !!b.turning, fork: !!b.fork, flyIn: flightInto(S, beats, i), rideIn: rideInto(S, beats, i), linked: mine.map((l) => l.fromLabel),
      others: b.fork ? b.options.map((o) => o.label).filter((l) => l !== text.split(' — ')[0]) : [],
    });
  });
  return out;
}

/** 마지막에 올려다보는 별자리: 걸어온 장면이 별, 이은 점이 선, 가지 않은 길이 흐린 가지가 된다. */
export function constelOf(S, beats) {
  const nodes = scenesOf(S, beats).filter((s) => s.id !== 'words');
  const ids = new Set(nodes.map((n) => n.id));
  return { name: S.name || '나', nodes, links: linksOf(S, beats).filter((l) => ids.has(l.from) && ids.has(l.to)) };
}
