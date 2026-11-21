// 임상병리사(2층 진단검사의학과)와 방사선사(지하 1층 영상의학과)의 3D 가까이 보기 손 장면. 틀은 tidy.js, 무대는 src/world/closeups-hosp-b.js.
// 모두 실제 일을 아주 단순하게 줄인 체험이다. 장면의 '알아 두기'에 그렇게 밝힌다. 바늘과 피는 그리지 않는다.
import { tidy } from './tidy.js';

// tidy 에 "이것들을 마쳐야 할 수 있다(needs)"를 더한다. 순서가 정해지지 않은 일(튜브 둘은 어느 쪽부터 넣어도 된다)이 있을 때 쓴다.
// 먼저 하려 하면 실수로 세고(서두름), 까닭은 miss(id, '_early:<모자란 일>') 로 한 줄 알려 준다. 문지르는 일은 모자란 까닭마다 한 번만 세고, 그 뒤로는 안내만 한다.
// 3D가 없는 기기에서는 fallbackOrder 의 차례대로 누른다.
function needs(def) {
  const plain = tidy({ ...def, order: def.fallbackOrder });
  const free = tidy({ ...def, order: undefined });
  return (el, sc, ctx) => {
    if (!ctx.world) return plain(el, sc, ctx);
    const done = new Set(), struck = new Set();
    const lack = (id) => (def.needs[id] || []).find((x) => !done.has(x));
    const world = {
      closeup(stage, on) {
        return ctx.world.closeup(stage, {
          ...on,
          canRub(id) {
            const k = lack(id);
            if (k) { if (!struck.has(`${id}:${k}`)) { struck.add(`${id}:${k}`); on.onMiss(id, `_early:${k}`); } return false; }
            return on.canRub(id);
          },
          onRub(id, v) { if (v >= 1) done.add(id); on.onRub(id, v); },
          onDrop(id) {
            const k = lack(id); if (k) { on.onMiss(id, `_early:${k}`); return false; }
            const r = on.onDrop(id); if (r !== false) done.add(id); return r;
          },
        });
      },
    };
    return free(el, sc, { ...ctx, world });
  };
}

// ── 임상병리사 ──
const TUBE = { purple: '보라색 뚜껑은 혈구 검사용이에요', blue: '하늘색 뚜껑은 응고 검사용이에요' };
const OTHER_BIRTH = '이 라벨은 생년월일이 달라요(1987.06.02). 오늘 같은 이름의 다른 환자분이 계세요. 이름과 생년월일을 둘 다 견줘요.';
export const drawlabel = tidy({
  stage: 'drawlabel', title: '본인 확인과 라벨', hint: '위쪽 3D 화면에서 직접 해요. 라벨을 끌어서 알맞은 튜브 위 초록 원에 놓고, 솜은 손가락으로 꾹 문질러요.',
  start: '새봄 님이 말한 이름·생년월일과 라벨을 견줘요. 오늘 검사는 생화학(칼륨)이에요.',
  items: [
    { id: 'label', label: '이름·생년월일이 맞는 라벨을 생화학 튜브에', kind: 'move', done: '이름도, 생년월일도, 튜브도 맞아요. 채혈은 화면 밖에서 마쳤어요. 이제 솜으로 눌러 드려요.' },
    { id: 'press', label: '채혈한 자리를 솜으로 꾹 눌러 드리기', kind: 'rub', done: '솜으로 꾹 눌러 드렸어요. “벌써 끝났어요?”' },
  ],
  order: ['label', 'press'],
  early: { press: '먼저 라벨부터 붙여요. 누구의 튜브인지 정한 뒤에 채혈해요.' },
  wrong: { labelB: { as: 'label', msg: OTHER_BIRTH } },
  miss: (id, slot) => (id === 'labelB' ? OTHER_BIRTH : `${TUBE[slot]}. 이 라벨의 검사는 생화학(칼륨)이라 노란색 뚜껑 튜브에 붙여요.`),
  finish: '사람도, 튜브도 확인했어요. 튜브는 검체 처리실로 가요.',
  good: 'sure', bad: 'recheck',
});

