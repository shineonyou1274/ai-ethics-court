import {Studio,tvCamera,box,teal} from './studio.mjs';
import {openHand} from './hands.mjs';
import {annual,day,rooms,clock,moments,finish,earned} from './day.mjs';
import {won,PAY_NOTE,MIN_WAGE,salaryDay,RIASEC,hourlyOf,currentSession,needsWhoCheck,keepSession,startNewSession,checkRecord,saveRecordSafe,walletSummary,careernetUrl} from './shared/workday.js';
import {openSendDialog} from './send-records.mjs';
const el=id=>document.getElementById(id),studio=new Studio(el('stage'));
let index=0,at=0,delay=0,rest=60,first=true,stay=false,like=-1,hard=-1,release,record,session;
const say=s=>el('feedback').textContent=s;
function button(label,fn,parent=el('actions')){const b=document.createElement('button');b.textContent=label;b.onclick=fn;parent.append(b);return b}
function screen(mode,who,title,line){
 release?.();release=null;document.body.className=mode;el('speaker').textContent=who;el('title').textContent=title;el('line').textContent=line;say('');
 el('actions').replaceChildren();el('extra').replaceChildren();window.scrollTo(0,0);
}
function bar(minute,where){
 el('status').textContent='방송 PD · '+clock(minute);el('place').textContent=where;
 const breakUsed=index>4?rest:0;el('delay').textContent=delay?'밀림 '+delay+'분':'';el('pay').textContent='🪙 '+won(earned(minute,breakUsed));
}
function badge(){
 studio.reset();box(studio.root,9.6,4.9,.24,0x466e62,0,0,-1.4);box(studio.root,3,.24,1.9,0xbda17c,0,-1.67,0);const rig=tvCamera(studio.root,0,-1.65,.1,1.45);rig.rotation.y=-.65;studio.draw();
 screen('badge','새빛 방송국  /  출연 대기','방송 PD의 하루','처음 방송에 나오는 떡집 사장 보람 님. 오늘, 누구의 어떤 장면을 내보낼까요?');
 el('extra').innerHTML='<p>방송을 기획하고 출연자를 만나요.<br>영상과 소리를 조율해요.<br>생방송과 다시보기 편집을 맡아요.</p>09:00–18:00 · 휴게 1시간 · 시급 '+won(hourlyOf(annual).hourly)+' · 8시간 '+won(salaryDay(annual,480).total);
 button('명찰 달고 출근하기',()=>{keepSession();session=currentSession().id;prepare()});
 button('다른 사람으로 시작',()=>{startNewSession();session=currentSession().id;prepare()});
 if(needsWhoCheck())say('이 기기를 함께 쓰나요? 같은 사람은 기존 지갑을 이어 써요.');
}
function prepare(){
 screen('prep','08:55 · 회의실','송출 준비','헤드셋을 쓰고 오늘의 큐시트를 펼쳐요. 첫 연락은 시장 떡집에서 왔어요.');
 bar(535,'회의실');studio.floor(0,0,false,()=>{});button('헤드셋과 큐시트 챙기기',travel)
}
function travel(){
 const s=day[index];screen('map','새로 옴 · '+s.voice,s.title,s.voice+' · '+rooms[s.room]+'에서 만나요.');
 bar(s.time+delay,rooms[at]);
 const arrive=i=>{at=i;bar(s.time+delay,rooms[i]);if(i===s.room){event()}else say(rooms[i]+'에 도착했어요. 다음 일은 '+rooms[s.room]+'에 있어요.')};
 studio.floor(at,s.room,true,arrive);button(rooms[s.room]+'로 걸어가기',()=>studio.walk(s.room));
 if(index>0){const promise=document.createElement('p');promise.className='promise';promise.textContent='🤝 15:00 보람 님 손 신호(약속)'+(index>6?(first?' · 신호 전달':' · 동료 인계'):'');el('extra').append(promise)}
 const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='받은 일 · 앞으로 할 일';details.append(summary);
 for(const job of day.slice(index)){const p=document.createElement('p');p.textContent=clock(job.time)+' · '+rooms[job.room]+' · '+job.title;details.append(p)}el('extra').append(details);
}
function event(){
 const s=day[index];screen(s.hand?'working':'choice',s.voice,s.title,index===9?(first?'손을 펴 주셔서 첫마디가 나왔어요. 할머니에게도 제 방송을 보여 드리려고요.':'누구를 볼지 잠깐 헤맸어요. 다음에는 신호를 줄 분을 미리 소개해 주세요.'):s.line);
 if(s.hand){
 el('extra').innerHTML='<small>방송 장비의 조작을 단순화한 체험이에요.</small>';
 release=openHand(studio,s.hand,{say,mistake:text=>{const old=delay;delay=Math.min(60,delay+2);bar(s.time+delay,rooms[at]);say(text+(delay>old?' · 다시 살피기 +2분':''))},done:()=>button('작업 기록하고 다음 연락 받기',next)});return}
 studio.floor(at,s.room,false,()=>{});
 // A location label in a conversation is informational; the visitor stays there until the reply.
 studio.host.querySelectorAll('.pin').forEach(b=>{b.disabled=true});
 s.choices.forEach((label,i)=>button(label,()=>{if(index===4)rest=i===0?60:30;if(index===6)first=i===0;
 el('actions').replaceChildren();say(s.reply[i]);button(index===9?'일당 확인하기':'다음 연락 받기',next)}));
}
function next(){if(++index<day.length){travel();return}
 if(delay){screen('end','18:00 · 인계','마감할 시간이에요','다시 살피는 데 '+delay+'분이 들었어요. 남은 정리 기록을 어떻게 할까요?');
 button('다음 근무자에게 인계',()=>payslip(false));button('남아서 '+delay+'분 정리',()=>payslip(true))}else payslip(false)}
