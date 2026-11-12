// BizEngine — 화면 없이 숫자만 굴리는 치킨집 장사 계산기.
// 돈의 단위는 만 원, 치킨값과 재료비만 원 단위다.
import { CARDS } from './cards.js';

export const MONTHS = CARDS.length;
const BASE = 560; // 신뢰 50일 때 한 달에 찾는 치킨 수
const CAP = [0, 800, 1300, 2000]; // 가게 크기별로 한 달에 튀길 수 있는 양
const BUSY = 330; // 알바 한 명이 무리 없이 맡는 양

// 카드별·선택별로 드러나는 역량. P 문제해결 · I 혁신적사고 · C 도전정신 · T 협업능력 · G 성장의지
const SKILL = [
  ['', 'C', 'P'], ['', '', 'I'], ['C', 'P', 'I'], ['T', '', ''], ['P', 'C', ''], ['P', '', 'C'],
  ['C', 'CI', 'P'], ['T', '', 'G'], ['P', '', 'PI'], ['P', '', 'PI'], ['T', '', 'PT'], ['G', 'T', 'C'],
];

export function newGame(name) {
  return {
    name: name || '우리 치킨', month: 1, cash: 1000, trust: 50, team: 60, impact: 10,
    price: 18000, unitCost: 8000, staff: 2, wage: 110, rent: 150, etc: 60,
    feeRate: 0.1, deliveryShare: 0.2, demand: 1, temp: 1, level: 1,
    loan: 0, interest: 0, assets: 0, risky: 0, hires: 0, acts: 0, flags: {}, history: [], picks: [], over: null,
  };
}

const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
const won = (n) => `${Math.abs(n).toLocaleString('ko-KR')}원`;
const sign = (n) => (n > 0 ? '+' : '−');
const pct = (m) => `${m >= 1 ? '+' : '−'}${Math.abs(Math.round((m - 1) * 100))}%`;

export function fmt(n) {
  n = Math.round(n);
  const neg = n < 0; n = Math.abs(n);
  const eok = Math.floor(n / 10000), man = n % 10000;
  const s = eok ? `${eok}억${man ? ' ' + man.toLocaleString('ko-KR') + '만' : ''}` : `${man.toLocaleString('ko-KR')}만`;
  return `${neg ? '−' : ''}${s} 원`;
}

function applyFx(s, fx) {
  for (const k of ['cash', 'trust', 'team', 'impact', 'unitCost', 'wage', 'rent', 'etc', 'price']) if (fx[k]) s[k] += fx[k];
  if (fx.priceSet) s.price = fx.priceSet;
  if (fx.feeRate !== undefined) s.feeRate = fx.feeRate;
  if (fx.deliveryShare !== undefined) s.deliveryShare = fx.deliveryShare;
  if (fx.demand) s.demand *= fx.demand;
  if (fx.temp) s.temp *= fx.temp;
  if (fx.flag) s.flags[fx.flag] = true;
  s.trust = clamp(s.trust); s.team = clamp(s.team); s.impact = clamp(s.impact);
}

// 네 지표 말고 바뀐 것들을 짧은 꼬리표로 알려 준다.
function tagsOf(fx, s) {
  const t = [];
  if (fx.priceSet) t.push(`치킨값 ${won(fx.priceSet)}`);
  if (fx.price) t.push(`치킨값 ${won(s.price)}`);
  if (fx.unitCost) t.push(`한 마리 재료비 ${sign(fx.unitCost)}${won(fx.unitCost)}`);
  if (fx.wage) t.push(`알바 한 명 월급 ${sign(fx.wage)}${Math.abs(fx.wage)}만 원`);
  if (fx.etc) t.push(`매달 나가는 돈 ${sign(fx.etc)}${Math.abs(fx.etc)}만 원`);
  if (fx.feeRate !== undefined) t.push(fx.feeRate ? `배달 수수료 ${Math.round(fx.feeRate * 100)}%` : '배달 수수료 없음');
  if (fx.demand) t.push(`찾는 손님 ${pct(fx.demand)}`);
  if (fx.temp) t.push(`다음 장사만 손님 ${pct(fx.temp)}`);
  return t;
}

export const cardFor = (s) => CARDS[s.month - 1];

export function choose(s, idx, rng = Math.random) {
  const card = cardFor(s), c = card.choices[idx];
  const before = { cash: s.cash, trust: s.trust, team: s.team, impact: s.impact };
  let text = c.text;
  const tags = [];
  applyFx(s, c.fx); tags.push(...tagsOf(c.fx, s));
  let luck = null;
  if (c.risk) {
    s.risky = (s.risky || 0) + 1;
    if (rng() < c.risk.p) { applyFx(s, c.risk.bad.fx); tags.push(...tagsOf(c.risk.bad.fx, s)); text += ' ' + c.risk.bad.text; luck = 'bad'; }
    else { text += ' ' + c.risk.good.text; luck = 'good'; }
  }
  const deltas = {};
  for (const k in before) deltas[k] = s[k] - before[k];
  s.picks.push({ month: s.month, title: card.title, label: c.label, idx });
  return { label: c.label, text, deltas, tags, concept: card.concept, luck };
}