const SPIN = {
  empty: '그 칸의 맞은편이 비어 있어요. 원심분리기는 아주 빨리 돌아서, 맞은편에 같은 무게가 없으면 한쪽으로 쏠려요.',
  full: '맞은편 튜브는 3 mL예요. 5 mL 튜브는 5 mL 튜브 맞은편에 넣어야 무게가 맞아요.',
  half: '맞은편 튜브는 5 mL예요. 3 mL 튜브는 3 mL 튜브 맞은편에 넣어야 무게가 맞아요.',
  lid: '잠깐! 아직 맞은편이 빈 튜브가 있어요. 한쪽으로 쏠린 채 돌리면 기계가 흔들리고 튜브가 깨질 수 있어요. 튜브를 다 넣은 뒤에 닫아요.',
};
export const centrifuge = needs({
  stage: 'centrifuge', title: '원심분리기 균형 맞추기', hint: '위쪽 3D 화면에서 직접 해요. 튜브를 끌어서 원심분리기 칸의 초록 원에 놓고, 뚜껑도 끌어서 덮어요.',
  start: '동료가 넣어 둔 튜브는 5 mL 하나, 3 mL 하나예요. 같은 양끼리 마주 보게 넣어요.',
  items: [
    { id: 'full', label: '새봄 님 튜브(5 mL)를 5 mL 맞은편에', kind: 'move', done: '5 mL끼리 마주 봐요.' },
    { id: 'half', label: '응급실 튜브(3 mL)를 3 mL 맞은편에', kind: 'move', done: '3 mL끼리 마주 봐요.' },
    { id: 'lid', label: '뚜껑을 덮고 돌리기', kind: 'move', done: '뚜껑을 덮었어요. 윙— 흔들림 없이 고르게 돌아요.' },
  ],
  needs: { lid: ['full', 'half'] }, fallbackOrder: ['full', 'half', 'lid'],
  miss: (id, slot) => (slot.startsWith('_early') ? SPIN.lid : (id === 'full' && slot === 'h4') ? SPIN.full : (id === 'half' && slot === 'h3') ? SPIN.half : SPIN.empty),
  finish: '혈청이 위로, 혈구가 아래로 나뉘었어요. 이제 분석기에 올릴 수 있어요.',
  good: 'balanced', bad: 'redo',
});

export const analyzer = tidy({
  stage: 'analyzer', title: '분석기에 올리고, 값 살피기', hint: '위쪽 3D 화면에서 직접 해요. 꽂이와 결과표는 끌어서 초록 원에, 튜브는 손가락으로 문질러 불빛에 비춰 봐요.',
  start: '분리된 검체 꽂이를 분석기의 넣는 곳에 올려요.',
  items: [
    { id: 'rack', label: '검체 꽂이를 분석기에 올리기', kind: 'move', done: '결과가 떴어요. 새봄 님 칼륨 6.8, 빨간 표시예요. 먼저 검체를 살펴요.' },
    { id: 'look', label: '새봄 님 튜브를 불빛에 비춰 살피기', kind: 'rub', done: '맑은 노란색이에요. 피가 터진(용혈) 흔적이 없어요. 6.8은 믿을 수 있는 값이에요.' },
    { id: 'flag', label: '결과표를 ‘위급값 · 바로 전화’ 칸에', kind: 'move', done: '위급값으로 올렸어요. 바로 전화하러 가요.' },
  ],
  order: ['rack', 'look', 'flag'],
  early: {
    look: '먼저 검체 꽂이를 분석기에 올려요. 아직 결과가 없어요.',
    flag: '잠깐! 칼륨은 검체 속 피가 터지면(용혈) 실제보다 높게 나올 수 있어요. 먼저 새봄 님 튜브를 불빛에 비춰 살펴요.',
  },
  finish: '검체를 살피고 위급값으로 올렸어요. 바로 알려요.',
  good: 'checked', bad: 'rushed',
});

