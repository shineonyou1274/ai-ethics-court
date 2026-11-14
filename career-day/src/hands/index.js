// 손으로 하는 장면 목록. 장면의 game 값이 여기 이름 중 하나여야 한다 (test/sim.mjs 가 확인).
// 각 놀이는 (붙일 곳, 장면, { sfx, act, done }) 을 받아 화면을 그리고, 끝나면 done(등급, 자세한 값) 을 한 번 부른다.
// 모듈을 불러오기만 할 때는 화면(document)을 건드리지 않는다.
import { scrub } from './scrub.js';
import { band } from './band.js';
import { gown } from './gown.js';
import { suture } from './suture.js';

export const HANDS = { scrub, band, gown, suture };
