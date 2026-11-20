import {taskView} from './task-world.mjs';
import {PARTS} from './task-data.mjs';
export function mountDrawing({stage,panel,day,flat,onChange,onComplete,onExit,checkSession}){
 const surface=document.createElement('div');surface.className='space-surface task-surface';stage.append(surface);document.body.classList.add('space-session');document.body.dataset.spacePhase='drawing';
 let canvas=document.createElement('canvas');canvas.setAttribute('aria-label','도면의 도킹 링과 여섯 부품');surface.append(canvas);let view=taskView(canvas,{flat});
 if(!view){canvas.replaceWith(canvas=document.createElement('canvas'));surface.append(canvas);view=taskView(canvas,{flat:true})}
 panel.innerHTML='<div class="space-heading">09:30 · 도면 책상 · 지상 시험</div><h2>접속 통로를 막는 곳 세 군데를 찾아요.</h2><p>회색 링 안으로 길게 들어온 부품을 눌러요. 번호는 부품 이름과 같아요.</p><p id="drawingHint" role="status">도면과 모형을 함께 살펴요.</p><p id="drawingProgress"></p><details><summary>부품 이름</summary><ol>'+PARTS.map(p=>'<li>'+p.name+'</li>').join('')+'</ol></details><div class="space-actions"><button class="wd-btn" id="drawingDone">수정 요청을 제작팀에 전달</button><button id="returnHall">← 시험동으로</button></div>';
 const targets=PARTS.map((part,i)=>{const b=document.createElement('button');b.className='space-target drawing-target';b.dataset.part=i;b.textContent=i+1;b.setAttribute('aria-label',`${i+1}번 ${part.name} 점검`);b.onclick=()=>{if(!checkSession())return;const r=day.inspectDrawing(i);document.getElementById('drawingHint').textContent=r.note;onChange();refresh()};surface.append(b);return b});
 function refresh(){view.draw(day.drawingFound);targets.forEach((b,i)=>{const p=view.point(i);b.style.left=p.x+'px';b.style.top=p.y+'px';b.setAttribute('aria-pressed',String(day.drawingFound.has(i)))});document.getElementById('drawingProgress').textContent=`간섭 ${day.drawingFound.size}/3 확인 · 재확인 ${day.drawingDelay}분 · 현재 ${day.delay}분 밀림`;document.getElementById('drawingDone').disabled=day.drawingFound.size!==3}
 document.getElementById('drawingDone').onclick=()=>{if(checkSession()&&day.drawingFound.size===3)onComplete()};document.getElementById('returnHall').onclick=onExit;
 const observer=new ResizeObserver(()=>{view.resize();refresh()});observer.observe(surface);refresh();
 return{dispose(){observer.disconnect();view.dispose();surface.remove();document.body.classList.remove('space-session');delete document.body.dataset.spacePhase}};
}
