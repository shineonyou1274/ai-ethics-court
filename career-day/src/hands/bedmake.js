// 간호사: 3D 병실에서 퇴원한 침대를 다음 환자를 위해 정리한다.
// 쓴 시트를 세탁함에 끌어 넣고 → 매트리스를 소독 티슈로 문질러 닦고 → 새 시트를 끌어 깐다.
// 등급 — ready: 순서대로 한 번에 / redo: 순서가 엇갈려 다시 함
import { checklist } from './closeup-ui.js';

export function bedmake(el, sc, { sfx, act, done, world }) {
  const ui = checklist(el, {
    title: '다음 환자를 위한 침대', hint: '위쪽 3D 화면에서 직접 해요. 시트는 끌어서 옮기고, 매트리스는 손가락으로 문질러요.',
    items: [{ id: 'used', label: '쓴 시트를 걷어 세탁함에 넣기' }, { id: 'mattress', label: '매트리스를 소독 티슈로 닦기' }, { id: 'fresh', label: '새 시트를 침대에 깔기' }],
  });
  let used = false, wiped = false, mistakes = 0, finished = false, warned = 0;
  const miss = (t) => { mistakes++; sfx('bad'); ui.msg(t, true); };

  const on = {
    canRub: () => used,
    onBlocked() { if (Date.now() - warned > 1500) { warned = Date.now(); ui.msg('쓴 시트가 덮여 있어요. 시트부터 걷어 세탁함에 넣어요.', true); } },
    onRub(id, v) { ui.progress('mattress', v); if (v >= 1 && !wiped) { wiped = true; sfx('pop'); act('work'); ui.done('mattress'); ui.msg('매트리스를 구석구석 닦았어요. 이제 새 시트를 깔아요.'); } },
    onDrop(id) {
      if (id === 'used') { used = true; sfx('pop'); act('work'); ui.done('used'); ui.msg('쓴 시트를 세탁함에 넣었어요. 매트리스의 얼룩을 문질러 닦아요.'); return true; }
      if (id === 'fresh') {
        if (!used) { miss('쓴 시트를 먼저 걷어야 새 시트를 깔 수 있어요.'); return false; }
        if (!wiped) { miss('잠깐! 소독을 다 마친 뒤에 깔아요. 그대로 깔면 새 시트가 더러워져요.'); return false; }
        ui.done('fresh'); finished = true; sfx('good'); act('work');
        ui.msg(mistakes ? '순서를 바로잡아 침대를 다 정리했어요.' : '쓴 시트 → 소독 → 새 시트, 순서대로 정리했어요.');
        done(mistakes ? 'redo' : 'ready', { mistakes });
        return true;
      }
      return true;
    },
  };

  let handle = null;
  if (world) { handle = world.closeup('bed', on); ui.msg('침대 위의 쓴 시트를 잡아 오른쪽 세탁함으로 끌어요.'); }
  else {
    ui.msg('해야 할 일을 순서대로 눌러요.');
    ui.fallback([
      { id: 'fresh', label: '새 시트 깔기', run: () => on.onDrop('fresh') },
      { id: 'used', label: '쓴 시트 걷어 세탁함에 넣기', run: () => on.onDrop('used') },
      { id: 'mattress', label: '매트리스 소독 티슈로 닦기', run: () => { if (!used) { on.onBlocked(); return false; } on.onRub('mattress', 1); } },
    ]);
  }
  return () => handle?.end();
}
