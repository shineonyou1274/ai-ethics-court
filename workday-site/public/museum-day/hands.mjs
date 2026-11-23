import * as T from './vendor/three.module.min.js';
import {group,box,oval,ring,solid,vessel,cream,teal,clay,green} from './studio.mjs';
const inside=(p,o,r)=>Math.hypot(p.x-o.x,p.y-o.y)<r;
function glove(p,x,y,s=1){
 const g=group(p,x,y,1);g.scale.setScalar(s);oval(g,.32,.36,.1,0x55aee5);
 for(let i=0;i<4;i++)oval(g,.075,.23,.08,0x55aee5,-.22+i*.145,.32-Math.abs(1-i)*.04);
 oval(g,.12,.24,.1,0x55aee5,-.31,.06).rotation.z=.6;box(g,.44,.18,.16,teal,0,-.33);return g;
}
function brush(p,x,y,metal){
 const g=group(p,x,y,1);const c=metal?0x85959b:0xb67d4d;
 box(g,metal?.33:.19,1.02,.15,c,0,.12);box(g,.44,.21,.21,0x927e60,0,-.4);
 if(metal){for(let i=0;i<10;i++)box(g,.022,.3,.04,0xcbd8dd,(i-4.5)*.047,-.59)}
 else{for(let i=0;i<9;i++)oval(g,.06,.26,.105,0xe7bc81,(i-4)*.052,-.58+Math.abs(i-4)*.027)}g.rotation.z=-.48;return g;
}
// The two sides of a break share the same wandering fracture through a domed lid.
function lidFragment(a,b,dx,dy,radius){
 const vertices=[],indices=[],rows=9,cols=24;
 const crack=(angle,r)=>angle+.065*Math.sin(r*17+angle*2)*Math.sin(Math.PI*r/radius);
 for(let layer=0;layer<2;layer++)for(let row=0;row<=rows;row++){
  const r=.012+(radius-.012)*row/rows;
  for(let col=0;col<=cols;col++){
   const t=crack(a,r)+(crack(b,r)-crack(a,r))*col/cols;
   vertices.push(r*Math.cos(t)-dx,r*Math.sin(t)-dy,.34*(1-(r/radius)**2)-layer*.17);
  }
 }
 const stride=cols+1,layerSize=(rows+1)*stride;
 const quad=(a,b,c,d)=>indices.push(a,b,d,b,c,d);
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const n=row*stride+col;quad(n,n+stride,n+stride+1,n+1);
  const k=n+layerSize;quad(k+1,k+stride+1,k+stride,k);
 }
 const wall=(n,k)=>quad(k,n,n+layerSize,k+layerSize);
 for(let row=0;row<rows;row++){wall(row*stride,(row+1)*stride);wall((row+1)*stride+cols,row*stride+cols)}
 for(let col=0;col<cols;col++){wall(rows*stride+col,rows*stride+col+1);wall(col+1,col)}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
