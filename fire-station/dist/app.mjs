import {Day,JOB,STEPS} from './day.mjs';
import {Hands} from './hands.mjs';
import {salaryDay,won,RIASEC,MIN_WAGE,careernetUrl,saveRecordSafe,loadRecords,walletTotal} from './shared/workday.js';
import {openSendDialog} from './send-records.mjs';
const $=id=>document.getElementById(id),panel=$('panel');
export const day=new Day();let world=null,soundOn=false,audio=null,like=null,hard=null,saved=false;
const inSite=/\/fire-station\/(index\.html)?$/.test(location.pathname),home=inSite?'<a class="nav" href="../">← 다른 일터 고르기</a>':'';
const basePay=salaryDay(JOB.annual,480,480);
function beep(){if(!soundOn)return;try{audio||=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.setValueAtTime(620,audio.currentTime);o.frequency.linearRampToValueAtTime(420,audio.currentTime+.16);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.2);o.start();o.stop(audio.currentTime+.2)}catch{}}
$('sound').onclick=()=>{soundOn=!soundOn;$('sound').setAttribute('aria-label',soundOn?'소리 끄기':'소리 켜기');$('sound').textContent=soundOn?'♪ 켬':'♪';beep()};
$('expand').onclick=()=>document.body.classList.toggle('expanded');
function flat(){world?.dispose();world=null;$('world').hidden=true;$('fallback').hidden=false;$('flat').textContent='평면 모드 사용 중';$('flat').disabled=true}
$('flat').onclick=flat;
async function startWorld(){try{if(new URLSearchParams(location.search).has('flat'))return flat();const {createWorld}=await import('./world.mjs');world=createWorld($('world'));world.setPlace(day.step.place)}catch{flat()}}
function view(html){panel.innerHTML='<div>'+html+'</div>';panel.scrollTop=0}
function speech(msg){$('speech').textContent=msg}
function hud(){ $('clock').innerHTML=`소방관 · ${day.clock}${day.delay&&!day.finished?`<small>${day.delay}분 밀림</small>`:''}`;$('money').textContent='🪙 오늘 번 일당 '+won(day.earned);$('gauges').innerHTML=`<span>🤝 호흡 ${day.team}</span><span>🫶 안심 ${day.care}</span><span>🔋 힘 ${day.energy}</span>`}
const hands=new Hands($('hands'),$('handsProgress'),()=>{day.complete();beep();speech('직접 마쳤어요. 동료와 다음 일을 이어가요.');render()},(key,msg)=>{day.mistake(key);speech(msg);hud()});
const advance=()=>{if(day.next()){beep();render()}};
function nextButton(){return `<button class="wd-btn" id="next" ${day.done?'':'disabled'}>다음 일로 이동하기 →</button>`}
function finishText(text){return `<p class="reply" role="status">${text}</p>${nextButton()}`}
const help={gear:'장비를 누른 채 같은 이름표로 끌어 놓아요. 놓을 칸은 모두 같은 초록 테두리예요.',check:'타이어, 호스함, 통신 상태를 하나씩 눌러 확인해요.',train:'표적 위를 누른 채 천천히 움직여요. 손가락이 멈추면 진행도 멈춰요.',cones:'각 표지를 같은 번호 구역으로 옮겨요. 실제 현장에서는 팀의 지시를 따라요.',clean:'장비 보관함에 묻은 먼지를 닦아요. 지나간 곳만 깨끗해져요.'};
const completed={gear:'장비를 챙겼어요. 실제 보호장비 점검·착용 절차는 전문 교육이 필요해요.',check:'세 곳을 확인했어요. 작은 이상을 살피는 것도 소방관의 일이에요.',train:'훈련용 표적 세 개에 물줄기를 나누어 보냈어요.',cones:'팀이 맡긴 세 구역의 표지를 정리했어요.',clean:'먼지를 닦았어요. 다음 근무자가 쓸 장비를 준비했어요.'};
function choices(options){return options.map(o=>`<button class="wd-btn ghost" data-choice="${o.id}">${o.label}<span class="choice-detail">${o.detail}</span></button>`).join('')}
const choicesByStep={
 brief:[{id:'pair',label:'동료와 역할을 나누고 다시 확인해요',detail:'준비 5분 추가 · 함께 맡은 일을 분명히 해요.'},{id:'quick',label:'지금은 짧게 듣고 준비부터 해요',detail:'준비를 빨리 시작해요. 역할 확인은 나중에 남아요.'}],
 rest:[{id:'rest',label:'쉬며 물을 마시고 몸을 돌봐요',detail:'힘 +18 · 밀린 일은 그대로 남아요.'},{id:'work',label:'휴식 15분을 써서 정리를 해요',detail:'밀린 일 최대 15분 감소 · 힘 -5 · 일한 시간에 포함돼요.'}],
 dispatch:[{id:'go',label:'동료와 함께 출동해요',detail:'차량 이동과 현장 진입은 화면에서 단순화해요.'}],
 meet:[{id:'listen',label:'기다리는 사람의 이야기를 충분히 들어요',detail:'안심 +20 · 설명에 8분 추가 · 힘 -4'},{id:'brief',label:'핵심을 짧게 알리고 맡은 구역으로 가요',detail:'안심 +5 · 정해진 일을 이어가요.'}],
 report:[{id:'detail',label:'오늘 확인한 점을 자세히 남겨요',detail:'호흡 +10 · 기록에 10분 추가'},{id:'short',label:'필수 항목을 중심으로 짧게 남겨요',detail:'기록을 빠르게 마쳐요.'}]
};
function reply(){switch(day.step.id){case'brief':return day.flags.paired?'동료: “내가 차량, 당신이 장비. 출동 때도 이대로 확인해요.”':'동료: “일단 준비하고, 출동할 때 역할을 다시 맞춰요.”';case'rest':return day.choice==='rest'?'몸을 쉬게 했어요. 남은 일도 함께 살펴봐요.':'휴식 중 15분 일한 시간을 일당 계산에 포함했어요.';case'dispatch':return day.flags.rechecked?'오전에 남겨 둔 역할 확인을 지금 했어요. 10분이 더 걸렸어요.':'오전에 정한 역할 덕분에 서로 맡은 일을 바로 확인했어요.';case'meet':return day.flags.listened?'주민: “기다리는 동안 무슨 일이 진행되는지 알겠어요.”':'주민: “알겠어요. 안내받은 곳에서 기다릴게요.”';case'report':return day.flags.detailed?'다음 근무자: “확인한 점까지 남겨 줘서 이어받기 편해요.”':'필수 항목을 남겼어요. 자세한 이야기는 인계 때 전해요.';case'leave':return day.stayed?'남은 일을 마친 뒤 퇴근해요.':'남은 시간과 할 일을 다음 근무자에게 넘겼어요.';default:return'준비됐어요.'}}
function render(){
 hud();world?.setPlace(day.step.place);const step=day.step;
 const hand=!!['drag','tap','spray','scrub'].includes(step.kind);document.body.classList.toggle('hands-on',hand);$('taskSurface').hidden=!hand;if(!hand)hands.close();
 if(step.id==='badge'){
  speech('동료 하늘: “오늘은 우리 팀의 하루를 같이 보내요.”');
  view(`<p class="eyebrow">소방서 · 오늘의 명찰</p><h1>함께 돌아오는<br>하루.</h1><p>불을 끄는 순간 앞뒤에도 일이 있어요.<br>오늘은 소방관의 준비와 협업을 경험해요.</p><div class="nameplate"><b>온빛 소방서 · 소방관</b><ul><li>화재와 사고를 예방하고 현장을 살펴요.</li><li>재난 현장에서 동료와 사람·재산을 보호해요.</li><li>장비와 차량을 관리하고 다음 팀에 일을 이어요.</li></ul><p>09:00–18:00 · 쉬는 시간 60분<br>시급 ${won(basePay.hourly)} · 8시간 일당 <span class="number">${won(basePay.total)}</span></p><small class="fine">커리어넷 385 · 워크넷 2021년 소방관 자료. 실제 교대·당직과 급여 체계는 다르며, 여기서는 공통 8시간 체험으로 표현해요.</small></div><p>바닥을 누르면 내 캐릭터가 걸어요. 장비는 끌고, 표적은 누르며 움직이고, 먼지는 문질러요.</p><button class="wd-btn" id="start">명찰 달고 출근하기 →</button>${loadRecords().length?'<button class="wd-btn ghost" id="send">선생님께 출근 기록 보내기</button>':''}${home}<p class="fine">가상 인물과 단순화한 훈련이에요. 실제 화재 대응이나 구조 방법을 배우는 훈련은 아닙니다. 3D가 안 되면 같은 터치 작업으로 이어져요.</p>`);
  $('start').onclick=()=>{day.complete();advance()};if($('send'))$('send').onclick=openSendDialog;return;
 }
 if(step.id==='end'){endView();return}
 if(hand){day.hands[step.id]=hands.open(step,day.hands[step.id]);if(day.done)hands.active=false;hands.draw();view(`<p class="eyebrow">${day.clock} · ${step.place==='field'?'현장 지원':'소방서의 하루'}</p><h2>${step.title}</h2><p>${help[step.id]}</p>${step.items?`<ul class="todo">${step.items.map((item,i)=>`<li class="${day.hands[step.id].placed.includes(i)?'done':''}">${item}</li>`).join('')}</ul>`:''}${day.done?finishText(completed[step.id]):`<p class="fine">작업은 위 화면에서 직접 해요. 손을 떼면 멈추며, 취소한 물건은 제자리로 돌아와요.</p>${nextButton()}`}`);if(!day.done)speech(step.id==='cones'?'동료 하늘: “함께 맡은 구역의 표지를 옮겨 주세요.”':'손으로 직접 움직여 일을 마쳐요.');}
 else if(step.id==='leave'){
  const cap=Math.min(120-day.breakWorked,day.delay);
  const opts=day.delay?[{id:'stay',label:'남아서 마치기',detail:`${cap}분 연장 · 힘 ${Math.max(0,day.energy-Math.ceil(cap/15)*4)}로 감소${day.delay>cap?` · 초과 ${day.delay-cap}분은 인계`:''}`},{id:'handover',label:'넘기고 정시 퇴근',detail:`${day.delay}분을 인계 · 추가 연장 없음`}]:[{id:'handover',label:'정리한 일을 인계하고 퇴근해요',detail:'오늘 남은 지연은 없어요.'}];
  view(`<p class="eyebrow">18:00 · 퇴근</p><h2>${day.delay?'남은 일을 어떻게 할까요?':'함께 돌아갈 시간이에요.'}</h2><p>${day.delay?`오늘 ${day.delay}분의 일이 밀렸어요. 남을지, 다음 근무자에게 넘길지 골라요.`:'준비부터 복귀 정리까지 마쳤어요.'}</p>${day.done?finishText(reply()):choices(opts)}<p class="fine">추가 근무는 휴식 중 일한 시간까지 포함해 최대 120분으로 단순화해요. 어떤 선택도 적성 점수가 아니에요.</p>`);
 }else{speech(step.id==='meet'?'가상 주민 은우: “밖에서 기다리니 무슨 일이 진행되는지 몰라서 걱정돼요.”':step.id==='dispatch'?'동료 하늘: “현장 지원 요청이에요. 팀과 함께 출발해요.”':'동료와 다음 일을 정해요.');view(`<p class="eyebrow">${day.clock} · 소방관의 하루</p><h2>${step.title}</h2>${day.done?finishText(reply()):choices(choicesByStep[step.id])}`)}
 panel.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{if(day.choose(b.dataset.choice)){beep();render()}});if($('next'))$('next').onclick=advance;
}
function endView(){
 const pay=day.pay;
 view(`<p class="eyebrow">퇴근 · ${day.clock}</p><h2>오늘 번 일당 <small>세전</small></h2><div class="pay">🪙 ${won(pay.total)}</div><table class="wd-slip"><tr><td>기본급<small>${won(pay.hourly)} × 8시간</small></td><td>${won(pay.base)}</td></tr>${pay.overMin?`<tr><td>추가 근무 ${pay.overMin}분<small>휴식 중 ${day.breakWorked}분 · 퇴근 후 ${day.overtimeMin}분</small></td><td>${won(pay.overtime)}</td></tr>`:''}</table><details><summary>이 일당은 어떻게 나왔을까?</summary><p>커리어넷 소방관 평균 연봉(중앙값) 4,000만 원 · 워크넷 2021년 소방관 기준. 연봉 ÷ 12 ÷ 209시간을 10원 단위로 반올림해 시급으로 삼아요.</p><p>자료 시급 ${won(pay.hourly)} / 2026년 최저시급 ${won(MIN_WAGE.hourly)}. ${pay.floored?'자료 시급이 더 낮아 최저시급을 적용했어요.':'자료 시급을 적용했어요.'} 추가 근무는 1.5배로 계산해요. 실제 소방공무원 보수와 다른 공통 체험 모델이에요.</p><a href="${careernetUrl('385')}" target="_blank" rel="noopener noreferrer">커리어넷 출처 보기 ↗</a><p class="fine">직업마다 조사 인원이 적어 직업끼리 순위를 매기지 않아요.</p></details>${day.delay?`<p>인계 ${day.handedOverMin}분 · 남은 힘 ${day.energy}/100</p>`:''}<h2>퇴근길 돌아보기</h2><p class="reply">🚒 ${day.ending}</p><p>끌린 순간과 버거운 순간을 서로 다르게 하나씩 골라요.</p><div class="moments">${day.log.map((m,i)=>`<div class="wd-moment"><span>${m.label}</span><div class="moment-actions"><button data-kind="like" data-i="${i}" aria-label="끌린 순간: ${m.label}" aria-pressed="${like===i}">💛 끌림</button><button data-kind="hard" data-i="${i}" aria-label="버거운 순간: ${m.label}" aria-pressed="${hard===i}">🪨 버거움</button></div></div>`).join('')}</div><p id="interest"></p><p class="fine">순간 하나로 나를 정할 수는 없어요. 여러 직업을 해 보고 흥미검사와도 견주어 보세요. 적성 판정이나 직업 추천이 아닙니다.</p><button class="wd-btn" id="save">출근 기록 남기기</button><p class="status" id="saveStatus" role="status"></p><button class="wd-btn ghost" id="send" ${saved?'':'hidden'}>선생님께 출근 기록 보내기</button><button class="wd-btn ghost" id="again">같은 직업 다시 하기</button>${home}`);
 const update=()=>{const valid=like!==null&&hard!==null&&like!==hard;$('save').disabled=!valid||saved;panel.querySelectorAll('[data-kind]').forEach(b=>{b.disabled=saved||!!day.record;b.setAttribute('aria-pressed',String((b.dataset.kind==='like'?like:hard)===Number(b.dataset.i)))});$('interest').textContent=[like,hard].filter(i=>i!==null).map(i=>{const m=day.log[i],t=RIASEC[m.type];return `${m.label}: ${t.name} 쪽의 일, ${t.what}이에요.`}).join(' ');if(like!==null&&like===hard)$('saveStatus').textContent='서로 다른 순간을 골라주세요.';else if(!saved)$('saveStatus').textContent=''};
 panel.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{if(day.record)return;if(b.dataset.kind==='like')like=Number(b.dataset.i);else hard=Number(b.dataset.i);update()});
 $('save').onclick=()=>{if($('save').disabled)return;try{const record=day.makeRecord(day.log[like],day.log[hard]);const result=saveRecordSafe(record);saved=result.ok;update();$('saveStatus').textContent=result.ok?`기록을 남겼어요. 이 기기의 누적 일당 ${won(walletTotal(result.records))}`:'기기에 저장하지 못했어요. 저장 공간을 허용하고 다시 눌러주세요.';$('send').hidden=!saved}catch(e){$('saveStatus').textContent=e.message}};
 $('again').onclick=()=>location.reload();$('send').onclick=openSendDialog;update();
}
render();startWorld();
