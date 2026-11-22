import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {day,finish,annual} from '../dist/day.mjs';
import {checkRecord,salaryDay} from '../dist/shared/workday.js';
for(const file of ['workday.js','design.css','collect.js'])assert.deepEqual(readFileSync(new URL('../dist/shared/'+file,import.meta.url)),readFileSync(new URL('../../shared/'+file,import.meta.url)));
assert.deepEqual(day.filter(s=>s.hand).map(s=>s.hand),['carry','brush','fit','case']);
for(const first of [true,false])for(const stay of [true,false])for(const rest of [30,60]){
 const r=finish({first,stay,rest,delay:12,session:'test',like:1,hard:3});
 assert.deepEqual(checkRecord(r),[]);assert.equal(r.pay.total,salaryDay(annual,540-rest+(stay?12:0)).total);
 assert.equal(r.shift.end,stay?'18:12':'18:00');assert.equal(r.extra.firstVisitor,first);
}
console.log('공통 원본 · 네 작업 · 급여와 결말 8경로 통과');