export function runMonth(s) {
  const cap = CAP[s.level];
  const want = BASE * (0.4 + 1.2 * s.trust / 100) * Math.pow(18000 / s.price, 1.3) * (0.85 + 0.3 * s.team / 100) * s.demand * s.temp;
  const qty = Math.round(Math.min(cap, want));
  const lost = Math.max(0, Math.round(want - cap));
  const revenue = Math.round(qty * s.price / 10000);
  const rows = [
    ['재료비', Math.round(qty * s.unitCost / 10000), `${qty.toLocaleString('ko-KR')}마리 × ${won(s.unitCost)}`],
    ['인건비', s.staff * s.wage, `알바 ${s.staff}명 × ${s.wage}만 원`],
    ['임대료', s.rent, ''],
    ['배달 수수료', Math.round(revenue * s.deliveryShare * s.feeRate), s.feeRate ? `배달 매출의 ${Math.round(s.feeRate * 100)}%` : ''],
    ['전기·가스·기타', s.etc, ''],
  ];
  if (s.interest) rows.push(['대출 이자', s.interest, '']);
  const cost = rows.reduce((a, r) => a + r[1], 0);
  const profit = revenue - cost;
  const month = s.month, price = s.price;
  s.cash += profit; s.temp = 1;

  const notes = [];
  let dTrust = Math.round((s.team - 55) / 15), dTeam = 0;
  if (dTrust > 0) notes.push('알바생들이 신나게 일해서 손님 평가가 올랐어.');
  if (dTrust < 0) notes.push('가게 분위기가 가라앉아 서비스 평가가 떨어졌어.');
  if (s.flags.frozen) { dTrust -= 3; notes.push('냉동 닭으로 바꾼 뒤 "맛이 예전 같지 않다"는 말이 이어져.'); }
  if (s.impact >= 50) { dTrust += 1; notes.push('"착한 가게"라는 소문이 손님을 데려와.'); }
  if (lost > cap * 0.08) { dTrust -= 2; notes.push(`손님이 넘쳐서 ${lost.toLocaleString('ko-KR')}마리는 팔지 못했어. 가게를 키울 때가 됐어.`); }
  if (qty / s.staff > BUSY) { dTeam -= 4; notes.push('일손이 모자라 알바생들이 지쳤어. 한 명 더 뽑는 걸 생각해 봐.'); }
  else if (s.staff > 2 && qty / s.staff < 170) notes.push('손님 수에 비해 일하는 사람이 많아. 인건비가 무거워.');
  if (profit < 0) notes.push('이번 달은 번 돈보다 쓴 돈이 많았어.');
  s.trust = clamp(s.trust + dTrust); s.team = clamp(s.team + dTeam);

  let loanTaken = false;
  if (s.cash < 0) {
    if (!s.loan) { s.loan = 500; s.cash += 500; s.interest = 10; loanTaken = true; }
    else s.over = 'bankrupt';
  }
  s.history.push({ month, profit, revenue, qty, cash: s.cash });
  s.month += 1;
  if (!s.over && s.month > MONTHS) s.over = 'done';
  return { month, price, qty, lost, revenue, rows, cost, profit, notes, loanTaken, dTrust, dTeam };
}

// 손익표 아래에서 고를 수 있는 "가게 키우기".
export function actions(s) {
  const list = [];
  if (s.staff < 5) list.push({ id: 'hire', icon: '👥', label: '알바 한 명 더 뽑기', cost: 0, desc: `매달 인건비 +${s.wage}만 원 · 일손이 넉넉해져` });
  if (s.level === 1) list.push({ id: 'remodel', icon: '✨', label: '가게 새 단장', cost: 600, desc: '네온 간판 · 주문 기계 · 한 달 1,300마리까지' });
  if (s.level === 2) list.push({ id: 'expand', icon: '🏢', label: '2층으로 넓히기', cost: 1500, desc: '2층 매장 · 배달 오토바이 · 임대료 +100만 원' });
  return list.map((a) => ({ ...a, ok: s.cash >= a.cost }));
}

export function act(s, id) {
  const a = actions(s).find((x) => x.id === id);
  if (!a || !a.ok) return false;
  s.cash -= a.cost;
  s.acts = (s.acts || 0) + 1;
  if (id === 'hire') { s.hires = (s.hires || 0) + 1; s.staff += 1; s.team = clamp(s.team + 5); }
  if (id === 'remodel') { s.level = 2; s.assets += 400; s.trust = clamp(s.trust + 6); s.demand *= 1.15; }
  if (id === 'expand') { s.level = 3; s.assets += 1000; s.rent += 100; s.trust = clamp(s.trust + 5); s.demand *= 1.25; }
  return true;
}

