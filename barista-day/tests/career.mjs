import assert from 'node:assert/strict';
import {Shift} from '../dist/shift.mjs';
import {MOMENTS,workClock,recordFor,renderWorkdayEnd,endingFor,chooseDeparture,departureInfo} from '../dist/career.mjs';
import {checkRecord,loadRecords,walletTotal,saveRecordSafe,careernetUrl} from '../dist/shared/workday.js';
const s=new Shift();assert.throws(()=>recordFor(s,MOMENTS[0],MOMENTS[1]));
assert.equal(workClock(s).end,'08:30');s.phase='end';s.sales=13500;s.cost=2150;s.tips=600;
const r=recordFor(s,MOMENTS[3],MOMENTS[5]);assert.deepEqual(checkRecord(r),[]);assert.equal(r.pay.total,95840);assert.equal(r.shift.end,'17:30');assert.ok(new Set(MOMENTS.map(m=>m.type)).size>=4);assert.ok(r.id);
for(const wasted of [1,8,9])for(const choice of ['stay','handover']){
 const late=new Shift();late.phase='end';late.wasted=wasted;assert.equal(workClock(late).end,'17:30');assert.throws(()=>recordFor(late,MOMENTS[0],MOMENTS[1]));assert.equal(chooseDeparture(late,'bad'),false);assert.equal(chooseDeparture(late,choice),true);assert.equal(chooseDeparture(late,choice),false);
 const record=recordFor(late,MOMENTS[0],MOMENTS[1]);assert.deepEqual(checkRecord(record),[]);
 const over=choice==='stay'?Math.min(120,wasted*15):0;assert.equal(record.pay.overMin,over);assert.equal(record.extra.handedOverMin,wasted*15-over);assert.equal(record.extra.energy,100-Math.ceil(over/15)*4);
 if(!over){assert.equal(record.pay.total,95840);assert.equal(record.shift.end,'17:30')}else if(wasted===1){assert.equal(record.pay.total,100330);assert.equal(record.shift.end,'17:45')}else assert.equal(record.shift.end,'19:30');
}
assert.equal(chooseDeparture(s,'stay'),false);
s.records=[{match:true},{match:true},{match:true}];assert.match(endingFor(s).name,/모든/);s.records[1].match=false;assert.match(endingFor(s).name,/서로 다른/);s.records=[];assert.match(endingFor(s).name,/다음 한 잔/);
let raw=null;globalThis.localStorage={getItem:()=>raw,setItem:(_,v)=>raw=v};
const els=new Map();const container={hidden:true,innerHTML:'',querySelector(sel){if(!els.has(sel))els.set(sel,{value:'',disabled:false,textContent:'',setAttribute(k,v){this[k]=v}});return els.get(sel)}};
renderWorkdayEnd(container,s);assert.ok(container.innerHTML.includes(careernetUrl('180')));assert.ok(!container.innerHTML.includes('<select'));const save=els.get('#saveDay');els.get('#like-0').onclick();els.get('#hard-0').onclick();assert.equal(save.disabled,true);els.get('#hard-1').onclick();assert.equal(save.disabled,false);assert.equal(els.get('#hard-1')['aria-pressed'],'true');
globalThis.localStorage.setItem=()=>{throw Error('blocked')};save.onclick();assert.match(els.get('#recordStatus').textContent,/저장하지 못/);assert.equal(save.disabled,false);
// Write succeeds but verification fails once; retry must retain the same record id.
let failRead=false;globalThis.localStorage.setItem=(_,v)=>{raw=v;failRead=true};globalThis.localStorage.getItem=()=>{if(failRead){failRead=false;throw Error('transient')}return raw};save.onclick();assert.equal(save.disabled,false);const firstId=JSON.parse(raw)[0].id;
globalThis.localStorage.setItem=(_,v)=>raw=v;save.onclick();save.onclick();assert.equal(loadRecords().length,1);assert.equal(loadRecords()[0].id,firstId);assert.equal(walletTotal(),95840);assert.equal(saveRecordSafe(loadRecords()[0]).duplicate,true);renderWorkdayEnd(container,s);assert.equal(save.disabled,true);assert.equal(loadRecords().length,1);
const late=new Shift();late.phase='end';late.wasted=1;renderWorkdayEnd(container,late);assert.match(container.innerHTML,/남아서 마치기/);assert.ok(!container.innerHTML.includes('id="saveDay"'));els.get('#handOver').onclick();assert.equal(departureInfo(late).handedOverMin,15);assert.match(container.innerHTML,/95,840원/);
console.log('PASS: departure branches/cap/energy, varied endings, source link/cards, safe save failure/retry with stable ID and no duplicate.');
