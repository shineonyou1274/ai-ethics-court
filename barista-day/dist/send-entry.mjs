import {inWorkdaySite} from './career.mjs';
import {loadMine,needsWhoCheck,keepSession,startNewSession,walletSummary,won} from './shared/workday.js?v=20261115';
import {openSendDialog} from './send-records.mjs';
const entry=document.getElementById('sendFromStart');
let gate=null;
function choosePerson(force=false){
 if(gate?.open||(!force&&!needsWhoCheck()))return;
 gate=document.createElement('dialog');gate.className='send-records';gate.setAttribute('aria-label','누구의 기록인가요?');
 gate.innerHTML=`<h2>누구의 기록인가요?</h2><p>지금 사람의 출근 기록 ${loadMine().length}개가 있어요.</p><button id="keepPerson">내 기록이에요</button><button id="freshPerson">새로 출근하는 사람이에요</button><p>새로 시작하면 앞사람 기록은 남겨 두고 숨겨요.</p>`;
 gate.addEventListener('cancel',e=>e.preventDefault());
 document.body.append(gate);
 gate.querySelector('#keepPerson').onclick=()=>{keepSession();gate.close();gate.remove();gate=null;refresh()};
 gate.querySelector('#freshPerson').onclick=()=>{startNewSession();location.reload()};gate.showModal();
}
const summary=document.createElement('div');summary.id='startWallet';
const fresh=document.createElement('button');fresh.id='newPerson';fresh.textContent='다른 사람이 쓰던 기기인가요? 새로 출근하기';fresh.onclick=()=>choosePerson(true);
if(entry){entry.before(summary);entry.after(fresh);entry.onclick=openSendDialog;}
function refresh(){if(entry)entry.hidden=!loadMine().length;const w=walletSummary();summary.innerHTML=`<p>🔖 다녀온 직업 ${w.jobs.length}개 · ⏱ 일한 시간 ${Math.floor(w.minutes/60)}시간 ${w.minutes%60}분<br><small>🪙 받은 일당 ${won(w.total)}</small></p>`;choosePerson()}
refresh();addEventListener('storage',refresh);addEventListener('pageshow',refresh);
for(const link of document.querySelectorAll('.home-link'))link.hidden=!inWorkdaySite();
