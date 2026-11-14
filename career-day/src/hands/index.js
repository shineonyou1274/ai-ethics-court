// 손으로 하는 장면 목록. 장면의 game 값이 여기 이름 중 하나여야 한다 (test/sim.mjs 가 확인).
// 각 놀이는 (붙일 곳, 장면, { sfx, act, done }) 을 받아 화면을 그리고, 끝나면 done(등급, 자세한 값) 을 한 번 부른다.
// 모듈을 불러오기만 할 때는 화면(document)을 건드리지 않는다.
import { scrub } from './scrub.js';
import { band } from './band.js';
import { gown } from './gown.js';
import { suture } from './suture.js';
import { mop } from './mop.js';
import { bedmake } from './bedmake.js';

// mop · bedmake 는 3D 가까이 보기(src/world/closeup.js)에서 직접 닦고 옮긴다. 장면에 closeup: true 를 적는다.
export const HANDS = { scrub, band, gown, suture, mop, bedmake };