export function ending(s) {
  // 순자산 = 통장 + 가게에 들인 돈의 값어치(들인 돈의 3분의 2) − 빚
  const net = s.cash + s.assets - s.loan;
  const total = s.history.reduce((a, h) => a + h.profit, 0);
  let type;
  if (s.over === 'bankrupt') type = { icon: '🌱', name: '다시 일어서는 사장님', line: '가게 문은 닫았지만, 왜 어려워졌는지 아는 사람은 다음에 더 잘해.' };
  else if (s.trust >= 65 && s.team >= 65 && s.impact >= 50 && net >= 1200) type = { icon: '🏆', name: '균형의 달인', line: '돈, 손님, 직원, 동네를 모두 챙겼어. 가장 어려운 길을 해냈어.' };
  else {
    const score = { money: Math.min(100, net / 30), trust: s.trust, team: s.team, impact: s.impact * 1.15 };
    const top = Object.keys(score).sort((a, b) => score[b] - score[a])[0];
    type = score[top] < 40 ? { icon: '🧭', name: '길을 찾는 중인 사장님', line: '1년을 버텼어. 무엇을 놓쳤는지 돌아보면 두 번째 해는 달라질 거야.' } : {
      money: { icon: '💰', name: '알뜰한 살림꾼 사장님', line: '통장을 든든하게 지켰어. 그 돈으로 무엇을 할지가 다음 숙제야.' },
      trust: { icon: '⭐', name: '단골 부자 사장님', line: '손님이 믿고 찾는 가게를 만들었어. 믿음은 가장 오래가는 재산이야.' },
      team: { icon: '👥', name: '함께 크는 사장님', line: '같이 일하는 사람을 먼저 챙겼어. 좋은 가게는 좋은 일터에서 시작해.' },
      impact: { icon: '💖', name: '동네의 자랑 사장님', line: '가게가 잘될수록 동네도 좋아졌어. 장사가 세상을 바꿀 수 있다는 걸 보여 줬어.' },
    }[top];
  }
  // 창업가 역량 일곱 가지(0~5점). 시험 점수가 아니라 이번 판의 선택이 남긴 흔적이다.
  const n = Math.max(1, s.history.length), black = s.history.filter((h) => h.profit >= 0).length / n;
  const cnt = (k) => s.picks.reduce((a, p) => a + ((SKILL[p.month - 1] || [])[p.idx] || '').split(k).length - 1, 0);
  const half = (v) => Math.max(0.5, Math.min(5, Math.round(v * 2) / 2));
  const alive = s.over !== 'bankrupt';
  const skills = [
    { name: '자기유능감', v: half(1 + black * 2 + s.trust / 100 * 1.5 + (alive && !s.loan ? 0.5 : 0)), tip: '"나는 해낼 수 있다"는 믿음. 흑자를 낸 달과 손님의 믿음이 쌓일수록 커져.' },
    { name: '자기주도성', v: half(1 + Math.min(2.5, (s.acts || 0) * 0.6) + (s.name !== '우리 치킨' ? 0.5 : 0) + Math.max(0, 1 - (s.risky || 0) * 0.5)), tip: '시키지 않아도 스스로 정하고 움직이는 힘. 가게를 스스로 키우고, 운에 맡기지 않을수록 커져.' },
    { name: '성장의지', v: half(1 + (s.level - 1) * 1.2 + (s.hires || 0) * 0.4 + cnt('G') * 0.4 + (alive ? 0.4 : 0)), tip: '지금에 머물지 않고 더 나아지려는 마음. 번 돈을 다시 가게에 들일수록 커져.' },
    { name: '도전정신', v: half(1 + cnt('C') * 0.5 + (s.level - 1)), tip: '실패할 수 있어도 해 보는 용기. 과감한 투자와 새로운 시도를 고를수록 커져.' },
    { name: '혁신적사고', v: half(1 + cnt('I') * 0.8), tip: '남들과 다른 방법을 떠올리는 힘. 새 메뉴나 새로운 방식을 고를수록 커져.' },
    { name: '협업능력', v: half(1 + s.team / 100 * 2.5 + cnt('T') * 0.4), tip: '같이 일하는 사람과 힘을 모으는 능력. 알바생을 존중하는 선택을 할수록 커져.' },
    { name: '문제해결', v: half(1 + Math.min(3, cnt('P') * 0.5) + black), tip: '문제의 원인을 찾아 바로잡는 힘. 눈앞의 불만 끄지 않고 까닭을 고칠수록 커져.' },
  ];
  return { type, net, total, skills };
}
