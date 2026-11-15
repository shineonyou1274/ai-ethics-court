import assert from 'node:assert/strict';
import {openSendDialog} from '../dist/send-records.mjs';
import {decodeCodes} from '../dist/shared/collect.js';
const record=(app,id)=>({id,app,date:'2026-11-15',job:{id,name:app==='barista-day'?'바리스타':'간호사'},pay:{total:95840},ending:{name:'일을 마친 하루'},like:{label:'손님 응대',type:'S'},hard:{label:'정리',type:'C'},extra:{sales:13500}});
let raw=JSON.stringify([record('barista-day','a'),record('career-day','b')]),writes=0;
globalThis.localStorage={getItem:()=>raw,setItem(){writes++}};
function el(){return {value:'',hidden:false,textContent:'',children:new Map(),handlers:{},setAttribute(){},focus(){this.focused=true},select(){this.selected=true},querySelector(id){if(!this.children.has(id))this.children.set(id,el());return this.children.get(id)},addEventListener(type,fn){this.handlers[type]=fn},showModal(){this.open=true},close(){this.open=false;this.handlers.close()},replaceChildren(){this.children.clear()},remove(){this.removed=true}}}
globalThis.document={createElement:el,body:{append(){}}};
const d=openSendDialog(),get=id=>d.querySelector('#'+id);get('makeCode').onclick();assert.match(get('sendStatus').textContent,/먼저/);assert.equal(get('recordCode').value,'');
get('sendName').value='12번';get('makeCode').onclick();const code=get('recordCode').value,decoded=decodeCodes(code);assert.equal(decoded.errors.length,0);assert.equal(decoded.students[0].name,'12번');assert.deepEqual(decoded.students[0].records.map(r=>r.app),['barista-day','career-day']);assert.ok(!JSON.stringify(decoded).includes('13500'));assert.equal(writes,0);
Object.defineProperty(globalThis,'navigator',{value:{clipboard:{writeText:async()=>{throw Error('denied')}}},configurable:true});await get('copyCode').onclick();assert.equal(get('recordCode').selected,true);assert.match(get('sendStatus').textContent,/직접 복사/);
let copied='';navigator.clipboard.writeText=async s=>copied=s;await get('copyCode').onclick();assert.equal(copied,code);assert.match(get('sendStatus').textContent,/복사했어요/);
get('sendName').value='13번';get('sendName').oninput();assert.equal(get('recordCode').value,'');assert.equal(get('codeArea').hidden,true);get('closeSend').onclick();assert.equal(d.removed,true);assert.equal(d.children.size,0);assert.equal(openSendDialog().querySelector('#sendName').value,'');assert.equal(writes,0);
raw='[]';assert.match(openSendDialog().innerHTML,/아직 저장한 출근 기록이 없/);
console.log('PASS: required name, both apps exported, teacher decode, shop money excluded, copy success/fallback, name/code cleared and no storage writes.');
