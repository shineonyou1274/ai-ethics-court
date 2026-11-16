import {loadMine} from './shared/workday.js?v=20261115';
import {encodeRecords} from './shared/collect.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Name/code exist only in this temporary dialog. No storage writes or requests.
export function openSendDialog(){
 const records=loadMine(),dialog=document.createElement('dialog');
 dialog.className='send-records';dialog.setAttribute('aria-labelledby','sendTitle');
 dialog.innerHTML=`<h2 id="sendTitle">선생님께 출근 기록 보내기</h2>${records.length?`
 <p>지금 출근하는 사람의 기록 ${records.length}개를 함께 보내요. 같은 지갑의 다른 직업 기록도 포함돼요.</p>
 <ul>${records.map(r=>`<li>${esc(r.job?.name)} · ${esc(r.date)}</li>`).join('')}</ul>
 <label for="sendName">번호나 이름</label><input id="sendName" maxlength="20" autocomplete="off" placeholder="예: 12번 또는 선생님이 정한 별명" required>
 <p>번호나 이름은 코드에 포함되며, 이 앱의 기기 저장소에는 남기지 않아요. 코드를 만들거나 복사해도 자동 전송되지 않아요.</p>
 <button id="makeCode">코드 만들기</button><div id="codeArea" hidden><label for="recordCode">내 출근 기록 코드</label><textarea id="recordCode" rows="5" readonly spellcheck="false"></textarea><button id="copyCode">복사하기</button><p>선생님이 알려 준 게시판이나 메신저에 붙여 넣어 주세요. 코드에는 번호나 이름, 직업, 날짜, 일당, 퇴근길 한 줄과 고른 순간·흥미 유형이 들어가요. 가게 매출은 포함하지 않아요.</p></div>
 `:'<p>아직 저장한 출근 기록이 없어요. 하루를 마치고 출근 기록을 저장한 뒤 다시 열어주세요.</p>'}
 <p id="sendStatus" role="status" aria-live="polite"></p><button id="closeSend">돌아가기</button>`;
 document.body.append(dialog);
 const find=id=>dialog.querySelector('#'+id),status=find('sendStatus');
 find('closeSend').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{dialog.replaceChildren();dialog.remove()},{once:true});
 if(records.length){
  const name=find('sendName'),code=find('recordCode'),area=find('codeArea');
  name.oninput=()=>{area.hidden=true;code.value='';status.textContent=''};
  find('makeCode').onclick=()=>{
   if(!name.value.trim()){status.textContent='번호나 이름을 먼저 적어주세요.';name.focus();return}
   code.value=encodeRecords(records,name.value.trim());area.hidden=false;status.textContent='코드를 만들었어요. 복사해서 선생님께 전달해 주세요.';
  };
  find('copyCode').onclick=async()=>{
   if(!code.value)return;
   try{await navigator.clipboard.writeText(code.value);status.textContent='복사했어요. 선생님이 알려 준 곳에 붙여 넣어주세요.'}
   catch{code.focus();code.select();status.textContent='자동 복사가 안 돼요. 선택된 코드를 길게 눌러 직접 복사해 주세요.'}
  };
 }
 dialog.showModal();return dialog;
}
