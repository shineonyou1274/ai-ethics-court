import {Surface} from './day.mjs';
export class Hands{
 constructor(canvas,status,onDone,onMistake){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.status=status;this.onDone=onDone;this.onMistake=onMistake;this.active=false;this.pointer=null;
 canvas.addEventListener('pointerdown',e=>this.down(e));canvas.addEventListener('pointermove',e=>this.move(e));canvas.addEventListener('pointerup',e=>this.up(e));canvas.addEventListener('pointercancel',()=>this.cancel());window.addEventListener('blur',()=>this.cancel());this.observer=new ResizeObserver(()=>this.draw());this.observer.observe(canvas);}
 open(step,saved){this.step=step;this.data=saved||{placed:[],hits:[0,0,0],surface:new Surface()};this.active=true;this.pointer=null;this.drag=null;this.draw();return this.data}
 close(){this.active=false;this.cancel()}
 point(e){const r=this.canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
 down(e){if(!this.active||this.pointer!==null)return;e.preventDefault();this.pointer=e.pointerId;this.canvas.setPointerCapture(e.pointerId);const p=this.point(e);this.last=p;
 if(this.step.kind==='drag'){const i=[0,1,2].find(i=>!this.data.placed.includes(i)&&Math.hypot(p.x-(.2+i*.3),p.y-.25)<.14);if(i!==undefined)this.drag={i,p}}
 if(this.step.kind==='tap'){const i=[0,1,2].find(i=>Math.hypot(p.x-(.2+i*.3),p.y-.48)<.15);if(i!==undefined){this.data.placed.push(i);this.data.placed=[...new Set(this.data.placed)];this.check()}}
 this.draw();}
 move(e){if(!this.active||this.pointer!==e.pointerId)return;const p=this.point(e),last=this.last;if(this.drag)this.drag.p=p;
 if(this.step.kind==='scrub')this.data.surface.rub(last,p);
 if(this.step.kind==='spray'&&last){const distance=Math.hypot(p.x-last.x,p.y-last.y);if(distance>.002)for(let i=0;i<3;i++)if(Math.hypot(p.x-(.2+i*.3),p.y-.4)<.14)this.data.hits[i]=Math.min(1,this.data.hits[i]+Math.min(.08,distance));}
 this.last=p;this.check();this.draw();}
 up(e){if(this.pointer!==e.pointerId)return;const p=this.point(e);if(this.drag){const slots=[0,1,2].filter(i=>!this.data.placed.includes(i));const slot=slots.find(i=>Math.hypot(p.x-(.2+i*.3),p.y-.73)<.15);if(slot===this.drag.i)this.data.placed.push(slot);else if(slot!==undefined)this.onMistake('slot'+this.drag.i,'이름표가 달라요. 제자리로 돌아왔어요. 다시 확인하며 3분이 밀렸어요.');}this.cancel();this.check();this.draw()}
 cancel(){this.pointer=null;this.drag=null;this.last=null;if(this.active)this.draw()}
 get progress(){return this.step.kind==='scrub'?this.data.surface.progress:this.step.kind==='spray'?this.data.hits.reduce((a,b)=>a+b,0)/3:this.data.placed.length/3}
 check(){if(this.progress>=.999&&this.active){this.active=false;this.onDone()}}
 draw(){if(!this.step)return;const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;this.canvas.width=Math.round(r.width*devicePixelRatio);this.canvas.height=Math.round(r.height*devicePixelRatio);const c=this.ctx;c.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);const w=r.width,h=r.height;c.clearRect(0,0,w,h);c.textAlign='center';c.textBaseline='middle';
 const text=(s,x,y,size=15)=>{c.fillStyle='#263c52';c.font=`${size}px "Jua",sans-serif`;c.fillText(s,x*w,y*h)};
 const circle=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x*w,y*h,r*Math.min(w,h),0,7);c.fill()};
 if(this.step.kind==='drag'){for(let i=0;i<3;i++){c.strokeStyle='#2f8f6c';c.lineWidth=3;c.setLineDash([6,5]);c.strokeRect((.08+i*.3)*w,.61*h,.24*w,.24*h);c.setLineDash([]);text(this.step.items[i],.2+i*.3,.9,12);if(this.data.placed.includes(i)){text('✓',.2+i*.3,.73,32);continue}const p=this.drag?.i===i?this.drag.p:{x:.2+i*.3,y:.25};circle(p.x,p.y,.11,this.drag?.i===i?'#efbd71':'#e5d8c3');text(this.step.id==='gear'?['⛑','🧤','📻'][i]:'▲',p.x,p.y-.01,30);if(!this.drag||this.drag.i!==i)text(this.step.items[i],p.x,p.y+.16,12)}}
 if(this.step.kind==='tap'){for(let i=0;i<3;i++){circle(.2+i*.3,.48,.13,this.data.placed.includes(i)?'#c5e5d3':'#d4e0df');text(this.data.placed.includes(i)?'✓':['◉','▤','◔'][i],.2+i*.3,.46,32);text(this.step.items[i],.2+i*.3,.7,13)}}
 if(this.step.kind==='spray'){for(let i=0;i<3;i++){circle(.2+i*.3,.4,.12,this.data.hits[i]>=1?'#b8e1d3':'#e8b56f');text(Math.round(this.data.hits[i]*100)+'%',.2+i*.3,.4)}text('훈련용 표적 · 실제 화재가 아니에요',.5,.77,12);if(this.last){c.strokeStyle='#75c9df';c.lineWidth=9;c.beginPath();c.moveTo(.5*w,.98*h);c.lineTo(this.last.x*w,this.last.y*h);c.stroke();circle(this.last.x,this.last.y,.035,'#a2e3ed')}}
 if(this.step.kind==='scrub'){c.fillStyle='#ccd9d6';c.fillRect(.1*w,.17*h,.8*w,.65*h);text('장비 보관함',.5,.11,16);for(const p of this.data.surface.points)if(!p.clean)circle(p.x,p.y,.035,'#948671');if(this.last){c.fillStyle='#e6b651';c.fillRect(this.last.x*w-25,this.last.y*h-12,50,24)}}
 this.status.textContent=`${Math.round(this.progress*100)}% · ${this.progress>=.999?'마쳤어요':this.step.kind==='scrub'?'걸레로 문지르기':this.step.kind==='spray'?'누른 채 표적 안을 천천히 움직이기':this.step.kind==='drag'?'끌어 이름표에 놓기':'세 곳을 눌러 점검하기'}`;
 }
}
