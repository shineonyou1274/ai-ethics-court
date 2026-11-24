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
function pushKey(p,x,y,w,c){return box(p,w,1.39,.30,c,x,y,.13)}
function audioCheck(onVoice){
 const tracks=['host','guest'].map(n=>new Audio('audio/'+n+'.mp3'));let ctx,osc,gain,beat,gap,voice=-1,turn=0,playing=false;
 const levels=[.2,.13,.82];function speech(i){voice=i;volumes();onVoice(i)}
 tracks.forEach((t,i)=>{t.onplaying=()=>{if(playing)speech(i)};t.onended=()=>{if(playing){speech(-1);turn=1-i;gap=setTimeout(()=>{if(playing)tracks[turn].play().catch(()=>{})},700)}}});
 function volumes(){tracks.forEach((t,i)=>t.volume=levels[i]**1.6);if(gain)gain.gain.value=levels[2]*.12*(voice>=0?.42:1)}
 return {level:(i,v)=>{levels[i]=v;volumes()},toggle(){if(playing){this.stop();return false}
 ctx??=new AudioContext();ctx.resume().catch(()=>{});osc=ctx.createOscillator();gain=ctx.createGain();osc.type='triangle';osc.frequency.value=196;osc.connect(gain).connect(ctx.destination);volumes();osc.start();let note=0;const notes=[196,246.94,293.66,246.94,220,261.63,329.63,261.63];beat=setInterval(()=>osc?.frequency.setTargetAtTime(notes[++note%notes.length],ctx.currentTime,.035),380);playing=true;tracks[turn].play().catch(()=>{});return true},
 stop(){clearTimeout(gap);clearInterval(beat);playing=false;speech(-1);tracks.forEach(t=>t.pause());if(osc){osc.stop();osc=null}},dispose(){this.stop();ctx?.close()}};
}
export function openHand(studio,kind,{say,mistake,done}){
 const p=bench(studio),surface=studio.surface,clean=[];let down=()=>{},move=()=>{},up=()=>{},held=null,complete=false;
 const label=(text,x,y,z)=>studio.tag(text,x,y,z);
 const finish=text=>{if(complete)return;complete=true;say(text);done()};
 const add=(text,fn)=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;document.querySelector('#actions').prepend(b);clean.push(()=>b.remove());return b};
 if(kind==='camera'){
 const feed=monitor(studio,.15,1.12,4.42,2.02),rig=tvCamera(p,-2.18,-2.30,.05,1.26);
 const dial=group(p,2.02,-1.26,.13);ring(dial,.86,.20,ink,0,0,0);for(let i=0;i<20;i++){const a=i*Math.PI/10;box(dial,.06,.17,.13,i===0?amber:ice,.87*Math.sin(a),.87*Math.cos(a),.16).rotation.z=-a}
 label('구도 손잡이',-2.23,-2.57,.1);label('초점 링',2.02,-2.55,.1);
 let pan=.75,focus=-1.34,mode='',last,bounce;dial.scale.setScalar(1.17);clean.push(()=>cancelAnimationFrame(bounce));
 const refresh=()=>{rig.rotation.y=-.42+pan*.54;dial.rotation.z=-focus;drawFeed(feed,2,{pan,focus})};refresh();
 down=q=>{cancelAnimationFrame(bounce);if(studio.hit(q,[rig])||q.x<-.8&&q.y<-.4){mode='pan';last=q.x}
 else if(q.distanceTo(new T.Vector2(2.02,-1.26))<1.3){mode='focus';last=Math.atan2(q.x-2.02,q.y+1.26)}};
 move=q=>{if(mode==='pan'){pan=clamp(pan+(q.x-last)*.53,-.86,.86);last=q.x}
 if(mode==='focus'){const a=Math.atan2(q.x-2.02,q.y+1.26);focus=clamp(focus+Math.atan2(Math.sin(a-last),Math.cos(a-last)),-1.6,1.6);last=a}
 refresh()};up=()=>{if(mode==='pan'&&Math.abs(pan)>.6){
 mistake('머리가 잘려요. 구도를 다시 잡을 수 있게 손잡이가 돌아와요.');const start=pan,t0=performance.now();
 const tick=t=>{const f=studio.motion.matches?1:clamp((t-t0)/230,0,1);pan=start+(Math.sign(start)*.48-start)*f;refresh();studio.draw();if(f<1)bounce=requestAnimationFrame(tick)};tick(t0)
 }mode=''};
 add('촬영 화면 확인',()=>{if(complete)return;if(Math.abs(pan)>.24)return mistake('화면 밖으로 얼굴이 걸쳐요. 손잡이를 밀어 가운데 담아요.');
 if(Math.abs(focus)>.29)return mistake('눈매가 흐려요. 초점 링의 테두리를 돌려 봐요.');finish('화면 중앙에 보람 님의 눈매가 또렷하게 잡혔어요.')});
 say('왼쪽 카메라 손잡이를 밀어 구도를 잡고 오른쪽 링을 둥글게 돌려요.');
 }
 if(kind==='mix'){
 let voice=-1;const audio=audioCheck(i=>{voice=i;refresh();studio.draw()});clean.push(()=>audio.dispose());const xs=[-2.65,0,2.65],levels=[.18,.15,.84],caps=[],lamps=[],scopes=[];
 const track=['진행자','보람 님','배경 음악'];let channel=-1;
 xs.forEach((x,i)=>{box(p,1.96,4.36,.15,ink,x,0,-.50);box(p,.18,i<2?.70:.66,.09,mint,x-.86,i<2?.10:-1.18,-.19);box(p,.13,2.92,.06,0x101e2a,x,-.05,-.30);
 for(let n=0;n<9;n++)box(p,.23,.035,.05,ice,x-.37,-1.50+n*.36,-.28);
 {const hit=box(p,1.62,1.40,.34,0xd6d9ce,x,0,.06);hit.material.transparent=true;hit.material.opacity=0;hit.material.depthWrite=false;caps.push(hit);box(hit,1.3,.45,.34,0xd6d9ce,0,0,0);box(hit,1.1,.085,.03,ink,0,0,.19)} // 손에 닿는 칸은 크게, 보이는 손잡이는 얇게: 초록 띠·불빛·파형을 가리지 않게
 box(p,1.78,.58,.10,0x142d3a,x,1.75,-.27);
 scopes.push(Array.from({length:19},(_,j)=>box(p,.067,1,.035,mint,x+(j-9)*.081,1.75,-.17)));
 lamps.push(Array.from({length:10},(_,n)=>box(p,.16,.18,.11,ink,x+.86,-1.48+n*.31,-.2)));label(track[i],x,-2.38)});
 const cue=label('마이크 점검',0,2.58);
 const refresh=()=>{cue.textContent=voice<0?'마이크 점검':track[voice]+' 말하는 중 · 음악 낮춤';for(let i=0;i<3;i++){caps[i].position.y=-1.5+levels[i]*2.6;audio.level(i,levels[i]);
 const hot=i<2&&levels[i]>.75;
 scopes[i].forEach((bar,n)=>{const sample=Math.abs(Math.sin(n*.43+i)*(.76+.24*Math.cos(n*1.71)));bar.scale.y=.035+.43*Math.min(1,sample*levels[i]*(hot?2.4:1.2));bar.material.color.setHex(hot?red:(i<2&&levels[i]<.48?0x616e73:mint))});
 lamps[i].forEach((l,n)=>l.material.color.setHex(n<=(i===2&&voice>=0?levels[i]*.42:levels[i])*10?(hot&&n>=7?red:n>4?mint:amber):0x263c46))}};
 refresh();const listen=add('소리 듣기',()=>listen.textContent=audio.toggle()?'소리 끄기':'소리 듣기');
 down=q=>{channel=caps.findIndex(cap=>studio.hit(q,[cap]));if(channel<0)return;say(track[channel]+' 페이더를 위아래로 밀어요.')};
 move=q=>{if(channel<0)return;levels[channel]=clamp((q.y+1.5)/2.6,0,1);refresh()};
 up=()=>{if(channel<0)return;const i=channel;channel=-1;const v=levels[i];
 if(i<2&&(v<.48||v>.75))return mistake(v<.48?'안 들려요. 마이크 레벨을 올려요.':'빨간 피크예요. 목소리가 찌그러져 들려요.');
 const speechLimit=Math.min(levels[0],levels[1])*.5;
 if(i===2&&v>speechLimit)return mistake('배경 음악이 대사를 덮어요. 음악을 더 내려요.');
 if(levels[0]>=.48&&levels[0]<=.75&&levels[1]>=.48&&levels[1]<=.75&&levels[2]<=speechLimit)finish('두 목소리는 초록 레벨, 음악은 그 아래에 놓였어요.');else say(track[i]+' 레벨이 맞았어요.')};
 say('은색 페이더를 잡아요. 말소리는 초록, 음악은 그 아래로 맞춰요.');
 }
 if(kind==='switch'){
 const preview=monitor(studio,-2.13,1.24,3.58,1.74),program=monitor(studio,2.07,1.24,3.58,1.74);
 label('대기 · PREVIEW',-2.13,2.42);label('송출 · PROGRAM',2.07,2.42);
 const keys=[-3.02,-1.39,.24].map((x,i)=>{label(String(i+1),x,-.91,.37);return pushKey(p,x,-.91,1.48,ice)});
 const take=pushKey(p,2.64,-.44,2.08,mint),sub=pushKey(p,2.64,-1.98,2.08,amber);label('TAKE',2.64,-.44,.34);label('자막',2.64,-1.98,.34);
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
 const seconds=[8,12,16],widths=seconds.map(t=>t*.205),titles=['시장 전경','인터뷰','떡 빚는 손'];
 const left=-3.69,trackY=-.45,targets=[],clips=[],homes=[.40,2.62,-2.25];
 let total=0,fixed=0,drag=-1,offset,cutting=false,cutAt=null;
 const time=label('편집 0초 / 편성 30초',0,2.49);
 box(p,7.55,1.36,.14,ink,0,trackY,-.44);
 let edge=left;
 for(let i=0;i<3;i++){
  const width=widths[i],x=edge+width/2;edge+=width;targets.push(x);
  box(p,width-.06,.12,.08,mint,x,trackY-.53,-.32);
  const g=group(p,homes[i],1.16,.1);clips.push(g);
  box(g,width-.04,1.38,.23,[0x6496ae,0xb27866,0x88835f][i]);
  for(let n=0;n<seconds[i];n++){const x=(n+.5)*.205-width/2;box(g,.085,.085,.03,ink,x,.53,.14);box(g,.085,.085,.03,ink,x,-.53,.14)}
  if(i===0){for(let j=0;j<4;j++)box(g,.24,.23,.04,j%2?amber:ice,(j-1.5)*.23,0,.13)}
  if(i===1){oval(g,.18,.20,.045,0xe8b99b,0,.01,.15);oval(g,.18,.08,.047,ink,0,.16,.17)}
  if(i===2){for(let j=0;j<3;j++)oval(g,.19,.13,.06,0xf0d5a5,(j-1)*.34,0,.15)}
 }
 const dock=new T.Vector2(-2.95,-2.03),blade=group(p,dock.x,dock.y,.23);
 box(blade,1.4,1.32,.23,amber);box(blade,.22,.88,.12,ice,.17,0,.18).rotation.z=-.46;
 const bladeLabel=label('칼',dock.x,-2.05,.42);
 const tail=box(p,6*.205,1.32,.18,red,left+33*.205,trackY,.28);tail.visible=false;
 const shadow=oval(p,1,.20,.03,0x263b43,0,0,-.29);shadow.visible=false;
 const zoom=group(p,0,-1.89,.12);zoom.visible=false;
 box(zoom,7.48,.66,.18,ink);box(zoom,3.61,.55,.07,red,1.81,0,.15);
 const step=.90;for(let t=26;t<=34;t++)box(zoom,.045,t===30?.52:.26,.06,ice,(t-30)*step,0,.21);
 const playhead=box(zoom,.09,.85,.08,amber,0,0,.27);
 const scaleLabel=label('26초　←　꼬리 확대　→　34초',0,-2.64);scaleLabel.hidden=true;
 function park(){blade.position.set(dock.x,dock.y,.23);bladeLabel.hidden=false;zoom.visible=false;scaleLabel.hidden=true;cutting=false;cutAt=null}
 down=q=>{
  if(studio.hit(q,[blade])){if(fixed<3)return mistake('먼저 세 컷을 놓아야 빈 구간의 시작을 찾을 수 있어요.');
   cutting=true;bladeLabel.hidden=true;zoom.visible=true;scaleLabel.hidden=false;playhead.visible=false;
   say('칼을 놓지 말고 확대된 꼬리에서 빈 6초의 시작으로 옮겨요.');return}
  drag=clips.findIndex((g,i)=>i>=fixed&&studio.hit(q,[g]));if(drag<0)return;offset=q.clone().sub(clips[drag].position);clips[drag].position.z=.59;shadow.visible=true
 };
 move=q=>{
  if(cutting){blade.position.set(q.x,q.y,.58);cutAt=null;
   if(Math.abs(q.y+1.89)<.67&&Math.abs(q.x)<=3.95)cutAt=30+Math.round(q.x/step);
   else if(Math.abs(q.y-trackY)<.67&&q.x>=left+20*.205&&q.x<=left+36*.205+.1)cutAt=clamp(Math.round((q.x-left)/.205),20,36);
   playhead.visible=cutAt!==null;if(cutAt!==null){playhead.position.x=(cutAt-30)*step;time.textContent='자를 위치 '+cutAt+'초 / 편성 30초'}return}
  if(drag>=0){clips[drag].position.set(q.x-offset.x,q.y-offset.y,.59);shadow.position.set(q.x+.12,q.y-.22,-.37)}
 };
 up=()=>{
  if(cutting){const end=cutAt;park();time.textContent='편집 36초 / 편성 30초';
   if(end!==30)return mistake(end===null?'칼을 잡고 컷의 꼬리까지 끌어 주세요.':end>30?'편성 시간을 넘겨요. 빈 구간 앞에서 놓아요.':'보람 님의 마지막 손동작까지 잘려요.');
   tail.visible=false;clips[2].scale.x=10/16;clips[2].position.x=left+25*.205;
   time.textContent='편집 30초 / 편성 30초';time.style.background='#216353';finish('빈 6초를 덜어내고 마지막 손동작까지 담았어요.');return}
  if(drag<0)return;const i=drag,g=clips[i];drag=-1;shadow.visible=false;
  if(i!==fixed||Math.abs(g.position.x-targets[i])>widths[i]/2+.2||Math.abs(g.position.y-trackY)>.84){g.position.set(homes[i],1.16,.1);return mistake('시장 전경, 인터뷰, 떡 빚는 손 순으로 한 줄에 이어요.')}
  fixed++;total+=seconds[i];g.position.set(targets[i],trackY,.05);tail.visible=total>30;time.textContent='편집 '+total+'초 / 편성 30초';time.style.background=total>30?'#973f37':'#216353';
  say(total>30?'6초 초과예요. 칼을 잡고 마지막 컷의 빈 꼬리를 잘라요.':titles[i]+' '+seconds[i]+'초를 붙였어요.')
 };
 say('시장 전경 → 인터뷰 → 손. 필름을 아래 트랙 왼쪽부터 이어 붙여요.');
 }
 function point(e){return studio.point(e)}
 surface.onpointerdown=e=>{if(complete||held!==null)return;held=e.pointerId;surface.setPointerCapture(held);down(point(e));studio.draw()};
 surface.onpointermove=e=>{if(held===e.pointerId&&!complete){move(point(e));studio.draw()}};
 surface.onpointerup=surface.onpointercancel=e=>{if(held!==e.pointerId)return;held=null;if(!complete)up();studio.draw()};
 studio.draw();return ()=>{surface.onpointerdown=surface.onpointermove=surface.onpointerup=surface.onpointercancel=null;clean.forEach(fn=>fn());studio.host.querySelectorAll('.screen-feed').forEach(n=>n.remove())};
}