function payslip(overtime){stay=overtime;studio.reset();const end=1080+(stay?delay:0),total=earned(end,rest);
 screen('end','새빛 방송국 · 급여 명세서','오늘의 일당','');bar(end,'퇴근');
 el('line').innerHTML='<strong class="paybig">'+won(total)+'</strong>'+PAY_NOTE;
 const pay=salaryDay(annual,end-540-rest);
 const basis=el('extra');basis.innerHTML='<table class="wd-slip"><tr><td>기본급 · '+won(pay.hourly)+' × 8시간</td><td>'+won(pay.base)+'</td></tr>'+(pay.overMin?'<tr><td>연장 '+pay.overMin+'분 · 시급의 1.5배</td><td>'+won(pay.overtime)+'</td></tr>':'')+(rest<60?'<tr><td>휴게 중 일한 시간</td><td>'+(60-rest)+'분</td></tr>':'')+'</table><h2>이 일당은 어떻게 나왔을까?</h2><p>09:00–'+clock(end)+' · 휴게 '+rest+'분 · 실제 근무 '+(end-540-rest)+'분</p><p>시급 '+won(hourlyOf(annual).hourly)+' · '+MIN_WAGE.year+'년 최저시급 '+won(MIN_WAGE.hourly)+'</p><a href="'+careernetUrl(301)+'" target="_blank" rel="noopener">커리어넷 방송 PD · 연 4,500만 원 (2021)</a><p>직업끼리 순위를 매기지 않아요.</p>';
 button('오늘의 순간 돌아보기',reflect,basis)}
function reflect(){screen('end','퇴근길 · 돌아보기',like<0?'끌린 순간은 언제였나요?':'버거운 순간은 언제였나요?',like<0?(first?'손 신호로 첫 방송을 함께 연 하루.':'속보 뒤의 첫마디를 동료와 이은 하루.'):'다른 순간을 하나 골라요.');
 moments.forEach(([label],i)=>{if(i===like)return;const b=button(label,()=>{if(like<0){like=i;reflect()}else{hard=i;review()}});b.className='wd-moment'})}
function review(){screen('end','퇴근길 · 고른 순간','오늘 맡은 일에서 찾은 흥미','끌린 순간은 '+moments[like][0]+'. '+RIASEC[moments[like][1]].what+'이었어요.');
 el('extra').textContent='버거운 순간은 '+moments[hard][0]+'. '+RIASEC[moments[hard][1]].what+'이었어요. 순간 하나로 나를 정할 수는 없어요.';
 button('출근 기록 남기기',endDay);button('다시 고르기',()=>{like=hard=-1;reflect()})}
function endDay(){record??=finish({rest,delay,stay,first,like,hard,session});
 screen('end','퇴근길 한 줄',record.ending.name,'끌린 순간 · '+record.like.label+'　 버거운 순간 · '+record.hard.label);
 const save=()=>{if(currentSession().id!==session){say('사용자가 바뀌었어요. 원래 지갑에서 다시 시작해 주세요.');return}
 const result=!checkRecord(record).length&&saveRecordSafe(record);const wallet=walletSummary();say(result?.ok?'출근 도장을 찍었어요. '+wallet.jobs.length+'개 직업 · '+Math.floor(wallet.minutes/60)+'시간 '+wallet.minutes%60+'분 · 내 지갑 '+won(wallet.total):'저장 공간을 확인하고 다시 눌러 주세요.');if(!result?.ok)button('저장 다시 시도',save)};
 save();button('같은 직업 다시 하기',()=>location.reload());button('선생님께 보내기',openSendDialog);button('다른 일터 고르기',()=>location.assign('../'))}
el('info').onclick=()=>el('sources').showModal();el('records').onclick=openSendDialog;badge();
