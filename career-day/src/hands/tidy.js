// 3D 가까이 보기에서 "닦고, 제자리에 놓기"를 하는 장면을 짧게 적는 틀.
// 임상병리사(튜브 꽂기), 방사선사(촬영대 준비), 물리치료사(기구 정리)가 함께 쓴다.
//
// def = {
//   stage: 'lab',                              // src/world/closeups.js 의 무대 이름
//   title, hint, start,                        // 아래 칸의 제목, 안내, 첫 한마디
//   items: [{ id, label, kind: 'rub' | 'move' | 'tap', done }],   // 할 일. done 은 마쳤을 때의 한마디. tap 은 무대의 누를 곳(taps)을 누른다
//   order: ['table', 'paper', 'pad'],          // (있으면) 이 순서를 지켜야 한다
//   early: { paper: '…' },                     // 순서보다 먼저 하려 할 때의 한마디
//   miss: (id, slotId) => '…',                 // 다른 칸에 놓았을 때의 한마디
//   filled: (id, slotId) => '…',               // (있으면) 이미 다른 것이 놓인 칸에 놓았을 때의 한마디. 없으면 공통 한마디
//   wrong: { chartB: { as: 'chart', msg } },   // (있으면) 닮았지만 틀린 물건. as 의 차례에 놓으려 하면 msg 를 보여 주고 제자리로 돌린다 (틀린 누를 곳도 같다)
//   good: 'neat', bad: 'redo',                 // 등급 이름. 실수가 없으면 good
// }
import { checklist } from './closeup-ui.js';

export function tidy(def) {
  return function (el, sc, { sfx, act, done, world }) {
    const ui = checklist(el, { title: def.title, hint: def.hint, items: def.items });
    const left = new Set(def.items.map((it) => it.id));
    let mistakes = 0, finished = false, warned = 0;
    const item = (id) => def.items.find((it) => it.id === id);
    const ready = (id) => { if (!def.order) return true; const k = def.order.indexOf(id); return k < 0 || def.order.slice(0, k).every((x) => !left.has(x)); };
    const finish = () => {
      if (left.size || finished) return;
      finished = true; sfx('good'); act('work');
      ui.msg(mistakes ? '다시 바로잡아 모두 마쳤어요.' : def.finish || '모두 마쳤어요. 다음 사람이 바로 쓸 수 있어요.'); // finish: 실수 없이 마쳤을 때의 한마디 (없으면 정리 장면의 말)
      done(mistakes ? def.bad : def.good, { mistakes });
    };
    const complete = (id) => { if (!left.has(id)) return; left.delete(id); ui.done(id); sfx('pop'); act('work'); if (item(id).done) { ui.msg(item(id).done); warned = Date.now() + 1500; } finish(); }; // 마친 안내를 읽을 틈을 준다. 3초 동안은 '아직 안 돼요' 안내가 덮지 않는다
    const early = (id, count) => {
      if (count) { mistakes++; sfx('bad'); }
      if (count || Date.now() - warned > 1500) { warned = Date.now(); ui.msg((typeof def.early === 'function' ? def.early(id, def.order?.find((x) => left.has(x))) : def.early?.[id]) || '먼저 해야 할 일이 있어요.', true); } // early 가 함수면 (누른 것, 아직 남은 첫 일)을 받는다
    };
    const on = {
      canRub: (id) => ready(id),
      onBlocked: (id) => early(id, false),
      onRub: (id, v) => { ui.progress(id, v); if (v >= 1) complete(id); },
      onDrop: (id) => {
        const w = def.wrong?.[id]; // 닮았지만 틀린 물건(예: 이름이 같은 다른 환자의 차트). 놓으면 제자리로 돌아가고 까닭을 알려 준다
        if (w) { if (!ready(w.as)) { early(w.as, true); return false; } mistakes++; sfx('bad'); ui.msg(w.msg, true); warned = Date.now(); return false; }
        if (!ready(id)) { early(id, true); return false; } complete(id); return true;
      },
      // 누를 곳: 할 일이면 순서를 보고 마친다. wrong 에 적힌 곳(예: 봉투의 다른 줄)이면 실수로 세고 까닭을 알려 준다
      onTap: (id) => {
        const w = def.wrong?.[id];
        if (w) { if (!left.has(w.as) || finished) return false; if (!ready(w.as)) { early(w.as, true); return false; } mistakes++; sfx('bad'); ui.msg(w.msg, true); warned = Date.now(); return false; }
        if (!left.has(id)) return false;
        if (!ready(id)) { early(id, true); return false; } complete(id); return true;
      },
      onMiss: (id, slot, filled) => { mistakes++; sfx('bad'); ui.msg(filled ? def.filled?.(id, slot) || '그 자리에는 이미 다른 것이 놓여 있어요. 빈 자리를 골라요.' : def.miss ? def.miss(id, slot) : '그 자리가 아니에요.', true); },
    };
    let handle = null;
    if (world) { handle = world.closeup(def.stage, on); ui.msg(def.start); }
    else {
      ui.msg('해야 할 일을 순서대로 눌러요.');
      ui.fallback(def.items.map((it) => ({ id: it.id, label: it.label, run: () => (ready(it.id) ? complete(it.id) : (early(it.id, true), false)) })));
    }
    return () => handle?.end();
  };
}

