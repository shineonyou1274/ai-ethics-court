// 3D 가까이 보기에서 "닦고, 제자리에 놓기"를 하는 장면을 짧게 적는 틀.
// 임상병리사(튜브 꽂기), 방사선사(촬영대 준비), 물리치료사(기구 정리)가 함께 쓴다.
//
// def = {
//   stage: 'lab',                              // src/world/closeups.js 의 무대 이름
//   title, hint, start,                        // 아래 칸의 제목, 안내, 첫 한마디
//   items: [{ id, label, kind: 'rub' | 'move', done }],   // 할 일. done 은 마쳤을 때의 한마디
//   order: ['table', 'paper', 'pad'],          // (있으면) 이 순서를 지켜야 한다
//   early: { paper: '…' },                     // 순서보다 먼저 하려 할 때의 한마디
//   miss: (id, slotId) => '…',                 // 다른 칸에 놓았을 때의 한마디
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
      ui.msg(mistakes ? '다시 바로잡아 모두 마쳤어요.' : '모두 마쳤어요. 다음 사람이 바로 쓸 수 있어요.');
      done(mistakes ? def.bad : def.good, { mistakes });
    };
    const complete = (id) => { if (!left.has(id)) return; left.delete(id); ui.done(id); sfx('pop'); act('work'); if (item(id).done) ui.msg(item(id).done); finish(); };
    const early = (id, count) => {
      if (count) { mistakes++; sfx('bad'); }
      if (count || Date.now() - warned > 1500) { warned = Date.now(); ui.msg(def.early?.[id] || '먼저 해야 할 일이 있어요.', true); }
    };
    const on = {
      canRub: (id) => ready(id),
      onBlocked: (id) => early(id, false),
      onRub: (id, v) => { ui.progress(id, v); if (v >= 1) complete(id); },
      onDrop: (id) => { if (!ready(id)) { early(id, true); return false; } complete(id); return true; },
      onMiss: (id, slot) => { mistakes++; sfx('bad'); ui.msg(def.miss ? def.miss(id, slot) : '그 자리가 아니에요.', true); },
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