const labels={carry:'질그릇 밑을 받쳐 오른쪽 상자로 옮기세요.',brush:'왼쪽 도구에서 붓을 골라 흙 위를 짧게 여러 번 쓸어요 · 0%.',fit:'금빛 점 조각부터 톡 눌러 돌리고, 끊긴 빗살이 이어지도록 받침에 끌어 놓으세요.',case:'왼쪽은 습도, 오른쪽은 조명이에요. 주황 경보등을 확인하고 손잡이를 둥글게 돌려요.'};
export function openHand(studio,type,{say,mistake,done}){
 studio.reset();studio.bench();const root=studio.root;
 box(root,60,40,.32,0xb29878,0,0,-1.45);box(root,12.45,8.95,.14,0x526e63,0,0,-1.18);
 box(root,11.94,8.55,.12,0xd0bfa1,0,0,-1.05);
 // A canvas-covered bench with stitched edges and a measuring strip.
 for(let j=0;j<36;j++){const x=-4.32+j*.248;box(root,.11,.016,.018,0xbbaa8b,x,2.16,-.955);box(root,.11,.016,.018,0xbbaa8b,x,-2.16,-.955)}
 box(root,1.75,.17,.06,0xd2ab73,3.18,1.88,-.85);
 for(let j=0;j<16;j++)box(root,.016,j%5===0?.105:.057,.015,0x766147,2.41+j*.10,1.92,-.806);
 let down=()=>{},move=()=>{},up=()=>{},held=false,completed=false;
 const finish=message=>{if(completed)return;completed=true;say(message);done()};
 say(labels[type]);
 if(type==='carry'){
 const gloves=[glove(root,-3.46,1.46,1.5),glove(root,-2.55,1.43,1.5)];
 // A padded shipping cradle rests on a horizontal timber bench.
 box(root,16,.21,6,0x927050,0,-1.66,.7);
 box(root,15.6,.05,5.9,0xba9972,0,-1.53,.7);
 const shadow=oval(root,1.22,.055,.66,0x806b50,-1.05,-1.48,.25);
 const jar=vessel(root,-1.05,.04,.15,1.52);jar.rotation.x=.15;
 const target={x:2.35,y:0};
 box(root,3.2,.22,2.5,0x8c6343,target.x,-1.36,.05);
 box(root,3.05,.22,2.29,0xefdfbb,target.x,-1.17,.1);
 for(const side of [-1,1]){
  box(root,.12,.68,2.5,0xa57a55,target.x+side*1.55,-1.08,.05);
  oval(root,.22,.31,1.05,0xe2c69e,target.x+side*1.28,-.96,.06);
 }
 box(root,3.2,.81,.16,0xa87f57,target.x,-.97,-1.13);
 box(root,3.2,.4,.16,0xa07650,target.x,-1.20,1.25);
 ring(root,.87,.058,green,target.x,-1.02,.08).rotation.x=Math.PI/2;
 let ready=false,drag=false,offset;
 down=p=>{
 if(!ready && studio.hit(p,gloves)){ready=true;gloves.forEach((g,i)=>{jar.add(g);g.position.set(i?.57:-.57,-.79,.65);g.scale.setScalar(.57);g.rotation.z=i?-.64:.64});say('장갑을 꼈어요. 그릇 아래쪽을 받쳐 주세요.');return}
 const picked=studio.hit(p,[jar]);if(!picked)return;
 if(!ready)return mistake('유약 없는 질그릇에는 맨손의 기름과 염분이 스밀 수 있어요. 파란 니트릴 장갑을 껴요.');
 if(picked.name==='handle'||p.y>jar.position.y-.30)return mistake(picked.name==='handle'||p.x>jar.position.x+.62?'손잡이에 무게가 실리면 떨어질 수 있어요.':'무게가 기울어요. 두 장갑 사이의 밑부분을 받쳐요.');
 drag=true;offset=p.clone().sub(jar.position);say('두 손으로 받쳤어요. 완충재 가운데로 옮겨요.')};
 move=p=>{if(drag){jar.position.set(p.x-offset.x,p.y-offset.y,.78);shadow.position.x=jar.position.x+.17;shadow.position.y=jar.position.y-1.55}};
 up=()=>{if(!drag)return;drag=false;if(inside(jar.position,target,1.45)){jar.position.set(target.x,0,.25);shadow.visible=false;finish('상자 안에 그릇이 안정적으로 놓였어요.')}else{jar.position.set(-1.05,.04,.15);shadow.position.set(-1.05,-1.48,.25);mistake('완충재가 없는 곳이에요. 상자 안에 놓아 주세요.')}};
 }
 if(type==='brush'){
 box(root,14,.18,5.2,0xa98b66,0,-2.11,.14);
 oval(root,1.16,.08,.91,0x847458,1.04,-1.90,.12);
 const jar=vessel(root,1.04,.13,0,2.15);
 const soft=brush(root,-3.28,1.24,false),wire=brush(root,-3.28,-1.21,true);
 soft.scale.setScalar(1.56);wire.scale.setScalar(1.56);
 studio.tag('부드러운 붓',-3.26,2.31,.7);studio.tag('쇠솔',-3.26,-2.31,.6);
 // A continuous curved crust follows the shoulder. Only the contacted tiles lose material.
 const cells=[],cols=32,rows=5;
 const vertex=(i,j)=>{const angle=-1.5+3*i/cols, y=-.245+j*.62/rows+.019*Math.sin(i*1.32+j);
 const r=1.035-.15*Math.abs(y);return new T.Vector3(r*Math.sin(angle),y,r*Math.cos(angle))};
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const a=vertex(i,j),b=vertex(i+1,j),c=vertex(i+1,j+1),d=vertex(i,j+1);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([...a,...b,...c,...a,...c,...d],3));geo.computeVertexNormals();
  const patch=solid(jar,geo,0x745139);patch.material.color.offsetHSL(0,0,.018*Math.sin(i*4+j));patch.material.transparent=true;
  const centre=a.clone().lerp(c,.5);cells.push({patch,centre,wear:0,pass:0});
 }
 let selected=false,active=false,last,lastPixel,lastTime,warned=false,pass=0;
 down=(p,e)=>{
  if(studio.hit(p,[wire])){selected=false;return mistake('쇠솔의 금속 끝이 표면을 긁어요. 부드러운 붓을 골라요.')}
  if(!selected && studio.hit(p,[soft])){selected=true;say('붓을 들었어요. 흙을 짧게 여러 번 쓸어 주세요.');return}
  if(!selected)return mistake('흙을 털 도구를 먼저 골라요.');
  active=true;pass++;last=p.clone();lastTime=e.timeStamp;lastPixel=[e.clientX,e.clientY];warned=false;
 };
 move=(p,e)=>{if(!active)return;const t=e.timeStamp,dist=p.distanceTo(last);
  const plane=new T.Plane(new T.Vector3(0,0,1),-2.48),tip=studio.ray.ray.intersectPlane(plane,new T.Vector3());
  soft.position.copy(tip);soft.position.x+=.39;soft.position.y+=.78;
  if(Math.hypot(e.clientX-lastPixel[0],e.clientY-lastPixel[1])/Math.max(16,t-lastTime)>1){if(!warned){mistake('너무 빨라요. 표면이 상하지 않게 짧게 쓸어요.');warned=true}}
  else if(!warned&&dist>.01){let sum=0;
   for(const cell of cells){if(cell.wear<1&&cell.pass!==pass){
    const pos=studio.planePoint(jar.localToWorld(cell.centre.clone()));
    if(inside(p,pos,.67)){cell.pass=pass;cell.wear=Math.min(1,cell.wear+.34);cell.patch.material.opacity=1-cell.wear;cell.patch.visible=cell.wear<1}
   }sum+=cell.wear}
   const pct=Math.floor(100*sum/cells.length);
   if(sum===cells.length){soft.position.set(-3.28,1.24,1);finish('100% · 흙 아래의 빗살무늬가 한 줄로 이어졌어요.')}
   else say('흙 털기 '+pct+'% · 붓을 떼었다가 남은 흙을 다시 쓸어요.');
  }
  last=p.clone();lastTime=t;lastPixel=[e.clientX,e.clientY];
 };up=()=>{active=false};
 }
 if(type==='fit'){
 // Three unequal rim fragments. Their edges and painted grooves retain the same orientation on the assembled lid.
 const liftShadow=oval(root,.91,.57,.025,0x8f7c5e,0,0,-.77);liftShadow.visible=false;
 const centre={x:1.65,y:.12},radius=1.56,angles=[-.32,1.55,3.88,Math.PI*2-.32];
 const pieces=[];for(let i=0;i<3;i++){
 const a=angles[i],b=angles[i+1],mid=(a+b)/2,dx=.87*Math.cos(mid),dy=.87*Math.sin(mid);
 const geo=lidFragment(a,b,dx,dy,radius);
 const dest={x:centre.x+dx,y:centre.y+dy};
 const socket=solid(root,geo.clone(),0x978b70,dest.x,dest.y,-.60);socket.scale.set(.97,.97,.3);
 ring(root,.29,.045,green,dest.x,dest.y,-.36);
 const home=[[-3.15,.92],[-1.5,-.78],[-3.51,-.98]][i],g=group(root,...home,.25);
 solid(g,geo,clay);const arc=solid(g,new T.TorusGeometry(1.18,.044,6,28,b-a),cream,-dx,-dy,.166);arc.rotation.z=a;
 for(let k=0;k<4;k++){const t=a+(b-a)*(k+.5)/4;box(g,.055,.24,.04,cream,Math.cos(t)*1.37-dx,Math.sin(t)*1.37-dy,.105).rotation.z=t-.98}
 if(i===0)oval(g,.115,.115,.055,0xf8c953,0,.0,.29);g.rotation.x=.15;g.rotation.y=-.09;g.rotation.z=(i===1?2:3)*Math.PI/2;pieces.push({g,home,dest,fixed:false})}
 let piece,start,off,travel;
 down=p=>{const hit=studio.hit(p,pieces.filter(q=>!q.fixed).map(q=>q.g));piece=pieces.find(q=>q.g===hit?.parent);if(!piece)return;if(!pieces[0].fixed&&piece!==pieces[0]){piece=null;return mistake('기준이 없으면 금이 어긋나요. 금빛 점이 있는 테두리 조각을 먼저 놓아요.')}start=p.clone();off=p.clone().sub(piece.g.position);travel=0;liftShadow.visible=true;liftShadow.position.set(piece.g.position.x+.17,piece.g.position.y-.24,-.77);piece.g.position.z=.6};
 move=p=>{if(piece){travel=Math.max(travel,p.distanceTo(start));piece.g.position.set(p.x-off.x,p.y-off.y,.6);liftShadow.position.set(piece.g.position.x+.17,piece.g.position.y-.24,-.77)}};
 up=()=>{if(!piece)return;const q=piece;piece=null;liftShadow.visible=false;
 if(travel<.13){q.g.position.z=.25;q.g.rotation.z=(q.g.rotation.z+Math.PI/2)%(2*Math.PI);say('조각을 한 번 돌렸어요. 둥근 가장자리와 빗살을 살펴요.')}
 else if(inside(q.g.position,q.dest,.67)&&Math.abs(Math.sin(q.g.rotation.z/2))<.03){q.fixed=true;q.g.rotation.x=0;q.g.rotation.y=0;q.g.position.set(q.dest.x,q.dest.y,-.26);if(pieces.every(k=>k.fixed))finish('딸깍. 세 조각의 빗살이 한 바퀴 이어졌어요.');else say('딸깍. 가장자리 무늬가 이어졌어요.')}
 else{q.g.position.set(...q.home,.25);mistake('곡선과 빗살의 방향이 이어지지 않아요. 가장자리를 비교해요.')}};
 }
 if(type==='case'){
 const jar=vessel(root,-.73,.95,0,.84);jar.rotation.x=.17;
 for(const x of [-2.22,2.22])box(root,.045,1.80,.12,0x77978c,x,1.04,-.34);box(root,4.49,.07,.45,0x728e84,0,1.96,-.34);
 const cloth=box(root,1.65,.83,.11,0x98516b,1.13,.98,0);for(let j=0;j<5;j++)box(cloth,.05,.80,.045,cream,(j-2)*.28,0,.09);
 box(root,4.5,.14,.8,teal,.15,.07,-.15);
 const alarm=oval(root,.36,.34,.22,0xdb782a,3.25,1.22,.15); // alarm mounted beside the case

 const alarmLabel=studio.tag('경보 확인',3.18,2.12,.15);
 const mist=[];for(let j=0;j<8;j++)mist.push(oval(root,.046,.091,.025,0x79b8bf,-2.05+j*.54,1.52+(j%3)*.11,.41));
 const knobs=[{x:-2.05,a:1.4},{x:2.05,a:1.45}];let knob,lastAngle,checked=false;
 for(const k of knobs){
 const dial=solid(root,new T.CylinderGeometry(.89,1.02,.38,40),teal,k.x,-1.18,.03);dial.rotation.x=Math.PI/2;
 for(let j=-5;j<=5;j++){const a=j*.3;oval(root,.08,.08,.05,Math.abs(j)<=1?green:0x816e53,k.x+1.22*Math.sin(a),-1.18+1.22*Math.cos(a),.21)}
 k.pin=group(root,k.x,-1.18,.27);box(k.pin,.15,.68,.16,cream,0,.44);k.label=studio.tag('',k.x,-2.44,.15);
 }
 const refresh=()=>{knobs.forEach(k=>k.pin.rotation.z=-k.a);
 knobs[0].label.textContent='습도 '+Math.round(50+knobs[0].a*14)+'%';knobs[1].label.textContent='조명 '+Math.round(50+knobs[1].a*30)+' lux';
 mist.forEach((m,i)=>m.visible=knobs[0].a>(i+1)*.14);
 cloth.material.color.set(0x98516b).lerp(new T.Color(0xe9c8ba),Math.max(0,knobs[1].a)/1.5)};
 const angle=p=>Math.atan2(p.x-knob.x,p.y+1.18);
 refresh();down=p=>{if(studio.hit(p,[alarm])||inside(p,alarm.position,.55)){checked=true;alarm.material.color.setHex(green);alarmLabel.textContent='경보 확인됨';say('습도가 높고 빛이 강해요. 손잡이 가장자리를 둥글게 돌려요.');return}
 knob=knobs.find(k=>inside(p,{x:k.x,y:-1.18},1.38));
 if(knob&&!checked){knob=null;return mistake('어느 진열장의 신호인지 확인해야 해요. 주황 경보등을 먼저 눌러요.')}
 if(knob)lastAngle=angle(p)};
 move=p=>{if(!knob||inside(p,{x:knob.x,y:-1.18},.23))return;const a=angle(p),d=a-lastAngle;
 knob.a=Math.max(-1.5,Math.min(1.5,knob.a+Math.atan2(Math.sin(d),Math.cos(d))));lastAngle=a;refresh()};
 up=()=>{if(!knob)return;const k=knob;knob=null;
 if(Math.abs(k.a)>.36)return mistake(k===knobs[0]?(k.a>0?'습도가 높아 유리에 물방울이 맺혀요.':'너무 건조해 보자기 섬유가 약해져요.'):(k.a>0?'빛이 강해 보자기가 바래요.':'너무 어두워 무늬를 보기 어려워요.'));
 if(knobs.every(k=>Math.abs(k.a)<=.36))finish('두 눈금이 안정됐어요. 보자기 색과 질그릇의 무늬가 함께 보여요.');else say('한 눈금을 맞췄어요. 다른 손잡이도 살펴요.')};

 }
 const surface=studio.surface;let id=null;
 surface.onpointerdown=e=>{if(completed||held)return;held=true;id=e.pointerId;surface.setPointerCapture(id);down(studio.point(e),e);studio.draw()};
 surface.onpointermove=e=>{if(held&&id===e.pointerId&&!completed){move(studio.point(e),e);studio.draw()}};
 surface.onpointerup=surface.onpointercancel=e=>{if(!held||id!==e.pointerId)return;held=false;if(!completed)up();studio.draw()};
 studio.draw();
 return ()=>{surface.onpointerdown=surface.onpointermove=surface.onpointerup=surface.onpointercancel=null};
}