const COLOR = { purple: '보라색', green: '초록색', red: '빨간색' };

export const labtubes = tidy({
  stage: 'lab', title: '들어온 검체 정리', hint: '위쪽 3D 화면에서 직접 해요. 튜브는 끌어서 꽂고, 흘린 시약은 손가락으로 문질러요.',
  start: '쟁반의 튜브를 잡아, 뚜껑 색이 같은 칸에 꽂아요.',
  items: [
    { id: 'purple', label: '보라색 뚜껑 튜브 꽂기', kind: 'move' },
    { id: 'green', label: '초록색 뚜껑 튜브 꽂기', kind: 'move' },
    { id: 'red', label: '빨간색 뚜껑 튜브 꽂기', kind: 'move' },
    { id: 'spill', label: '작업대에 흘린 시약 닦기', kind: 'rub', done: '작업대를 깨끗이 닦았어요.' },
  ],
  miss: (id, slot) => `앗, ${COLOR[id]} 뚜껑을 ${COLOR[slot]} 칸에 꽂으려 했어요. 칸 앞의 색 표시를 보고 다시 꽂아요.`,
  good: 'neat', bad: 'redo',
});

export const xraytable = tidy({
  stage: 'xray', title: '다음 검사를 위한 촬영대', hint: '위쪽 3D 화면에서 직접 해요. 촬영대는 손가락으로 문지르고, 물건은 끌어서 놓아요.',
  start: '앞 검사가 끝났어요. 다음 분이 눕기 전에 무엇부터 할까요?',
  items: [
    { id: 'table', label: '촬영대를 소독 티슈로 닦기', kind: 'rub', done: '촬영대를 닦았어요. 이제 종이 커버를 깔아요.' },
    { id: 'paper', label: '일회용 종이 커버 깔기', kind: 'move', done: '새 종이 커버를 깔았어요.' },
    { id: 'pad', label: '머리 쪽에 자세 받침 놓기', kind: 'move', done: '자세 받침을 놓았어요.' },
  ],
  order: ['table', 'paper', 'pad'],
  early: { paper: '잠깐! 촬영대를 먼저 닦아요. 그 위에 깔아야 깨끗해요.', pad: '자세 받침은 종이 커버를 깐 뒤에 놓아요.' },
  good: 'ready', bad: 'redo',
});

const SHELF = { ball: '공 바구니', band: '밴드 걸이', bell: '아령 받침' };
const THING = { ball: '공은', band: '밴드는', bell: '아령은' };