export const microscope = tidy({
  stage: 'microscope', title: '현미경으로 백혈구 찾기', hint: '위쪽 3D 화면에서 직접 해요. 유리판과 표시 핀은 끌어서 초록 원에, 흐린 곳은 손가락으로 문질러 초점을 맞춰요.',
  start: '선배가 물들인 혈액 유리판이에요. 현미경 위에 올려요.',
  items: [
    { id: 'slide', label: '유리판을 현미경 위에 올리기', kind: 'move', done: '유리판을 올렸어요. 아직 흐려요. 초점을 맞춰요.' },
    { id: 'focus', label: '흐린 곳을 문질러 초점 맞추기', kind: 'rub', done: '또렷해졌어요. 분홍 원반이 적혈구예요. 보라색 핵이 있는 세포를 찾아요.' },
    { id: 'wbc', label: '보라색 핵이 있는 백혈구에 핀 놓기', kind: 'move', done: '찾았어요. 보라색 핵이 있는 세포가 백혈구예요.' },
  ],
  order: ['slide', 'focus', 'wbc'],
  early: { focus: '먼저 유리판을 현미경 위에 올려요.', wbc: '아직 흐려서 세포가 잘 보이지 않아요. 초점부터 맞춰요.' },
  miss: () => '이건 적혈구예요. 핵이 없고 가운데가 옅은 원반 모양이에요. 보라색 핵이 있는 세포를 찾아요.',
  finish: '“찾았네요. 보라색 핵, 보이죠?” 선배가 고개를 끄덕여요.',
  good: 'found', bad: 'recheck',
});

// ── 방사선사 ──
export const positioning = tidy({
  stage: 'positioning', title: '손목 사진, 자리 잡기', hint: '위쪽 3D 화면에서 직접 해요. 판·모래주머니·글자는 끌어서 초록 원에, 손목 밖으로 퍼진 빛은 손가락으로 문질러 줄여요.',
  start: '로운 님 오른 손목을 찍어요. 무엇부터 할까요?',
  items: [
    { id: 'plate', label: '검출기 판을 손목 아래에 놓기', kind: 'move', done: '판을 손목 아래에 놓았어요. 이제 팔이 움직이지 않게 받쳐요.' },
    { id: 'bag', label: '모래주머니로 팔을 편하게 받치기', kind: 'move', done: '“이러니까 덜 아프네.” 팔이 편하게 놓였어요.' },
    { id: 'mark', label: '판 귀퉁이에 오른쪽 표시(R) 놓기', kind: 'move', done: '‘R’을 놓았어요. 사진에 오른손이라는 표시가 함께 찍혀요.' },
    { id: 'light', label: '손목 밖으로 퍼진 빛을 줄이기', kind: 'rub', done: '빛이 손목에만 비춰요. 몸의 다른 곳은 방사선을 받지 않아요.' },
  ],
  order: ['plate', 'bag', 'mark', 'light'],
  early: {
    bag: '판부터 손목 아래에 놓아요. 모래주머니를 먼저 얹으면 판을 넣을 때 아픈 팔을 다시 움직여야 해요.',
    mark: '먼저 판을 놓고 팔을 받쳐요. 글자는 판 귀퉁이에 놓아요.',
    light: '자리를 다 잡은 뒤에 빛을 맞춰요. 빛을 맞춘 뒤에 움직이면 다시 맞춰야 해요.',
  },
  wrong: { markL: { as: 'mark', msg: '로운 님이 다친 곳은 오른쪽 손목이에요. 오른쪽을 뜻하는 ‘R’을 놓아요.' } },
  finish: '판, 받침, 표시, 빛까지 맞췄어요. 이제 촬영실을 나가요.',
  good: 'steady', bad: 'redo',
});

