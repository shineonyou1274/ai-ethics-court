// Place readable labels in empty screen space, with a line back to each workbench.
export function layoutLabels(container,list,obstacles,active,onTravel){
 const width=container.clientWidth,height=container.clientHeight;if(!width||!height)return;
 if(container.dataset.active!==active||container.children.length!==list.length){container.replaceChildren();container.dataset.active=active;for(const s of list){const b=document.createElement('button');b.className='station-pin'+(s.id===active?' current':'');b.dataset.station=s.id;b.textContent=s.name;if(s.id===active){const call=document.createElement('span');call.className='station-call';call.textContent='무전 도착';b.append(call)}b.onclick=()=>onTravel(s.id);container.append(b)}}
 const occupied=[...obstacles,{x:0,y:height-38,w:140,h:38}];
 const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 for(const s of list){const b=container.querySelector(`[data-station="${s.id}"]`),w=b.offsetWidth,h=b.offsetHeight;const target={x:s.x-w/2,y:s.y-h-16};let best=null;
  for(let y=6;y<=height-h-6;y+=8)for(let x=6;x<=width-w-6;x+=8){const r={x,y,w,h},collision=occupied.reduce((sum,o)=>sum+overlap(r,o),0),score=collision*10000+Math.hypot(x-target.x,y-target.y);if(!best||score<best.score)best={...r,score}}
  if(!best)best={x:6,y:6,w,h};b.style.left=best.x+'px';b.style.top=best.y+'px';const cx=best.x+w/2,cy=best.y+h;const dx=s.x-cx,dy=s.y-cy;b.style.setProperty('--lead-length',Math.hypot(dx,dy)+'px');b.style.setProperty('--lead-angle',Math.atan2(dy,dx)+'rad');occupied.push({x:best.x-3,y:best.y-3,w:w+6,h:h+6});
 }
}
