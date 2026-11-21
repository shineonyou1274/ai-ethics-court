// 환경미화 직원: 3D 로비에서 안내판을 끌어 세우고, 대걸레로 물기를 문질러 닦는다.
// 등급 — safe: 안내판을 먼저 세우고 닦음 / risky: 안내판 없이 닦기 시작함
import { checklist } from './closeup-ui.js';

export function mop(el, sc, { sfx, act, done, world }) {
  const ui = checklist(el, {
    title: '로비 바닥의 물기', hint: '위쪽 3D 화면에서 직접 해요. 물건은 끌어서 옮기고, 바닥은 손가락으로 문질러요.',
    items: [{ id: 'sign', label: '노란 안내판을 초록 원으로 끌어 세우기' }, { id: 'puddle', label: '대걸레로 물웅덩이 닦기' }, { id: 'trail', label: '사람들이 밟고 간 물자국 닦기' }],
  });
  let sign = false, risky = false, finished = false;
  const left = new Set(['sign', 'puddle', 'trail']);
  const check = (id) => {
    left.delete(id); ui.done(id);
    if (left.size || finished) return;
    finished = true; sfx('good'); act('work');
    ui.msg(risky ? '물기를 다 걷었어요. 다음에는 안내판부터 세워요.' : '안내판을 세우고 물기를 다 걷었어요. 이제 안전하게 지나갈 수 있어요.');
    done(risky ? 'risky' : 'safe', { risky });
  };
  const rubbed = (id, v) => {
    if (!sign && !risky) { risky = true; sfx('bad'); ui.msg('안내판 없이 닦기 시작했어요. 지나가던 분이 젖은 바닥에서 멈칫해요!', true); }
    ui.progress(id, v); if (v >= 1) { sfx('pop'); check(id); }
  };
  const dropped = (id) => { if (id === 'sign') { sign = true; sfx('pop'); act('work'); ui.msg(risky ? '늦었지만 안내판을 세웠어요.' : '안내판을 세웠어요. 이제 대걸레로 문질러 닦아요.'); check('sign'); } return true; };

  let handle = null;
  if (world) {
    handle = world.closeup('spill', { onRub: rubbed, onDrop: dropped });
    ui.msg('먼저 무엇부터 할까요? 노란 안내판은 끌어서 옮겨요.');
  } else {
    ui.msg('먼저 무엇부터 할지 골라 눌러요.');
    ui.fallback([
      { id: 'sign', label: '미끄럼 주의 안내판 세우기', run: () => dropped('sign') },
      { id: 'puddle', label: '대걸레로 물웅덩이 닦기', run: () => rubbed('puddle', 1) },
      { id: 'trail', label: '물자국 닦기', run: () => rubbed('trail', 1) },
    ]);
  }
  return () => handle?.end();
}
