import assert from 'node:assert/strict';
import {openSendDialog} from '../dist/send-records.mjs';
import {decodeCodes} from '../dist/shared/collect.js';
const record=(app,id)=>({id,session:'mine',app,date:'2026-11-15',job:{id,name:app==='aerospace-day'?'항공우주공학기술자':'간호사'},pay:{total:95840},ending:{name:'일을 마친 하루'},like:{label:'손님 응대',type:'S'},hard:{label:'정리',type:'C'},extra:{sales:13500}});
let raw=JSON.stringify([record('aerospace-day','a'),record('career-day','b'),{...record('aerospace-day','other'),session:'other'}]),writes=0,person='mine';
globalThis.localStorage={getItem:k=>k==='workday-session-v1'?JSON.stringify({id:person}):raw,setItem(){writes++}};
function el(){return {value:'',hidden:false,textContent:'',children:new Map(),handlers:{},setAttribute(){},focus(){this.focused=true},select(){this.selected=true},querySelector(id){if(!this.children.has(id))this.children.set(id,el());return this.children.get(id)},addEventListener(type,fn){this.handlers[type]=fn},showModal(){this.open=true},close(){this.open=false;this.handlers.close()},replaceChildren(){this.children.clear()},remove(){this.removed=true}}}
globalThis.document={createElement:el,body:{append(){}}};
const d=openSendDialog(),get=id=>d.querySelector('#'+id);get('makeCode').onclick();assert.match(get('sendStatus').textContent,/먼저/);assert.equal(get('recordCode').value,'');
get('sendName').value='12번';get('makeCode').onclick();const code=get('recordCode').value,decoded=decodeCodes(code);assert.equal(decoded.errors.length,0);assert.equal(decoded.students[0].name,'12번');assert.deepEqual(decoded.students[0].records.map(r=>r.app),['aerospace-day','career-day']);assert.ok(!JSON.stringify(decoded).includes('13500'));assert.equal(writes,0);
Object.defineProperty(globalThis,'navigator',{value:{clipboard:{writeText:async()=>{throw Error('denied')}}},configurable:true});await get('copyCode').onclick();assert.equal(get('recordCode').selected,true);assert.match(get('sendStatus').textContent,/직접 복사/);
let copied='';navigator.clipboard.writeText=async s=>copied=s;await get('copyCode').onclick();assert.equal(copied,code);assert.match(get('sendStatus').textContent,/복사했어요/);
get('sendName').value='13번';get('sendName').oninput();assert.equal(get('recordCode').value,'');assert.equal(get('codeArea').hidden,true);get('closeSend').onclick();assert.equal(d.removed,true);assert.equal(d.children.size,0);assert.equal(openSendDialog().querySelector('#sendName').value,'');assert.equal(writes,0);
raw='[]';assert.match(openSendDialog().innerHTML,/아직 저장한 출근 기록이 없/);
console.log('PASS: required name, only current person across both apps exported, teacher decode, shop money excluded, copy success/fallback, name/code cleared and no storage writes.');

raw=JSON.stringify([record('aerospace-day','a')]);const switched=openSendDialog(),at=id=>switched.querySelector('#'+id);at('sendName').value='테스트';at('makeCode').onclick();person='other';await at('copyCode').onclick();assert.equal(at('recordCode').value,'');assert.match(at('sendStatus').textContent,/바뀌었어요/);console.log('PASS: changing person invalidates an already-created export code.');

// Changing users before code generation must not export the prior person's list.
person='mine';const before=openSendDialog(),b=id=>before.querySelector('#'+id);b('sendName').value='새 사용자';person='other';b('makeCode').onclick();assert.equal(b('recordCode').value,'');assert.equal(b('codeArea').hidden,true);assert.match(b('sendStatus').textContent,/바뀌었어요/);
// A fresh dialog after switching contains only the new person's records.
raw=JSON.stringify([record('aerospace-day','old'),{...record('career-day','new'),session:'other'}]);const fresh=openSendDialog(),f=id=>fresh.querySelector('#'+id);f('sendName').value='새 사용자';f('makeCode').onclick();assert.deepEqual(decodeCodes(f('recordCode').value).students[0].records.map(r=>r.id),['new']);
console.log('PASS: session switch before generation is blocked; reopening exports only the new person.');
