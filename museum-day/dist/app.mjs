import {Studio,vessel,box,teal} from './studio.mjs';
import {openHand} from './hands.mjs';
import {annual,day,rooms,clock,moments,finish,earned} from './day.mjs';
import {won,PAY_NOTE,MIN_WAGE,hourlyOf,currentSession,needsWhoCheck,keepSession,startNewSession,checkRecord,saveRecordSafe,walletSummary,careernetUrl} from './shared/workday.js';
import {openSendDialog} from './send-records.mjs';
const el=id=>document.getElementById(id),studio=new Studio(el('stage'));
let index=0,at=0,delay=0,rest=60,first=true,stay=false,like=-1,hard=-1,release,record,session,travelled=false;
const say=s=>el('feedback').textContent=s;
function button(label,fn,parent=el('actions')){const b=document.createElement('button');b.textContent=label;b.onclick=fn;parent.append(b);return b}
function screen(mode,who,title,line){
 release?.();release=null;document.body.className=mode;el('speaker').textContent=who;el('title').textContent=title;el('line').textContent=line;say('');
 el('actions').replaceChildren();el('extra').replaceChildren();
}
function bar(minute,where){
 el('status').textContent='학예사 · '+clock(minute);el('place').textContent=where;
 const breakUsed=index>4?rest:0;el('pay').textContent='🪙 오늘 번 일당 '+won(earned(minute,breakUsed));
}
function badge(){
 studio.reset();box(studio.root,9.6,4.9,.24,0x466e62,0,0,-1.4);box(studio.root,3,.24,1.9,0xbda17c,0,-1.67,0);const jar=vessel(studio.root,0,-.16,0,1.67);jar.rotation.x=.17;studio.draw();
 screen('badge','누리 역사박물관  /  기증 접수','학예사의 하루','단비 님이 할머니의 질그릇을 안고 왔어요. 이 그릇을 오늘 누구에게, 어떻게 보여 줄까요?');
 el('extra').textContent='09:00–18:00 · 휴게 1시간 · 시급 '+won(hourlyOf(annual).hourly);
 button('명찰 달고 출근하기',()=>{keepSession();session=currentSession().id;travel()});
 button('다른 사람으로 시작',()=>{startNewSession();session=currentSession().id;travel()});
 if(needsWhoCheck())say('이 기기를 함께 쓰나요? 같은 사람은 기존 지갑을 이어 써요.');
}
function travel(){
 const s=day[index];screen('map','받은 일 · 새로 옴',s.title,s.voice+' 님의 연락 · '+rooms[s.room]+'에서 만나요.');
 bar(s.time+delay,rooms[at]);travelled=false;
 const arrive=i=>{at=i;bar(s.time+delay,rooms[i]);if(i===s.room){travelled=true;event()}else say(rooms[i]+'에 도착했어요. 다음 일은 '+rooms[s.room]+'에 있어요.')};
 studio.floor(at,s.room,true,arrive);button(rooms[s.room]+'로 걸어가기',()=>studio.walk(s.room));
 const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='받은 일 · 앞으로 할 일';details.append(summary);
 for(const job of day.slice(index,index+3)){const p=document.createElement('p');p.textContent=clock(job.time)+' · '+rooms[job.room]+' · '+job.title;details.append(p)}el('extra').append(details);
}
function event(){
 const s=day[index];screen(s.hand?'working':'choice',s.voice,s.title,index===9?(first?'할머니 그릇을 제일 먼저 보게 해 주셨네요. 저 빗살 사이에 콩가루가 끼곤 했어요.':'보내 주신 사진을 할머니와 봤어요. 다음에는 둘이 같이 갈게요.'):s.line);
 if(s.hand){
 el('extra').innerHTML='<small>보존 담당자와 함께하는 모형 작업을 단순화한 체험이에요.</small>';
 release=openHand(studio,s.hand,{say,mistake:text=>{const old=delay;delay=Math.min(60,delay+2);bar(s.time+delay,rooms[at]);say(text+(delay>old?' · 다시 살피기 +2분':''))},done:()=>button('작업 기록하고 다음 연락 받기',next)});return}
 studio.floor(at,s.room,false,()=>{});
 // A location label in a conversation is informational; the visitor stays there until the reply.
 studio.host.querySelectorAll('.pin').forEach(b=>{b.disabled=true});
 s.choices.forEach((label,i)=>button(label,()=>{if(index===4)rest=i===0?60:30;if(index===7)first=i===0;
 el('actions').replaceChildren();say(s.reply[i]);button(index===9?'일당 확인하기':'다음 연락 받기',next)}));
}
function next(){if(++index<day.length){travel();return}
 if(delay){screen('end','18:00 · 인계','마감할 시간이에요','다시 살피는 데 '+delay+'분이 들었어요. 남은 정리 기록을 어떻게 할까요?');
 button('다음 근무자에게 인계',()=>payslip(false));button('남아서 '+delay+'분 정리',()=>payslip(true))}else payslip(false)}
function payslip(overtime){stay=overtime;studio.reset();const end=1080+(stay?delay:0),total=earned(end,rest);
 screen('end','누리 역사박물관 · 급여 명세서','오늘의 일당','');bar(end,'퇴근');
 el('line').innerHTML='<strong class="paybig">'+won(total)+'</strong>'+PAY_NOTE;
 const basis=el('extra');basis.innerHTML='<p>09:00–'+clock(end)+' · 휴게 '+rest+'분 · 실제 근무 '+(end-540-rest)+'분</p><p>시급 '+won(hourlyOf(annual).hourly)+' · '+MIN_WAGE.year+'년 최저시급 '+won(MIN_WAGE.hourly)+'</p><a href="'+careernetUrl(348)+'" target="_blank" rel="noopener">커리어넷 학예사 · 연 3,937만 원 (2021)</a><p>직업끼리 순위를 매기지 않아요.</p>';
 button('오늘의 순간 돌아보기',reflect)}
function reflect(){screen('end','퇴근길 · 돌아보기',like<0?'끌린 순간은 언제였나요?':'버거운 순간은 언제였나요?',like<0?'다시 해 보고 싶은 일을 골라요.':'다른 순간을 하나 골라요.');
 moments.forEach(([label],i)=>{if(i===like)return;const b=button(label,()=>{if(like<0){like=i;reflect()}else{hard=i;endDay()}});b.className='wd-moment'})}
function endDay(){record??=finish({rest,delay,stay,first,like,hard,session});
 screen('end','퇴근길 한 줄',record.ending.name,'끌린 순간 · '+record.like.label+'　 버거운 순간 · '+record.hard.label);
 const save=()=>{if(currentSession().id!==session){say('사용자가 바뀌었어요. 원래 지갑에서 다시 시작해 주세요.');return}
 const result=!checkRecord(record).length&&saveRecordSafe(record);say(result?.ok?'출근 도장을 찍었어요. 내 지갑 '+won(walletSummary().total):'저장 공간을 확인하고 다시 눌러 주세요.');if(!result?.ok)button('저장 다시 시도',save)};
 save();button('선생님께 보내기',openSendDialog);button('다른 일터 고르기',()=>location.assign('../'))}
el('info').onclick=()=>el('sources').showModal();el('records').onclick=openSendDialog;badge();
