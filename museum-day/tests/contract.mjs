import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {day,finish,annual} from '../dist/day.mjs';
import {checkRecord,salaryDay} from '../dist/shared/workday.js';
for(const file of ['workday.js','design.css','collect.js'])assert.deepEqual(readFileSync(new URL('../dist/shared/'+file,import.meta.url)),readFileSync(new URL('../../shared/'+file,import.meta.url)));
assert.deepEqual(day.filter(s=>s.hand).map(s=>s.hand),['carry','brush','fit','case']);
for(const first of [true,false])for(const stay of [true,false])for(const rest of [30,60]){
 const r=finish({first,stay,rest,delay:12,session:'test',like:1,hard:3});
 assert.deepEqual(checkRecord(r),[]);assert.equal(r.pay.total,salaryDay(annual,540-rest+(stay?12:0)).total);
 assert.equal(r.shift.end,'18:00');assert.equal(r.extra.actualEnd,stay?'18:12':'18:00');assert.equal(r.extra.firstVisitor,first);
}
console.log('공통 원본 · 네 작업 · 급여와 결말 8경로 통과');
const memory=new Map();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
 getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))
}});
const {startNewSession,loadMine,saveRecordSafe}=await import('../dist/shared/workday.js');
const {encodeRecords,decodeCodes}=await import('../dist/shared/collect.js');
const session=startNewSession().id;
const r=finish({first:true,stay:false,rest:60,delay:0,session,like:2,hard:3});
assert.ok(saveRecordSafe(r).ok);assert.ok(saveRecordSafe(r).duplicate);assert.equal(loadMine().length,1);
const decoded=decodeCodes(encodeRecords(loadMine(),'연습'));
assert.deepEqual(decoded.errors,[]);assert.equal(decoded.students[0].records[0].jobId,'curator');
assert.equal(decoded.students[0].records[0].pay,125600);
startNewSession();assert.equal(loadMine().length,0);
console.log('지갑 분리 · 중복 저장 방지 · 교사 코드 복원 통과');
