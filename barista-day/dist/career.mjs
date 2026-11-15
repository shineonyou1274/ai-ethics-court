import {salaryDay, RIASEC, makeRecord, checkRecord, saveRecord, loadRecords, walletTotal, won} from './shared/workday.js';

export const MOMENTS = [
  {label:'OPEN 간판을 뒤집고 하루를 연 순간',type:'E'},
  {label:'주문을 받고 손님과 이야기한 순간',type:'S'},
  {label:'원두를 갈고 에스프레소를 추출한 순간',type:'R'},
  {label:'손님 취향에 맞춰 붓는 양을 조절한 순간',type:'I'},
  {label:'결제 금액과 영수증을 확인한 순간',type:'C'},
  {label:'컵을 씻어 선반에 정리한 순간',type:'C'},
  {label:'테이블을 닦아 다음 손님 자리를 준비한 순간',type:'R'},
];
const hhmm = min => `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`;
// 실제 대기 시간 대신 완료한 업무로 진행하는 체험 시계. 휴식 60분은 정오에 자동 반영한다.
// 다시 만든 음료 1잔은 15분 지연. 초과 지연은 다음 근무자에게 넘기는 것으로 단순화한다.
export function workClock(state) {
  let base = state.phase==='prep' ? (state.washed?15:0) : Math.min(420,30+state.index*130);
  if(state.phase==='close') base=420+state.cleaned.size*15;
  if(state.phase==='end') base=480;
  const overtime=Math.min(120,state.wasted*15);
  const workedMin=base+overtime;
  const breakMin=base>=210?60:0;
  const endMin=510+workedMin+breakMin;
  return {start:'08:30',end:hhmm(endMin),breakMin,workedMin,shiftMin:480};
}
export function clockLabel(state) {
  const c=workClock(state);
  return `${c.end} · ${{prep:'오픈 준비',serve:`영업 ${state.index}/3`,close:'마감',end:'퇴근'}[state.phase]}`;
}
export function recordFor(state, like, hard) {
  if(state.phase!=='end') throw new Error('마감을 끝낸 뒤 기록할 수 있어요.');
  const clock=workClock(state);
  return makeRecord({app:'barista-day',place:'cafe',job:{id:'barista',name:'바리스타',careernet:'180'},
    annual:3004,wageYear:2021,wageBasis:'음료조리사',shift:clock,workedMin:clock.workedMin,shiftMin:480,
    ending:{name:'손님 취향을 맞춰 간 하루',icon:'☕'},like,hard,
    extra:{sales:state.sales,materials:state.cost,drinks:state.records.length,satisfaction:state.tips,
      remakes:state.wasted,handedOverMin:Math.max(0,state.wasted*15-120),mode:state.accessibleMode?'touch':'3d'}});
}
const sessions=new WeakMap();
export function renderWorkdayEnd(container,state) {
  const clock=workClock(state),pay=salaryDay(3004,clock.workedMin,480);
  let session=sessions.get(state);if(!session){session={saved:false,record:null};sessions.set(state,session)}
  container.hidden=false;
  container.innerHTML=`<section class="sheet career-end"><div class="eyebrow">MY FIRST SHIFT</div>
    <h2>오늘의 일당 <small>세전 · 체험 금액</small></h2><strong class="daily-pay">${won(pay.total)}</strong>
    <p>08:30–${clock.end} · 휴식 60분 · 근무 ${clock.workedMin}분</p>
    <div class="ledger"><div><span>8시간 기본급</span><b>${won(pay.base)}</b></div><div><span>연장 ${pay.overMin}분</span><b>${won(pay.overtime)}</b></div></div>
    <details><summary>시간과 일당은 어떻게 계산했나요?</summary><p>커리어넷 직업 코드 180, 음료조리사 평균 연봉(중앙값) 3,004만 원(2021년 자료)을 사용해요. 연봉 ÷ 12 ÷ 209시간을 10원 단위로 반올림한 시급 ${won(pay.hourly)} × 근무 시간으로 계산해요. 연장은 시급의 1.5배, 최대 120분이에요. ${pay.floored?'자료 시급이 2026년 최저시급보다 낮아 최저시급을 적용했어요.':''}</p><p>업무를 마칠 때 체험 시계가 진행하고 정오 휴식 60분은 자동으로 반영해요. 다시 만든 음료마다 15분이 더 걸린 것으로 표현해요. 120분을 넘긴 지연은 다음 근무자에게 넘겨요. 실제로 화면을 보는 시간이나 실제 급여가 아닙니다.</p></details>
    <details><summary>오늘 내가 만든 가게 매출 · 가게 기록</summary><p>매출 ${won(state.sales)} / 재료비 ${won(state.cost)}<br>손님 만족 표시 ${state.tips}점 (기존 가상 팁)<br>만든 음료 ${state.records.length}잔 · 다시 만들기 ${state.wasted}회</p><small>팁은 일당에 더하지 않아요. 우리나라 카페는 대부분 팁을 받지 않아 만족 표시로만 남겨요. 맛과 재료비는 단순화한 체험입니다.</small></details>
    <h3>퇴근길, 마음에 남은 순간</h3><label>💛 끌린 순간<select id="likeMoment"><option value="">하나를 골라주세요</option>${MOMENTS.map((m,i)=>`<option value="${i}">${m.label}</option>`).join('')}</select></label>
    <label>🪨 버거운 순간<select id="hardMoment"><option value="">다른 순간 하나를 골라주세요</option>${MOMENTS.map((m,i)=>`<option value="${i}">${m.label}</option>`).join('')}</select></label>
    <p id="interestResponse" aria-live="polite"></p><small>순간 하나로 나를 정할 수는 없어요. 여러 직업을 해 보고 흥미검사와도 견주어 보세요. 적성 판정이나 직업 추천이 아닙니다.</small>
    <button id="saveDay" class="primary" disabled>출근 기록 저장하기</button><p id="recordStatus" role="status"></p><button id="again">다시 출근하기</button></section>`;
  const find=id=>container.querySelector('#'+id),like=find('likeMoment'),hard=find('hardMoment'),save=find('saveDay'),status=find('recordStatus');
  function update(){
    const a=MOMENTS[like.value],b=MOMENTS[hard.value];
    save.disabled=session.saved||!a||!b||a===b;
    find('interestResponse').textContent=[a,b].filter(Boolean).map(m=>`${m.label}: 그 순간의 일은 ${RIASEC[m.type].name} 쪽의 일, ${RIASEC[m.type].what}이에요.`).join(' ');
    if(a&&a===b)status.textContent='끌린 순간과 버거운 순간은 서로 다르게 골라주세요.';else if(!session.saved)status.textContent='';
  }
  like.onchange=hard.onchange=update;
  save.onclick=()=>{
    if(session.saved||save.disabled)return;
    const record=recordFor(state,MOMENTS[like.value],MOMENTS[hard.value]);
    const errors=checkRecord(record);if(errors.length){status.textContent=errors.join(' / ');return}
    const before=loadRecords().length;saveRecord(record);
    const persisted=loadRecords();
    if(persisted.length!==before+1){status.textContent='이 기기의 저장 공간이 막혀 기록을 저장하지 못했어요. 저장을 허용한 뒤 다시 눌러주세요.';return}
    session.saved=true;session.record=record;save.disabled=true;like.disabled=hard.disabled=true;
    status.textContent=`출근 기록을 저장했어요. 이 브라우저의 누적 일당 ${won(walletTotal(persisted))}.`;
  };
  if(session.saved){like.value=String(MOMENTS.findIndex(m=>m.label===session.record.like.label));hard.value=String(MOMENTS.findIndex(m=>m.label===session.record.hard.label));like.disabled=hard.disabled=true;status.textContent='이 하루의 기록은 이미 저장했어요.';update()}
  find('again').onclick=()=>location.reload();
}
