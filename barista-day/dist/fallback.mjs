import {Shift} from './shift.mjs';
import {clockLabel,renderWorkdayEnd} from './career.mjs?v=career15';
const state=new Shift();state.accessibleMode=true;
const tasks=document.getElementById('tasks'),status=document.getElementById('status');
let amount=1,water=false;
function button(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{fn();render()};tasks.append(b)}
function act(id){const result=state.act(id);status.textContent=result.msg;return result}
function rub(label,onMove){const area=document.createElement('div');area.id='rub';area.textContent=label+' · 손가락으로 좌우로 문질러요';let last=null;area.onpointerdown=e=>{area.setPointerCapture(e.pointerId);last={x:e.clientX,y:e.clientY}};area.onpointermove=e=>{if(!last)return;const d=Math.hypot(e.clientX-last.x,e.clientY-last.y);last={x:e.clientX,y:e.clientY};if(onMove(d))render()};area.onpointerup=area.onpointercancel=()=>last=null;tasks.append(area)}
const scrub=new Map();
function render(){
 tasks.replaceChildren();document.getElementById('clock').textContent=clockLabel(state);
 if(state.phase==='end'){renderWorkdayEnd(document.getElementById('sheet'),state);return}
 const [id,label]=state.objective();
 if(state.tables.includes('occupied')){button('손님이 한 모금 마시기',()=>{const i=state.tables.indexOf('occupied');status.textContent=state.records[i].reaction;state.leaveTable(i)});if(id==='customer'&&!state.order)return}
 if(id==='customer'&&state.order&&!state.payment.ready){const p=state.payment;
 if(!p.paid){if(p.method==='card')button('카드를 단말기에 대기',()=>{p.tap();state.completePayment()});else if(!p.received)button(`${p.tender.toLocaleString()}원 받기`,()=>p.receive());else{status.textContent=`주문 ${p.price}원 · 받은 돈 ${p.tender}원 · 고른 거스름돈 ${p.selected}원`;for(const n of [5000,1000,500,100])button(n+'원 고르기',()=>p.add(n));button('마지막 돈 빼기',()=>p.undo());button('거스름돈 건네기',()=>{if(!p.give())status.textContent='거스름돈을 다시 확인해주세요.';state.completePayment()})}}
 else if(p.printProgress<1)button('영수증 출력하기',()=>{for(let i=0;i<12;i++)p.print(.1)});else button('영수증 집어 건네기',()=>{p.handReceipt();status.textContent='손님: 영수증 잘 받았어요. 고맙습니다!'});return}
 if(id.startsWith('table')&&state.tables[Number(id.at(-1))]==='dirty'){let n=scrub.get(id)||0;rub(`테이블 얼룩 ${Math.round(n/4)}% 지움`,d=>{n=Math.min(400,n+d);scrub.set(id,n);if(n>=400){act(id);return true}status.textContent=`얼룩 ${Math.round(n/4)}% 지움`;return false});return}
 if(id==='sink'&&state.washCups.some(c=>!c.shelved)){
 const cup=state.washCups.find(c=>!c.shelved);
 if(cup.dry){button('건조대의 컵 집어 선반에 놓기',()=>{state.storeCup(cup);status.textContent='다음 커피에 다시 쓸 컵을 정리했어요.'});return}
 button(water?'수도 잠그기':'수도 틀기',()=>water=!water);
 if(cup.progress<1){let n=scrub.get(cup)||0;rub(water?'물 흐르는 컵':'수도를 먼저 틀어주세요',d=>{if(!water)return false;n=Math.min(400,n+d);scrub.set(cup,n);status.textContent=`커피 자국 ${Math.round(n/4)}% 지움`;if(n>=400){for(let z=-.35;z<=.4;z+=.1)cup.rub({x:-.4,z},{x:.4,z},true);return true}return false})}
 else if(!cup.rinsed)button('흐르는 물에 컵 헹구기',()=>{if(!water){status.textContent='수도를 먼저 틀어주세요.';return}for(let i=0;i<16;i++)cup.rinse(.1,true,true);status.textContent='컵을 헹궜어요.'});else button('컵을 건조대에 놓기',()=>cup.rack());return}
 if(id==='water'||id==='steam'){const input=document.createElement('input');input.type='range';input.min='.15';input.max='1.55';input.step='.05';input.value=amount;input.setAttribute('aria-label','붓는 양');input.oninput=()=>{amount=Number(input.value);status.textContent=`붓는 양 ${Math.round(amount*100)}%`};tasks.append(input);button('이 양으로 완성하기',()=>{status.textContent=state.finishDrink(amount).msg;amount=1});return}
 button(label,()=>act(id));
}
render();