export const rehabtidy = tidy({
  stage: 'rehab', title: '치료를 마친 자리', hint: '위쪽 3D 화면에서 직접 해요. 매트는 손가락으로 문지르고, 기구는 끌어서 제자리에 놓아요.',
  start: '바닥에 놓인 기구를 잡아 오른쪽 정리대의 제자리에 놓아요.',
  items: [
    { id: 'mat', label: '치료 매트를 닦기', kind: 'rub', done: '매트를 닦았어요.' },
    { id: 'ball', label: '공을 바구니에', kind: 'move' },
    { id: 'band', label: '밴드를 걸이에', kind: 'move' },
    { id: 'bell', label: '아령을 받침에', kind: 'move' },
  ],
  miss: (id) => `앗, 그 자리가 아니에요. ${THING[id]} ${SHELF[id]}에 놓아요. 정리대의 이름표를 봐요.`,
  good: 'neat', bad: 'redo',
});

// ── 소방관 ──
export const alarmcheck = tidy({
  stage: 'alarmcheck', title: '화재경보 확인', hint: '위쪽 3D 화면에서 직접 해요. 물기는 손가락으로 문지르고, 가습기와 열쇠는 끌어서 초록 원에 놓아요.',
  start: '연기 감지기 아래를 먼저 살펴요. 진짜 불일까요, 다른 까닭일까요?',
  items: [
    { id: 'look', label: '감지기 아래를 살피기 (탁자의 물기 닦기)', kind: 'rub', done: '연기가 아니라 가습기 김이었어요. 탄 냄새도, 불도 없어요.' },
    { id: 'humid', label: '가습기를 감지기에서 먼 창가로 옮기기', kind: 'move', done: '김이 감지기 쪽으로 오르지 않아요. 이제 수신기를 되돌려요.' },
    { id: 'reset', label: '복구 열쇠로 수신기 되돌리기', kind: 'move', done: '수신기 불이 초록으로 바뀌었어요. 경보가 멈췄어요.' },
  ],
  order: ['look', 'humid', 'reset'],
  early: {
    humid: '잠깐! 먼저 둘레를 살펴요. 진짜 불이 아닌지부터 확인해야 해요.',
    reset: '울린 까닭을 치우기 전에 되돌리면 경보가 또 울려요. 살피고, 까닭을 치운 뒤에 되돌려요.',
  },
  good: 'calm', bad: 'redo',
});

const GEAR = { helmet: '헬멧은', tank: '공기호흡기는', lantern: '랜턴은' };
const GEARSLOT = { helmet: '헬멧', tank: '공기호흡기', lantern: '랜턴' };

export const gearcheck = tidy({
  stage: 'gearcheck', title: '교대 점검', hint: '위쪽 3D 화면에서 직접 해요. 장비는 끌어서 차의 제자리 칸에 싣고, 바닥 물기는 손가락으로 문질러요.',
  start: '깔개 위의 장비를 잡아, 이름표가 같은 칸에 실어요.',
  items: [
    { id: 'helmet', label: '헬멧을 제자리 칸에', kind: 'move' },
    { id: 'tank', label: '공기호흡기를 제자리 칸에', kind: 'move' },
    { id: 'lantern', label: '랜턴을 제자리 칸에', kind: 'move' },
    { id: 'floor', label: '차고 바닥의 물기 닦기', kind: 'rub', done: '바닥 물기를 닦았어요. 뛰어나가도 미끄럽지 않아요.' },
  ],
  miss: (id) => `앗, 그 칸이 아니에요. ${GEAR[id]} '${GEARSLOT[id]}' 칸에 실어요. 칸 위의 이름표를 봐요.`,
  good: 'neat', bad: 'redo',
});

