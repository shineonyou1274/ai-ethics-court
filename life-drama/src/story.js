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

const PLAN = [['school', '진학·진로', 20], ['job', '취업', 26], ['marry', '결혼·동반자', 31], ['home', '자녀', 35], ['retire', '은퇴', 65]];
/** 굵직한 사건의 계획표. 이미 지난 나이의 사건은 빼고, 학생이 정한 나이와 켜고 끔을 반영한다. */
export function planOf(S) {
  const now = S.now ?? 15;
  return PLAN.filter(([, , def]) => def > now).map(([k, label, def]) => {
    const p = (S.plan || {})[k] || {};
    return { k, label, on: p.on !== false, age: Math.min(80, Math.max(now + 2, p.age || def)) };
  });
}

const opt = (k, label, role) => ({ k, label: label || ROLES[k].label, role: role || k });

/** 현재 상태로 질문 카드 목록을 만든다. 답이 바뀌어도 앞쪽 순서는 달라지지 않는다. */
export function build(S) {
  const now = S.now ?? 15;
  const life = S.life ?? 85;
  const name = S.name || '너';
  const B = [];
  const add = (b) => B.push(b);

  // ── 0막 문 열기 ──
  add({ id: 'name', act: 0, age: 0, type: 'name', q: '반가워. 이 드라마의 주인공을 뭐라고 부를까?', hint: '실명 대신 별명도 좋아. 옷 색과 머리 모양도 골라 봐.', cta: '이 모습으로 할게' });
  add({ id: 'now', act: 0, age: 0, walk: false, type: 'age', q: `${name}, 지금 몇 살이야?`, hint: '지금 나이까지는 지나온 길, 그 뒤는 네가 그려 갈 길이야.' });
  add({ id: 'open', act: 0, age: 0, walk: false, type: 'say', cam: 'front', q: `${name}의 길은 새벽에 시작됐어.`, hint: '맨 처음으로 돌아가서, 마지막 날까지 천천히 걸어 보자. 쓰기 어려운 질문은 건너뛰어도 괜찮아.', cta: '첫걸음 떼기' });

  // ── 1막 지나온 길 ──
  add({
    id: 'care', act: 1, age: 1, type: 'chips', scene: true, title: '나를 돌봐 준 사람', people: 'picks', max: 3, custom: '직접 쓰기 (예: 이모, 원장 선생님)',
    q: '아주 작았던 너. 그때 너를 돌봐 준 사람은 누구였을까?', hint: '최대 세 명. 고른 사람이 네 곁에서 함께 걸어.',
    options: [opt('mom'), opt('dad'), opt('grandma'), opt('grandpa'), opt('sibling', '언니·누나', 'sibling'), opt('sibling2', '오빠·형', 'sibling'), opt('teacher')],
    text: '그 사람에게 받은 것 하나를 적는다면? (선택)',
  });
  const kidAge = Math.max(4, Math.min(8, now - 4));
  add({
    id: 'kid', act: 1, age: kidAge, type: 'text', scene: true, optional: true, title: '빠져들었던 것',
    q: `${kidAge}살 무렵, 시간 가는 줄 모르고 빠져들었던 건 뭐였어?`,
    starters: ['나는 ', '그때 제일 신났던 건 ', '혼자서도 몇 시간씩 '],
  });
  const hardAge = Math.max(kidAge + 2, Math.round(now * 0.85));
  if (hardAge < now) {
    add({
      id: 'hard', act: 1, age: hardAge, type: 'text', scene: true, optional: true, weather: 'rain', title: '비 오던 날',
      q: '걸어오는 동안 비가 내린 날도 있었지. 가장 힘들었던 순간, 무엇이 너를 다시 걷게 했어?',
      hint: '적기 어려우면 건너뛰어도 돼. 이 글은 이 기기에만 남아.',
      starters: ['그때 나는 ', '나를 다시 걷게 한 건 '],
    });
  }

  // ── 2막 지금의 나 ──
  add({
    id: 'values', act: 2, age: now, type: 'chips', scene: true, title: '내게 소중한 것', min: 3, max: 3, cam: 'front', fx: 'orbs',
    q: `${now}살, 지금의 ${name}. 가장 소중한 것 세 가지를 골라 봐.`, hint: '고른 세 가지가 작은 빛이 되어 끝까지 함께 가.',
    options: VALUES.map(([v]) => ({ k: v, label: v })),
  });
  add({
    id: 'me', act: 2, age: now, walk: false, type: 'text', scene: true, optional: true, title: '나는 이런 사람', cam: 'front',
    q: '너를 잘 아는 사람이 너를 한 문장으로 소개한다면?',
    starters: ['나는 ', '겉으로는 ', '사람들은 잘 모르지만 나는 '],
  });
  add({
    id: 'beside', act: 2, age: now, walk: false, type: 'chips', scene: true, title: '지금 곁에 있는 사람', people: 'picks', max: 2, optional: true, cam: 'front',
    custom: '직접 쓰기 (별명도 좋아)',
    q: '지금 네 곁에서 함께 걷는 사람은 누구야?', hint: '최대 두 명까지 길에 합류해.',
    options: [opt('friend'), opt('sibling', '형제자매', 'sibling'), opt('teacher'), opt('pet')],
  });

  // ── 3막 앞으로의 길 ──
  // 굵직한 사건은 먼저 계획하고 나이도 스스로 정한다. 그 사이사이에 뜻밖의 질문을 만난다.
  const P = planOf(S);
  if (P.length) {
    add({
      id: 'plan', act: 3, age: now, walk: false, type: 'plan', cam: 'front',
      q: '이제부터는 아직 걸어 보지 않은 길이야. 굵직한 일을 몇 살에 맞이할까?',
      hint: '활동지의 나이를 옮겨 적어. 계획에 없는 일은 체크를 꺼 둬.', cta: '이 계획으로 출발',
    });
  }
  const at = (k) => { const r = P.find((x) => x.k === k); return r && r.on ? r.age : null; };
  const hints = S.hints || [0, 1];
  const fut = [];
  const soon = now + 3;
  if (soon <= 17) {
    fut.push({
      id: 'soon', age: soon, type: 'text', optional: true, title: '몇 년 뒤의 나',
      q: `${soon}살, 고등학생이 된 너는 어떤 하루를 보내고 있을까?`,
      starters: ['나는 ', '아침에 눈을 뜨면 ', '그때 내가 매일 하는 일은 '],
      prep: '이 장면을 위해 올해 시작할 수 있는 것',
    });
  }
  // 계획한 사건
  const EVENTS = {
    school: (a) => ({
      type: 'chips', title: '진학과 진로', max: 1, min: 1,
      q: `${a}살, 학교를 마친 너는 어느 길에 서 있을까?`, hint: '정답은 없어. 지금 마음이 가는 쪽을 골라 봐.',
      options: [{ k: 'univ', label: '대학에 진학하기' }, { k: 'skill', label: '전문 기술 배우기' }, { k: 'work', label: '바로 일 시작하기' }, { k: 'world', label: '세상 경험 먼저 하기' }],
      custom: '나만의 길 (직접 쓰기)', text: '거기서 무엇을 배우고, 어떤 하루를 보내고 있어?', prep: '그 길에 서려고 올해 준비할 것',
    }),
    job: (a) => ({
      type: 'chips', title: '취업과 나의 일', max: 1, min: 1,
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
      type: 'chips', title: '은퇴와 그 뒤', max: 2, optional: true,
      q: `${a}살, 오래 해 온 일을 내려놓는 날이야. 그 뒤의 시간을 무엇으로 채울까?`, hint: '두 가지까지 골라 봐. 길은 아직 많이 남았어.',
      options: [{ k: 'learn', label: '새로운 것 배우기' }, { k: 'serve', label: '봉사와 나눔' }, { k: 'trip', label: '여행' }, { k: 'family', label: '가족과 보내는 시간' }, { k: 'small', label: '작은 일 계속하기' }],
      custom: '직접 쓰기', text: '은퇴한 다음 날 아침을 그려 봐.',
    }),
  };
  for (const k of Object.keys(EVENTS)) { const a = at(k); if (a != null) fut.push({ id: k, age: a, planned: true, ...EVENTS[k](a) }); }
  // 뜻밖의 질문: 늘 만나는 것
  fut.push(
    {
      id: 'meet1', age: 23, surprise: true, type: 'chips', title: '뜻밖의 만남', people: 'one', wait: true, cam: 'meet', max: 1, min: 1,
      q: '길모퉁이에서 누군가 손을 흔들고 있어. 이 사람은 누구일까?', hint: `"${HINTS[hints[0] % HINTS.length]}"`,
      options: [opt('friend', '평생 친구', 'friend'), opt('mentor', '스승·멘토', 'mentor'), opt('coworker', '함께 일하는 동료', 'coworker'), opt('senior', '닮고 싶은 선배', 'mentor')],
      custom: '직접 쓰기', text: '이 사람과 어떤 사이가 되고 싶어?',
    },
    {
      id: 'learn', age: 40, surprise: true, type: 'chips', title: '배우고 싶은 것', max: 2, min: 1,
      q: '일이나 성적과 상관없이, 그냥 좋아서 배우고 싶은 게 있다면 뭘까?', hint: '직업이 되지 못한 꿈도 취미로 평생 이어 갈 수 있어. 두 가지까지 골라 봐.',
      options: [{ k: 'music', label: '악기·노래' }, { k: 'sport', label: '운동·춤' }, { k: 'lang', label: '외국어' }, { k: 'art', label: '그림·글쓰기' }, { k: 'make', label: '요리·만들기' }, { k: 'study', label: '새로운 공부' }],
      custom: '직접 쓰기', text: '왜 배우고 싶어? 언제, 누구와, 어떻게 배울까?', prep: '지금 맛보기로 시작해 볼 수 있는 것',
    },
    {
      id: 'storm', age: 45, surprise: true, type: 'text', title: '길 한가운데의 비', weather: 'rain', optional: true,
      q: '인생의 한가운데에서 큰비를 만났어. 계획대로 되지 않는 날, 너를 다시 일으키는 건 무엇일까?',
      starters: ['그럴 때 나는 ', '나를 일으키는 건 ', '포기하고 싶을 때 떠올릴 것은 '],
      prep: '그 힘을 기르려고 지금 해 볼 수 있는 것',
    },
    {
      id: 'bye', age: 70, surprise: true, type: 'text', title: '먼저 길을 마친 사람에게', optional: true, fx: 'depart', needElder: true,
      q: '함께 걷던 누군가는 먼저 길을 마치기도 해. 그 사람에게 지금 꼭 전하고 싶은 말이 있다면?',
      hint: '마음이 무거우면 건너뛰어도 돼. 건너뛰면 모두 끝까지 함께 걸어.',
      starters: ['고마웠어요, ', '미처 말하지 못했지만 '],
      skipLabel: '끝까지 함께 걸을래',
    },
  );
  // 뜻밖의 질문: 사람마다 다르게 두 장을 뽑는다
  const DECK = [
    {
      id: 'give', age: 52, type: 'chips', title: '손을 내미는 사람', people: 'one', wait: true, cam: 'meet', max: 1, min: 1, fixedRole: 'junior',
      q: '이번엔 네가 누군가에게 손을 내밀 차례야. 너는 누구를, 어떻게 돕고 있을까?', hint: `"${HINTS[hints[1] % HINTS.length]}"이 되어 주는 건 이제 너야.`,
      options: [{ k: 'young', label: '예전의 나 같은 아이' }, { k: 'jr', label: '일을 배우는 후배' }, { k: 'nb', label: '이웃과 마을' }, { k: 'far', label: '먼 곳의 누군가' }],
      custom: '직접 쓰기', text: '어떻게 돕고 있어?',
    },
    { id: 'proud', age: 62, type: 'text', title: '가장 뿌듯한 일', optional: true, q: '문득 걸어온 길을 돌아봤어. 무엇이 가장 뿌듯할까?', starters: ['내가 가장 잘한 일은 ', '끝까지 놓지 않은 것은 '] },
    {
      id: 'chance', age: 29, type: 'chips', title: '뜻밖의 제안', max: 1, min: 1,
      q: '전혀 다른 나라에서 1년 살아 볼 기회가 갑자기 생겼어. 어떻게 할래?',
      options: [{ k: 'go', label: '떠난다' }, { k: 'stay', label: '지금 자리를 지킨다' }, { k: 'later', label: '조금 미뤄 두고 준비한다' }], text: '그렇게 고른 까닭은?',
    },
    { id: 'fail', age: 33, type: 'text', title: '크게 넘어진 날', optional: true, q: '오래 공들인 일이 크게 실패했어. 그날 저녁, 너는 누구에게 연락하고 무슨 말을 할까?', starters: ['나는 ', '제일 먼저 떠오르는 사람은 '] },
    { id: 'money', age: 38, type: 'text', title: '뜻밖의 큰돈', optional: true, q: '생각지도 못한 큰돈이 생겼어. 가장 먼저 어디에, 누구를 위해 쓸까?', starters: ['가장 먼저 ', '나를 위해서는 '] },
    { id: 'health', age: 48, type: 'text', title: '몸이 보내는 신호', optional: true, q: '몸이 쉬어 가라는 신호를 보냈어. 오래 걷기 위해 바꿀 습관 한 가지는?', starters: ['나는 ', '그만둘 것은 '], prep: '지금부터 들일 수 있는 건강 습관' },
    { id: 'ask', age: 57, type: 'text', title: '오랜 친구의 부탁', optional: true, q: '오랜 친구가 들어주기 어려운 부탁을 해 왔어. 너는 어떻게 할까?', starters: ['나는 ', '친구에게 '] },
  ];
  const d1 = hints[0] % DECK.length, d2 = (d1 + 1 + (hints[1] % (DECK.length - 1))) % DECK.length;
  fut.push({ surprise: true, ...DECK[d1] }, { surprise: true, ...DECK[d2] });

  const ELDERS = ['mom', 'dad', 'grandma', 'grandpa', 'teacher'];
  const hasElder = ['care', 'beside'].some((id) => !S.a[id]?.skip && (S.a[id]?.picks || []).some((k) => ELDERS.includes(k)));
  // 계획한 사건이 먼저 자리를 잡고, 뜻밖의 질문은 겹치지 않는 나이로 옮긴다
  const taken = new Set(fut.filter((f) => f.planned).map((f) => f.age));
  let lastFut = now;
  const list = fut.filter((f) => f.age >= now + 2 && !(f.needElder && !hasElder));
  for (const f of list) { if (f.planned) continue; while (taken.has(f.age)) f.age += 1; taken.add(f.age); }
  list.sort((x, y) => x.age - y.age);
  for (const f of list) {
    add({ act: 3, scene: true, ...f });
    lastFut = f.age;
  }

  // ── 4막 해 질 녘 ──
  const minLife = Math.max(70, lastFut + 5);
  add({
    id: 'life', act: 4, age: lastFut + 2, type: 'slider', min: minLife, max: 110, def: Math.max(85, minLife),
    q: '해가 기울고 있어. 이 길은 몇 살까지 이어질까?', hint: '아무도 모르는 일이지만 상상해 보자. 요즘 평균은 여든을 조금 넘어.', unit: '살까지',
  });
  add({
    id: 'last', act: 4, age: life, type: 'text', scene: true, optional: true, final: true, title: '마지막 날의 나', cam: 'front',
    q: `${life}살, 길의 끝이야. 마지막 날의 너는 어디에서 어떤 모습으로 있을까?`,
    starters: ['나는 ', '창밖에는 ', '내 손에는 '],
  });
  add({
    id: 'words', act: 4, age: life, walk: false, type: 'text', scene: true, optional: true, final: true, title: '남겨질 사람들에게', cam: 'front',
    q: '네가 떠난 뒤에도 길을 걸어갈 사람들이 있어. 그들에게 건네는 마지막 인사는?',
    starters: ['고마웠어. ', '내가 없어도 ', '너희와 걸어서 '],
  });
  add({
    id: 'remember', act: 4, age: life, walk: false, type: 'text', scene: true, final: true, title: '기억되고 싶은 모습', cam: 'front', short: true, optional: true,
    q: '사람들이 너를 어떤 사람으로 기억하면 좋겠어?', hint: '한 줄이면 충분해.',
    starters: ['늘 곁에 있어 준 사람', '끝까지 해낸 사람', '웃게 해 준 사람'], ph: '…한 사람',
  });
  add({ id: 'star', act: 4, age: life, walk: false, type: 'say', final: true, fx: 'finale', cam: 'finale', q: `${name}의 길은 여기까지야.`, hint: '정말 잘 걸었어. 함께 걸은 사람들이 너를 오래 기억할 거야.', cta: '눈을 떠 보기' });

  // ── 5막 돌아보기 (지금 나이로 되돌아온다) ──
  const left = Math.max(0, life - now);
  const pct = Math.round((now / life) * 100);
  add({
    id: 'wake', act: 5, back: true, type: 'say', fx: 'rewind', cam: 'front',
    q: `너는 아직 ${now}살이야.`,
    hint: `방금 본 길 가운데 걸어온 건 ${pct}%뿐. 남은 ${100 - pct}%, 약 ${left}년(${(left * 365).toLocaleString('ko-KR')}일)이 아직 네 앞에 있어.`,
    cta: '그럼 오늘은',
  });
  add({
    id: 'step', act: 5, back: true, type: 'text', short: true, cam: 'front', title: '이번 주의 한 걸음',
    q: '그 마지막 장면에 닿으려고, 이번 주에 뗄 수 있는 한 걸음은 뭘까?', hint: '작을수록 좋아. 오늘 할 수 있으면 더 좋아.',
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
    const role = b.fixedRole || (o && o.role) || 'custom';
    out.push({ id: b.id, role, label: a.custom || (o ? o.label : ROLES[role].label) });
  }
  return out;
}

/** i번째 카드에 섰을 때 함께 걷는 사람들. 감상 화면에서도 같은 규칙을 쓴다. */
export function partyAt(S, beats, i) {
  let b = beats[i];
  if (b && b.back) i = beats.findIndex((x) => x.id === 'beside') + 1;
  b = beats[i];
  let list = [];
  for (let j = 0; j < i; j++) {
    const bj = beats[j];
    const a = S.a[bj.id];
    list.push(...peopleOf(bj, a));
    if (bj.fx === 'depart' && a && !a.skip) list = list.filter((p) => !ROLES[p.role].elder);
  }
  if (b && b.wait) {
    const a = S.a[b.id];
    const known = peopleOf(b, a)[0];
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

/** 감상·내보내기에 쓰는 장면 목록. 답한 장면만 담는다. */
export function scenesOf(S, beats) {
  const out = [];
  beats.forEach((b, i) => {
    if (!b.scene) return;
    const a = S.a[b.id];
    const text = answerText(b, a);
    if (!text) return;
    out.push({ id: b.id, i, act: b.act, age: b.age, dist: b.dist, title: b.title, text, prep: (a && a.prep) || '', weather: b.weather, final: !!b.final });
  });
  return out;
}
