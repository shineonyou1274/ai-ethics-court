import * as T from './vendor/three.module.min.js';
import {group,box,oval,ring,solid,tvCamera} from './studio.mjs';
import {drawFeed} from './feed.mjs';
const mint=0x70cca9,ink=0x243e50,ice=0xadc5c5,amber=0xf1ba65,red=0xd36153;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function bench(studio){
 studio.reset();studio.bench();const p=studio.root;
 box(p,20,13,.35,0x203a4b,0,0,-1.20);box(p,10.5,7.9,.27,0x496776,0,0,-.91);
 for(const x of [-4.2,4.2])for(const y of [-2.55,2.55])oval(p,.08,.08,.05,ice,x,y,-.71);
 return p;
}
function monitor(studio,x,y,width,height){
 const z=.12;box(studio.root,width+.22,height+.22,.32,0x152a36,x,y,z-.2);
 const canvas=document.createElement('canvas');canvas.width=300;canvas.height=150;canvas.className='screen-feed';studio.host.append(canvas);
 const prev=studio.labels;studio.labels=()=>{prev?.();const a=new T.Vector3(x-width/2,y+height/2,z).project(studio.camera),b=new T.Vector3(x+width/2,y-height/2,z).project(studio.camera);
 canvas.style.left=(50+25*(a.x+b.x))+'%';canvas.style.top=(50-25*(a.y+b.y))+'%';canvas.style.width=50*(b.x-a.x)+'%';canvas.style.height=50*(a.y-b.y)+'%'};
 return canvas;
}
function led(p,x,y,c){return oval(p,.095,.095,.053,c,x,y,.23)}
function pushKey(p,x,y,w,c){return box(p,w,.62,.30,c,x,y,.13)}
function audioCheck(){
 const tracks=['host','guest'].map(n=>new Audio('audio/'+n+'.mp3'));let ctx,osc,gain,beat,turn=0,playing=false;
 const levels=[.2,.13,.82];tracks.forEach((t,i)=>t.onended=()=>{if(playing){turn=1-i;tracks[turn].play().catch(()=>{})}});
 function volumes(){tracks.forEach((t,i)=>t.volume=levels[i]**1.6);if(gain)gain.gain.value=levels[2]*.12}
 return {level:(i,v)=>{levels[i]=v;volumes()},toggle(){if(playing){this.stop();return false}
 ctx??=new AudioContext();ctx.resume().catch(()=>{});osc=ctx.createOscillator();gain=ctx.createGain();osc.type='triangle';osc.frequency.value=196;osc.connect(gain).connect(ctx.destination);volumes();osc.start();let note=0;const notes=[196,246.94,293.66,246.94,220,261.63,329.63,261.63];beat=setInterval(()=>osc?.frequency.setTargetAtTime(notes[++note%notes.length],ctx.currentTime,.035),380);playing=true;tracks[turn].play().catch(()=>{});return true},
 stop(){clearInterval(beat);playing=false;tracks.forEach(t=>t.pause());if(osc){osc.stop();osc=null}},dispose(){this.stop();ctx?.close()}};
}
export function openHand(studio,kind,{say,mistake,done}){
 const p=bench(studio),surface=studio.surface,clean=[];let down=()=>{},move=()=>{},up=()=>{},held=null,complete=false;
 const label=(text,x,y,z)=>studio.tag(text,x,y,z);
 const finish=text=>{if(complete)return;complete=true;say(text);done()};
 const add=(text,fn)=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;document.querySelector('#extra').append(b);clean.push(()=>b.remove());return b};
 if(kind==='camera'){
 const feed=monitor(studio,.15,1.12,4.42,2.02),rig=tvCamera(p,-2.18,-2.30,.05,1.26);
 const dial=group(p,2.02,-1.26,.13);ring(dial,.86,.20,ink,0,0,0);for(let i=0;i<20;i++){const a=i*Math.PI/10;box(dial,.06,.17,.13,i===0?amber:ice,.87*Math.sin(a),.87*Math.cos(a),.16).rotation.z=-a}
 label('구도 손잡이',-2.23,-2.57,.1);label('초점 링',2.02,-2.55,.1);
 let pan=.95,focus=-1.34,mode='',last;
 const refresh=()=>{rig.rotation.y=-.42+pan*.54;dial.rotation.z=-focus;drawFeed(feed,2,{pan,focus})};refresh();
 down=q=>{if(studio.hit(q,[rig])||q.x<-.8&&q.y<-.4){mode='pan';last=q.x}
 else if(q.distanceTo(new T.Vector2(2.02,-1.26))<1.3){mode='focus';last=Math.atan2(q.x-2.02,q.y+1.26)}};
 move=q=>{if(mode==='pan'){pan=clamp(pan+(q.x-last)*.53,-1.25,1.25);last=q.x}
 if(mode==='focus'){const a=Math.atan2(q.x-2.02,q.y+1.26);focus=clamp(focus+Math.atan2(Math.sin(a-last),Math.cos(a-last)),-1.6,1.6);last=a}
 refresh()};up=()=>{mode=''};
 add('촬영 화면 확인',()=>{if(complete)return;if(Math.abs(pan)>.24)return mistake('화면 밖으로 얼굴이 걸쳐요. 손잡이를 밀어 가운데 담아요.');
 if(Math.abs(focus)>.29)return mistake('눈매가 흐려요. 초점 링의 테두리를 돌려 봐요.');finish('화면 중앙에 보람 님의 눈매가 또렷하게 잡혔어요.')});
 say('왼쪽 카메라 손잡이를 밀어 구도를 잡고 오른쪽 링을 둥글게 돌려요.');
 }
 if(kind==='mix'){
 const audio=audioCheck();clean.push(()=>audio.dispose());const xs=[-2.65,0,2.65],levels=[.18,.15,.84],caps=[],lamps=[];
 const track=['진행자','보람 님','배경 음악'];let channel=-1;
 xs.forEach((x,i)=>{box(p,1.96,4.36,.15,ink,x,0,-.50);box(p,.13,2.92,.06,0x101e2a,x,-.05,-.30);
 for(let n=0;n<9;n++)box(p,.23,.035,.05,ice,x-.37,-1.50+n*.36,-.28);
 caps.push(box(p,.78,.32,.34,0xd6d9ce,x,0,.06));box(caps[i],.67,.045,.03,ink,0,0,.19);
 lamps.push(Array.from({length:10},(_,n)=>box(p,.20,.18,.11,ink,x+.63,-1.48+n*.31,-.2)));label(track[i],x,-2.38)});
 const refresh=()=>{for(let i=0;i<3;i++){caps[i].position.y=-1.5+levels[i]*2.9;audio.level(i,levels[i]);lamps[i].forEach((l,n)=>l.material.color.setHex(n<=levels[i]*10?(n>7?red:n>4?mint:amber):0x263c46))}};
 refresh();const listen=add('소리 듣기',()=>listen.textContent=audio.toggle()?'소리 끄기':'소리 듣기');
 down=q=>{channel=caps.findIndex(cap=>studio.hit(q,[cap]));if(channel<0)return;say(track[channel]+' 페이더를 위아래로 밀어요.')};
 move=q=>{if(channel<0)return;levels[channel]=clamp((q.y+1.5)/2.9,0,1);refresh()};
 up=()=>{if(channel<0)return;const i=channel;channel=-1;const v=levels[i];
 if(i<2&&(v<.48||v>.75))return mistake(v<.48?'말끝이 묻혀요. 마이크 레벨을 올려요.':'빨간 피크예요. 목소리가 찌그러져 들려요.');
 if(i===2&&v>.28)return mistake('배경 음악이 대사를 덮어요. 음악을 더 내려요.');
 if(levels[0]>=.48&&levels[0]<=.75&&levels[1]>=.48&&levels[1]<=.75&&levels[2]<=.28)finish('두 목소리는 초록 레벨, 음악은 그 아래에 놓였어요.');else say(track[i]+' 레벨이 맞았어요.')};
 say('은색 페이더를 잡아요. 말소리는 초록, 음악은 그 아래로 맞춰요.');
 }
 if(kind==='switch'){
 const preview=monitor(studio,-2.13,1.24,3.58,1.74),program=monitor(studio,2.07,1.24,3.58,1.74);
 label('대기 · PREVIEW',-2.13,2.42);label('송출 · PROGRAM',2.07,2.42);
 const keys=[-3.2,-1.65,-.10].map((x,i)=>{label('CAM '+(i+1),x,-1.63);return pushKey(p,x,-.96,1.18,ice)});
 const take=pushKey(p,2.10,-.95,1.76,mint),sub=pushKey(p,2.10,-2.11,1.75,amber);label('TAKE',2.10,-.96,.34);label('자막',2.10,-2.11,.34);
 let step=0,selected=3,live=0,caption=false,open=false,timer,late;
 const cues=['1번 · 시장 전경','2번 · 보람 님 첫 인사','3번 · 떡 빚는 손','이름 자막'];
 const announce=()=>{open=false;say('다음 큐 대기 · '+cues[step]);timer=setTimeout(()=>{open=true;say('지금 큐 · '+cues[step]);late=setTimeout(()=>{if(!complete)mistake('큐보다 늦어 진행자가 기다렸어요. 지금 이어 주세요.')},4500)},650)};
 const refresh=()=>{drawFeed(preview,selected);if(live)drawFeed(program,live,{caption});else{const c=program.getContext('2d');c.fillStyle='#233647';c.fillRect(0,0,300,150);c.fillStyle='#e1cba6';c.font='bold 28px sans-serif';c.fillText('송출 대기',85,86)}keys.forEach((k,i)=>k.material.color.setHex(selected===i+1?mint:ice))};
 refresh();announce();clean.push(()=>{clearTimeout(timer);clearTimeout(late)});
 down=q=>{const i=keys.findIndex(k=>studio.hit(q,[k]));if(i>=0){selected=i+1;refresh();return}
 const isTake=studio.hit(q,[take]),isSub=studio.hit(q,[sub]);if(!isTake&&!isSub)return;
 if(!open)return mistake('아직 큐 전이에요. 대기 화면을 먼저 준비해요.');
 if(step<3&&(!isTake||selected!==step+1))return mistake('큐시트와 달라요. '+cues[step]+' 화면을 골라 TAKE로 넘겨요.');
 if(step===3&&!isSub)return mistake('마지막 큐는 화면 전환 대신 이름 자막이에요.');
 clearTimeout(late);if(step<3)live=selected;else caption=true;refresh();
 if(++step===4)finish('마지막 손끝 화면에 보람 님의 이름이 올라갔어요.');else announce()};
 }
 if(kind==='edit'){
 const trackX=[-2.65,0,2.65],titles=['시장 전경','인터뷰','떡 빚는 손'],homes=[0,2.65,-2.65],clips=[],targets=[],fixed=[];let drag=-1,offset,cut=false;
 const time=label('원본 36초 / 편성 30초',0,2.45);time.style.background='#973f37';
 for(let i=0;i<3;i++){const g=group(p,homes[i],1.28,.1);box(g,2.12,.94,.20,[0x6496ae,0xb27866,0x88835f][i]);for(let n=0;n<6;n++){box(g,.11,.09,.03,ink,(n-2.5)*.31,.34,.14);box(g,.11,.09,.03,ink,(n-2.5)*.31,-.34,.14)}
 if(i===0){for(let j=0;j<4;j++)box(g,.24,.23,.04,j%2?amber:ice,(j-1.5)*.23,0,.13)}
 if(i===1){oval(g,.18,.20,.045,0xe8b99b,0,.01,.15);oval(g,.18,.08,.047,ink,0,.16,.17)}
 if(i===2){for(let j=0;j<3;j++)oval(g,.19,.13,.06,0xf0d5a5,(j-1)*.34,0,.15)}
 clips.push(g);ring(p,.43,.05,mint,trackX[i],-.55,-.36);targets.push(new T.Vector2(trackX[i],-.55));label(titles[i],trackX[i],-1.41)}
 const blade=box(p,.66,.49,.24,amber,-2.9,-2.14,.18);blade.rotation.z=-.25;label('자르기',-1.87,-2.17);
 const tail=box(p,.72,.92,.20,red,3.57,-.55,.20);tail.visible=false;const shadow=oval(p,.85,.22,.035,0x263b43,0,0,-.37);shadow.visible=false;
 // Zoom into the final twelve seconds for a fingertip-sized cut point.
 const ruler=group(p,0,-2.12,.13);box(ruler,4.8,.35,.12,ink);for(let i=0;i<=12;i++)box(ruler,.035,i%3===0?.27:.12,.04,ice,-2.22+i*.37,0,.09);
 const cursor=box(ruler,.13,.58,.15,amber,2.22,0,.17);ruler.visible=false;
 let trimming=false,endSec=36;
 const updateCut=q=>{endSec=clamp(24+Math.round((q.x+2.22)/.37),24,36);cursor.position.x=(endSec-24)*.37-2.22;time.textContent='자를 위치 '+endSec+'초 / 편성 30초';time.style.background=endSec===30?'#216353':'#973f37'};
 down=q=>{if(studio.hit(q,[blade])){if(fixed.length!==3)return mistake('먼저 세 컷을 놓아야 빈 구간의 시작을 찾을 수 있어요.');
 cut=true;ruler.visible=true;say('마지막 12초를 확대했어요. 눈금 위 칼날을 움직이고 30초에서 놓아요.');return}
 if(cut){if(Math.abs(q.y+2.12)<.58 && Math.abs(q.x)<2.65){trimming=true;updateCut(q)}return}
 drag=clips.findIndex((g,i)=>!fixed.includes(i)&&studio.hit(q,[g]));if(drag<0)return;offset=q.clone().sub(clips[drag].position);clips[drag].position.z=.59;shadow.visible=true};
 move=q=>{if(trimming){updateCut(q);return}if(drag<0)return;clips[drag].position.set(q.x-offset.x,q.y-offset.y,.59);shadow.position.set(q.x+.12,q.y-.22,-.37)};
 up=()=>{if(trimming){trimming=false;if(endSec!==30)return mistake(endSec>30?'편성 시간을 넘겨요. 빈 구간이 시작되는 30초를 찾아요.':'보람 님의 손 장면까지 잘려요. 끝을 조금 늘려요.');
 tail.visible=false;time.textContent='완성 30초 / 편성 30초';finish('빈 6초를 덜어내고 떡을 빚는 마지막 손동작까지 담았어요.');return}
 if(drag<0)return;const i=drag,g=clips[i];drag=-1;shadow.visible=false;
 if(i!==fixed.length||targets[i].distanceTo(g.position)>.84){g.position.set(homes[i],1.28,.1);return mistake('시장부터 소개하고 사람, 손으로 좁혀요. 비어 있는 다음 칸을 확인해요.')}
 fixed.push(i);g.position.set(trackX[i],-.55,.05);tail.visible=fixed.length===3;
 say(tail.visible?'세 컷이 이어졌어요. 칼을 집어 빈 6초를 잘라요.':titles[i]+' 컷을 붙였어요.')};
 say('그림이 든 필름을 아래 트랙에 순서대로 끌어 놓으세요.');
 }
 function point(e){return studio.point(e)}
 surface.onpointerdown=e=>{if(complete||held!==null)return;held=e.pointerId;surface.setPointerCapture(held);down(point(e));studio.draw()};
 surface.onpointermove=e=>{if(held===e.pointerId&&!complete){move(point(e));studio.draw()}};
 surface.onpointerup=surface.onpointercancel=e=>{if(held!==e.pointerId)return;held=null;if(!complete)up();studio.draw()};
 studio.draw();return ()=>{surface.onpointerdown=surface.onpointermove=surface.onpointerup=surface.onpointercancel=null;clean.forEach(fn=>fn());studio.host.querySelectorAll('.screen-feed').forEach(n=>n.remove())};
}