export const hosedrill = tidy({
  stage: 'drill', title: '방수 훈련', hint: '위쪽 3D 화면에서 직접 해요. 장비는 끌어서 초록 원에 놓고, 물이 나오면 표적 위를 손가락으로 문질러요.',
  start: '깔개 위의 장비로 물을 보낼 준비를 해요. 무엇부터 할까요?',
  items: [
    { id: 'hose', label: '말아 둔 호스를 소화전 옆에 펴기', kind: 'move', done: '호스를 폈어요. 이제 끝에 관창을 끼워요.' },
    { id: 'nozzle', label: '호스 끝에 관창 끼우기', kind: 'move', done: '관창을 끼웠어요. 이제 소화전을 열 수 있어요.' },
    { id: 'valve', label: '손잡이로 소화전 열기', kind: 'move', done: '물이 들어와요! 표적 위를 문질러 물줄기를 보내요.' },
    { id: 'fire', label: '물줄기로 표적의 불꽃 표시 지우기', kind: 'rub', done: '두 표적의 불꽃 표시를 모두 지웠어요.' },
  ],
  order: ['hose', 'nozzle', 'valve', 'fire'],
  early: {
    nozzle: '호스부터 펴요. 관창을 끼울 호스 끝이 아직 없어요.',
    valve: '잠깐! 관창부터 끼워요. 물이 먼저 들어오면 호스 끝이 크게 흔들려 위험해요.',
    fire: '아직 물이 나오지 않아요. 호스, 관창, 소화전 순서로 준비해요.',
  },
  good: 'steady', bad: 'redo',
});

export const washdown = tidy({
  stage: 'washdown', title: '다음 출동 준비', hint: '위쪽 3D 화면에서 직접 해요. 그을음은 손가락으로 문지르고, 공기통은 끌어서 옮겨요.',
  start: '세척대에 방화복을 펼쳤어요. 무엇부터 할까요?',
  items: [
    { id: 'soot', label: '방화복의 그을음 닦기', kind: 'rub', done: '그을음을 닦아 냈어요. 이제 공기통을 바꿔요.' },
    { id: 'used', label: '다 쓴 공기통(빨간 띠)을 충전대로', kind: 'move', done: '다 쓴 통을 충전대에 올렸어요. 차에 자리가 비었어요.' },
    { id: 'fresh', label: '채운 공기통(초록 띠)을 차에 싣기', kind: 'move', done: '채운 통을 실었어요.' },
  ],
  order: ['soot', 'used', 'fresh'],
  early: {
    used: '잠깐! 그을음부터 닦아요. 묻은 채로 만지면 차와 충전대까지 번져요.',
    fresh: '다 쓴 통을 먼저 내려야 채운 통을 실을 자리가 나요.',
  },
  good: 'ready', bad: 'redo',
});

export const firefight = tidy({
  stage: 'firescene', title: '골목의 불', hint: '위쪽 3D 화면에서 직접 해요. 장비는 끌어서 초록 원에 놓고, 물이 나오면 불 위를 손가락으로 문질러요.',
  start: '상자 더미에 불이 붙었어요. 구경하는 분들이 가까이 서 있어요. 무엇부터 할까요?',
  items: [
    { id: 'line', label: '안전선을 세워 사람들을 물러서게 하기', kind: 'move', done: '안전선을 세웠어요. 사람들이 뒤로 물러섰어요. 이제 호스를 끌어와요.' },
    { id: 'hose', label: '소방차에서 호스 끌어오기', kind: 'move', done: '호스를 폈어요. 불 위를 문질러 물줄기를 보내요.' },
    { id: 'flame', label: '물줄기로 불 끄기', kind: 'rub', done: '불꽃이 사라졌어요. 그런데 연기가 아직 가늘게 나요.' },
    { id: 'debris', label: '탄 상자를 옆으로 걷어 내기', kind: 'move', done: '탄 상자를 걷어 내니 속에 빨간 불씨가 남아 있어요.' },
    { id: 'ember', label: '속에 남은 불씨까지 끄기', kind: 'rub', done: '속의 불씨까지 껐어요. 연기가 멎었어요.' },
  ],
  order: ['line', 'hose', 'flame', 'debris', 'ember'],
  early: {
    hose: '잠깐! 구경하는 분들이 너무 가까워요. 안전선부터 세워요.',
    flame: '아직 물이 없어요. 안전선을 세우고 호스를 끌어와요.',
    debris: '아직 불꽃이 있어요. 불부터 끄고 걷어 내요.',
    ember: '불씨가 탄 상자 밑에 가려져 있어요. 상자를 먼저 걷어 내요.',
  },
  good: 'out', bad: 'redo',
});