const SHOOT = {
  me: '잠깐! 아직 내가 촬영실 안에 있어요. 납유리 창 뒤 조정실로 먼저 나와요. 거리와 가림막이 나를 지켜요.',
  door: '잠깐! 촬영실 문이 열려 있어요. 문을 닫아야 복도의 가람 님에게 방사선이 새어 나가지 않아요.',
};
export const expose = needs({
  stage: 'expose', title: '누르기 전에, 나와서 닫고', hint: '위쪽 3D 화면에서 직접 해요. 나와 문은 끌어서 초록 원에, 노출 스위치는 손가락으로 꾹 문질러요.',
  start: '자리를 다 잡았어요. 무엇부터 할까요?',
  items: [
    { id: 'me', label: '나는 조정실로 나오기', kind: 'move', done: '납유리 창 뒤 조정실로 나왔어요. 창 너머로 로운 님이 보여요.' },
    { id: 'door', label: '촬영실 문 닫기', kind: 'move', done: '문을 닫았어요. ‘촬영 중’ 등이 켜질 준비가 됐어요.' },
    { id: 'shoot', label: '“움직이지 마세요” 하고 노출 스위치 누르기', kind: 'rub', done: '“찰칵.” 촬영 중 등이 잠깐 켜졌다 꺼졌어요. 화면에 손목 사진이 떴어요.' },
  ],
  needs: { door: ['me'], shoot: ['me', 'door'] }, fallbackOrder: ['me', 'door', 'shoot'],
  early: { shoot: '나는 조정실로 나오고, 촬영실 문을 닫은 뒤에 눌러요.', door: '먼저 조정실로 나와요.' },
  miss: (id, slot) => (slot === '_early:me' ? (id === 'door' ? '문을 먼저 닫으면 내가 촬영실 안에 남아요. 조정실로 먼저 나와요.' : SHOOT.me) : SHOOT.door),
  finish: '조정실에서, 문을 닫고 찍었어요. 로운 님 말고는 아무도 방사선을 받지 않았어요.',
  good: 'safe', bad: 'rushed',
});

const PIC = {
  wrist: ['로운 님 손목 사진은 선명하고 손목뼈가 다 들어 있어요. 다시 찍으면 방사선을 한 번 더 받아요. 판독으로 보내요.', '판독으로 보냈어요.'],
  chest: ['이 가슴 사진은 숨을 쉬는 사이 움직여 흐려요. 이대로는 읽기 어려워서 다시 찍어요.', '흐린 가슴 사진은 다시 찍기로 했어요.'],
  ankle: ['이 발목 사진은 아래쪽 뼈가 사진 밖으로 잘렸어요. 다시 찍어요.', '잘린 발목 사진은 다시 찍기로 했어요.'],
};
export const imagecheck = tidy({
  stage: 'imagecheck', title: '보낼까, 다시 찍을까', hint: '위쪽 3D 화면에서 직접 해요. 사진을 끌어서, 그 사진 아래 ‘보내기’나 ‘다시 찍기’ 칸의 초록 원에 놓아요.',
  start: '사진 세 장이에요. 흐리거나 잘린 사진만 다시 찍어요.',
  items: Object.entries(PIC).map(([id, [, done]]) => ({ id, label: { wrist: '로운 님 손목 사진', chest: '병동 가슴 사진', ankle: '응급실 발목 사진' }[id], kind: 'move', done })),
  miss: (id, slot) => (slot[0] === id[0] ? PIC[id][0] : '그 칸은 다른 사진의 칸이에요. 사진 바로 아래 칸 둘 가운데에서 골라요.'),
  finish: '한 장은 판독으로, 두 장은 다시 찍기로. 꼭 필요한 사진만 다시 찍어요.',
  good: 'sure', bad: 'recheck',
});
