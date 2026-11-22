import * as T from './vendor/three.module.min.js';
import {group,box,oval,ring,solid,vessel,cream,teal,clay,green} from './studio.mjs';
const inside=(p,o,r)=>Math.hypot(p.x-o.x,p.y-o.y)<r;
function glove(p,x,y,s=1){
 const g=group(p,x,y,1);g.scale.setScalar(s);oval(g,.32,.36,.1,0xfff1cc);
 for(let i=0;i<4;i++)oval(g,.075,.23,.08,0xfff1cc,-.22+i*.145,.32-Math.abs(1-i)*.04);
 oval(g,.12,.24,.1,0xfff1cc,-.31,.06).rotation.z=.6;box(g,.44,.18,.16,teal,0,-.33);return g;
}
function brush(p,x,y,metal){
 const g=group(p,x,y,1);const c=metal?0x85959b:0xb67d4d;
 box(g,.19,1.02,.15,c,0,.12);box(g,.44,.21,.21,0x927e60,0,-.4);
 for(let i=0;i<7;i++)oval(g,.052,.23,.08,metal?0x607479:0xe3b56e,(i-3)*.059,-.58);g.rotation.z=-.48;return g;
}
const labels={carry:'질그릇 밑을 받쳐 오른쪽 상자로 옮기세요.',brush:'왼쪽 도구에서 붓을 골라 흙 위를 천천히 문지르세요.',fit:'조각을 톡 눌러 돌리고, 끊긴 빗살이 이어지도록 받침에 끌어 놓으세요.',case:'왼쪽은 습도, 오른쪽은 조명이에요. 손잡이를 좌우로 밀어 초록 눈금에 맞추세요.'};
export function openHand(studio,type,{say,mistake,done}){
 studio.reset();const root=studio.root;
 box(root,13,7,.32,0xb29878,0,0,-1.45);box(root,9.45,4.95,.14,0x526e63,0,0,-1.18);
 box(root,9.04,4.55,.12,0xd0bfa1,0,0,-1.05);
 let down=()=>{},move=()=>{},up=()=>{},held=false,completed=false;
 const finish=message=>{if(completed)return;completed=true;say(message);done()};
 say(labels[type]);
 if(type==='carry'){
 const gloves=[glove(root,-3.6,.97,.8),glove(root,-3.07,.94,.8)];
 const jar=vessel(root,-1.05,.04,.15,1.04);jar.rotation.x=.15;
 const target={x:2.35,y:0};box(root,2.65,2.45,.32,0x956d46,target.x,0,-.63);box(root,2.4,2.18,.23,0xe4cfaa,target.x,0,-.42);ring(root,.95,.055,green,target.x,0,-.22);
 let ready=false,drag=false,offset;
 down=p=>{
 if(inside(p,{x:-3.3,y:1.04},.87)){ready=true;gloves.forEach((g,i)=>{jar.add(g);g.position.set(i?.57:-.57,-.79,.65);g.scale.setScalar(.57);g.rotation.z=i?-.64:.64});say('장갑을 꼈어요. 그릇 아래쪽을 받쳐 주세요.');return}
 if(!inside(p,jar.position,1.37))return;
 if(!ready)return mistake('맨손의 땀과 기름이 표면에 남아요. 먼저 장갑을 껴요.');
 if(p.y>jar.position.y-.27)return mistake(p.x>jar.position.x+.62?'손잡이에 무게가 실리면 떨어질 수 있어요.':'무게가 기울어요. 두 장갑 사이의 밑부분을 받쳐요.');
 drag=true;offset=p.clone().sub(jar.position);say('두 손으로 받쳤어요. 완충재 가운데로 옮겨요.')};
 move=p=>{if(drag)jar.position.set(p.x-offset.x,p.y-offset.y,.45)};
 up=()=>{if(!drag)return;drag=false;if(inside(jar.position,target,1.05)){jar.position.set(target.x,0,.25);finish('상자 안에 그릇이 안정적으로 놓였어요.')}else{jar.position.set(-1.05,.04,.15);mistake('완충재가 없는 곳이에요. 상자 안에 놓아 주세요.')}};
 }
 if(type==='brush'){
 const jar=vessel(root,.8,0,0,1.85);jar.rotation.x=.12;
 const soft=brush(root,-3.45,.82,false);brush(root,-3.45,-1.02,true);
 const dirt=[];for(const y of [-.42,.28,.82])for(const x of [-.85,-.25,.36]){const m=oval(root,.39,.34,.11,0x886647,.98+x,y,1.92);m.rotation.z=x;dirt.push(m)}
 let selected=false,active=false,last,lastTime,warned=false;
 down=p=>{if(p.x<-2){if(p.y<0){selected=false;return mistake('쇠솔은 표면을 긁어요. 부드러운 털이 있는 붓을 골라요.')}selected=true;say('부드러운 붓이에요. 흙이 얹힌 자리를 천천히 쓸어요.')}
 if(!selected){if(p.x>=-2)mistake('도구를 먼저 골라야 흙을 안전하게 털 수 있어요.');return}active=true;last=p.clone();lastTime=performance.now();warned=false};
 move=p=>{if(!active)return;const now=performance.now(),distance=p.distanceTo(last);soft.position.set(p.x+.24,p.y+.5,2.38);
 if(distance/Math.max(12,now-lastTime)>.029&&p.x>-1.3){if(!warned){mistake('너무 빨라 무늬까지 쓸릴 수 있어요. 힘을 빼고 천천히 움직여요.');warned=true}}
 else if(distance>.012){for(const m of dirt){if(m.visible&&inside(p,m.position,.54)){m.scale.multiplyScalar(.83);if(m.scale.x<.21)m.visible=false}}
 const left=dirt.filter(m=>m.visible).length;if(!left)finish('흙 아래에서 두 줄 사이의 빗살무늬가 드러났어요.');else say('무늬가 조금씩 드러나요 · 남은 흙 '+left+'곳')}
 last=p.clone();lastTime=now};up=()=>{active=false};
 }
 if(type==='fit'){
 // Three unequal rim fragments. Their edges and painted grooves retain the same orientation on the assembled lid.
 const centre={x:1.65,y:.12},radius=1.56,angles=[-.32,1.55,3.88,Math.PI*2-.32];
 const pieces=[];for(let i=0;i<3;i++){
 const a=angles[i],b=angles[i+1],mid=(a+b)/2,dx=.87*Math.cos(mid),dy=.87*Math.sin(mid);
 const shape=new T.Shape();shape.moveTo(-dx,-dy);shape.lineTo(radius*Math.cos(a)-dx,radius*Math.sin(a)-dy);
 for(let k=1;k<=28;k++){const t=a+(b-a)*k/28;shape.lineTo(radius*Math.cos(t)-dx,radius*Math.sin(t)-dy)}shape.closePath();
 const geo=new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false});
 const dest={x:centre.x+dx,y:centre.y+dy};solid(root,geo.clone(),0x978b70,dest.x,dest.y,-.61);
 ring(root,.29,.045,green,dest.x,dest.y,-.36);
 const home=[[-3.15,.92],[-1.5,-.78],[-3.51,-.98]][i],g=group(root,...home,.25);
 solid(g,geo,clay);const arc=solid(g,new T.TorusGeometry(1.18,.044,6,28,b-a),cream,-dx,-dy,.16);arc.rotation.z=a;
 for(let k=0;k<4;k++){const t=a+(b-a)*(k+.5)/4;box(g,.055,.24,.04,cream,Math.cos(t)*1.37-dx,Math.sin(t)*1.37-dy,.15).rotation.z=t-.98}
 g.rotation.z=(i===1?2:3)*Math.PI/2;pieces.push({g,home,dest,fixed:false})}
 let piece,start,off,travel;
 down=p=>{const hit=studio.hit(p,pieces.filter(q=>!q.fixed).map(q=>q.g));piece=pieces.find(q=>q.g===hit?.parent);if(!piece)return;start=p.clone();off=p.clone().sub(piece.g.position);travel=0;piece.g.position.z=.6};
 move=p=>{if(piece){travel=Math.max(travel,p.distanceTo(start));piece.g.position.set(p.x-off.x,p.y-off.y,.6)}};
 up=()=>{if(!piece)return;const q=piece;piece=null;
 if(travel<.13){q.g.rotation.z=(q.g.rotation.z+Math.PI/2)%(2*Math.PI);say('조각을 한 번 돌렸어요. 둥근 가장자리와 빗살을 살펴요.')}
 else if(inside(q.g.position,q.dest,.67)&&Math.abs(Math.sin(q.g.rotation.z/2))<.03){q.fixed=true;q.g.position.set(q.dest.x,q.dest.y,-.26);if(pieces.every(k=>k.fixed))finish('딸깍. 세 조각의 빗살이 한 바퀴 이어졌어요.');else say('딸깍. 가장자리 무늬가 이어졌어요.')}
 else{q.g.position.set(...q.home,.25);mistake('곡선과 빗살의 방향이 이어지지 않아요. 가장자리를 비교해요.')}};
 }
 if(type==='case'){
 const jar=vessel(root,-.73,.95,0,.84);jar.rotation.x=.17;
 const cloth=box(root,1.65,.83,.11,0x98516b,1.13,.98,0);for(let j=0;j<5;j++)box(cloth,.05,.80,.045,cream,(j-2)*.28,0,.09);
 box(root,4.5,.14,.8,teal,.15,.07,-.15);
 const knobs=[{x:-2,a:-1.5},{x:2,a:1.45}];let knob,start,angle;
 for(const k of knobs){
 const dial=solid(root,new T.CylinderGeometry(.68,.74,.2,36),teal,k.x,-1.21,0);dial.rotation.x=Math.PI/2;
 for(let j=-5;j<=5;j++){const a=j*.3;oval(root,.07,.07,.04,Math.abs(j)<=1?green:0x816e53,k.x+.93*Math.sin(a),-1.21+.93*Math.cos(a),.15)}
 k.pin=group(root,k.x,-1.21,.19);box(k.pin,.10,.49,.12,cream,0,.28)}
 const refresh=()=>{knobs.forEach(k=>k.pin.rotation.z=-k.a);cloth.material.color.set(0x98516b).lerp(new T.Color(0xe9c8ba),Math.max(0,knobs[1].a)/1.5)};
 refresh();down=p=>{knob=knobs.find(k=>inside(p,{x:k.x,y:-1.21},1.1));if(knob){start=p.x;angle=knob.a}};
 move=p=>{if(knob){knob.a=Math.max(-1.5,Math.min(1.5,angle+(p.x-start)*.95));refresh();say(knobs[1].a>.4?'빛이 강해 보자기 색이 옅게 보여요.':'눈금이 초록 점 사이에 오는지 살펴요.')}};
 up=()=>{if(!knob)return;knob=null;if(knobs.every(k=>Math.abs(k.a)<=.36))finish('두 눈금이 안정됐어요. 보자기 색과 질그릇의 무늬가 함께 보여요.');else say('맞춘 눈금은 그대로예요. 두 손잡이를 각각 조절해요.')};
 }
 const surface=studio.surface;let id=null;
 surface.onpointerdown=e=>{if(completed||held)return;held=true;id=e.pointerId;surface.setPointerCapture(id);down(studio.point(e));studio.draw()};
 surface.onpointermove=e=>{if(held&&id===e.pointerId&&!completed){move(studio.point(e));studio.draw()}};
 surface.onpointerup=surface.onpointercancel=e=>{if(!held||id!==e.pointerId)return;held=false;if(!completed)up();studio.draw()};
 studio.draw();
 return ()=>{surface.onpointerdown=surface.onpointermove=surface.onpointerup=surface.onpointercancel=null};
}
