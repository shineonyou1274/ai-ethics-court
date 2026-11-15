import assert from 'node:assert/strict';
const elements=new Map();function element(){return {children:[],textContent:'',value:'',hidden:false,append(e){this.children.push(e)},replaceChildren(){this.children=[]},setAttribute(k,v){this[k]=v},setPointerCapture(){},querySelector(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)}}}
globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element};
await import('../dist/fallback.mjs');const tasks=elements.get('tasks');let cashOrder=0,selected=false;
for(let step=0;step<150;step++){
 if(elements.get('sheet')?.innerHTML?.includes('오늘의 일당'))break;
 const buttons=tasks.children.filter(e=>e.onclick),rub=tasks.children.find(e=>e.onpointerdown);
 const tap=buttons.find(e=>e.textContent==='수도 틀기');if(tap){tap.onclick();continue}
 if(rub){rub.onpointerdown({pointerId:1,clientX:0,clientY:0});for(let i=1;i<=4;i++)rub.onpointermove({clientX:i*120,clientY:0});continue}
 let b=buttons.find(e=>e.textContent==='손님이 한 모금 마시기');
 if(!b&&buttons.some(e=>e.textContent==='수도 틀기'))b=buttons.find(e=>e.textContent==='수도 틀기');
 if(!b&&buttons.some(e=>e.textContent==='거스름돈 건네기')){
 if(!selected){cashOrder++;buttons.find(e=>e.textContent===(cashOrder===1?'1000원 고르기':'5000원 고르기')).onclick();if(cashOrder===2)tasks.children.find(e=>e.textContent==='500원 고르기').onclick();selected=true;continue}
 b=buttons.find(e=>e.textContent==='거스름돈 건네기');selected=false;
 }
 if(!b)b=buttons.find(e=>e.textContent!=='수도 잠그기');assert.ok(b,`step ${step}: actionable control`);b.onclick();
}
assert.match(elements.get('sheet').innerHTML,/95,840원/);assert.match(elements.get('sheet').innerHTML,/13,500원/);console.log('PASS: fallback controls complete three orders, cash/card/receipt, brewing, rubbing, washing, reuse and end screen.');