// ── 간호사 (7층 병동) ──
export const idcheck = tidy({
  stage: 'idcheck', title: '손 위생과 환자 확인', hint: '위쪽 3D 화면에서 직접 해요. 손은 손가락으로 문질러 소독하고, 차트는 끌어서 팔찌 옆 초록 원에 대요.',
  start: '702호 문 앞이에요. 다온 님 곁에 가기 전에 무엇부터 할까요?',
  items: [
    { id: 'rub', label: '문 앞 손 소독제로 손을 구석구석 문지르기', kind: 'rub', done: '손을 구석구석 문질러 소독했어요. 이제 차트를 들고 팔찌와 견줘요.' },
    { id: 'chart', label: '팔찌와 이름·생년월일이 모두 같은 차트 대어 보기', kind: 'move', done: '이름도, 생년월일도 같아요. “네, 박다온이에요.”' },
  ],
  order: ['rub', 'chart'],
  early: { chart: '잠깐! 환자분 곁에 가기 전에, 문 앞에서 손부터 소독해요.' },
  wrong: { chartB: { as: 'chart', msg: '이름은 같지만 생년월일이 달라요. 같은 이름의 환자분이 계실 수 있어서, 이름과 생년월일을 둘 다 견줘요.' } },
  finish: '손도, 이름도 확인했어요. 이제 다온 님 곁으로 가요.',
  good: 'sure', bad: 'redo',
});

export const bedside = tidy({
  stage: 'bedside', title: '침대 곁 살피기', hint: '위쪽 3D 화면에서 직접 해요. 베개, 호출 벨, 난간을 끌어서 초록 원에 놓아요.',
  start: '윤호 님 침대 곁을 살펴요. 무엇부터 할까요?',
  items: [
    { id: 'pillow', label: '내려간 베개를 머리 쪽으로 올려 드리기', kind: 'move', done: '베개를 올려 드렸어요. 윤호 님이 편하게 머리를 기대요.' },
    { id: 'bell', label: '떨어진 호출 벨을 손 닿는 곳에 두기', kind: 'move', done: '벨을 왼손 곁에 두었어요. 한번 눌러 보시더니 고개를 끄덕여요.' },
    { id: 'rail', label: '나가기 전에 침대 난간 올리기', kind: 'move', done: '난간을 올렸어요. “이제 편해요. 벨도 손에 닿네요.”' },
  ],
  order: ['pillow', 'bell', 'rail'],
  early: { bell: '먼저 베개를 올려 자세를 편하게 해 드려요. 그다음에 손 닿는 곳을 찾아요.', rail: '난간은 자리를 다 살핀 뒤, 병실을 나서기 전에 올려요.' },
  miss: () => '오른팔은 붕대를 감아 쓰기 어려우세요. 쓸 수 있는 왼손 곁에 두어요.',
  finish: '모두 살폈어요. 윤호 님이 편하게 누워 벨을 손에 쥐어요.',
  good: 'safe', bad: 'redo',
});

const VITAL = { temp: ['36.8 ℃', '체온'], pulse: ['78 회/분', '맥박'], bp: ['118/76 mmHg', '혈압'] };
export const vitals = tidy({
  stage: 'vitals', title: '모니터 값 옮겨 적기', hint: '위쪽 3D 화면에서 직접 해요. 숫자 카드를 끌어 기록지의 알맞은 칸에 놓아요.',
  start: '모니터를 읽어요. 왼쪽의 숫자 카드를 기록지의 알맞은 칸으로 옮겨요.',
  items: [
    { id: 'temp', label: '체온 칸에 36.8 ℃', kind: 'move' },
    { id: 'pulse', label: '맥박 칸에 78 회/분', kind: 'move' },
    { id: 'bp', label: '혈압 칸에 118/76 mmHg', kind: 'move' },
  ],
  miss: (id, slot) => `앗, ${VITAL[id][0]}는 ${VITAL[id][1]} 값이에요. 그 칸은 ${VITAL[slot][1]} 칸이에요. 단위를 보고 다시 놓아요.`,
  finish: '세 값을 모두 옮겨 적었어요. 모니터에 기록함 표시가 떴어요.',
  good: 'noted', bad: 'redo',
});
