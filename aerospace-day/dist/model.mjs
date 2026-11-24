import {PARTS,SENSORS} from './task-data.mjs';
import {salaryDay,makeRecord,checkRecord} from './shared/workday.js';
export const JOB={id:'aerospace-engineer',name:'항공우주공학기술자',careernet:'151',annual:5450,year:2021,basis:'항공공학기술자'};
export const MOMENTS=[{label:'무전으로 오늘의 도킹 임무를 받은 순간',type:'E'},{label:'도면에서 화물선과 접속부를 살펴본 순간',type:'I'},{label:'틈이 있는 체결부를 손으로 조인 순간',type:'R'},{label:'센서 팀과 확인할 항목을 맞춘 순간',type:'S'},{label:'조종간과 추력으로 접근을 시험한 순간',type:'R'},{label:'조건을 바꾼 두 시험을 비교한 순간',type:'I'},{label:'기록을 보고 진행이나 보류를 고른 순간',type:'E'},{label:'내일 팀을 위해 결과를 남긴 순간',type:'C'}];
export const STEPS=[
 {time:'09:00',name:'오늘의 명찰',station:'meeting',team:'관제',radio:'오늘 16시, 무인 화물선 도킹을 앞두고 있어요. 지상에서 장치와 조작계를 확인해 주세요.'},
 {time:'09:10',name:'탈의·출입',station:'assembly',team:'시험팀',radio:'조립대 옆 준비 구역으로 와 주세요. 작업복과 출입 준비부터 함께 해요.'},
 {time:'09:30',name:'도면 검토',station:'drawing',team:'설계팀',radio:'오늘 화물선의 접속부 도면을 보냈어요. 오후 시험에 쓸 장치를 확인해 주세요.'},
 {time:'10:30',name:'도킹 장치 조립',station:'assembly',team:'제작팀',radio:'조립대에 장치가 도착했어요. 체결부에 틈이 없는지 직접 살펴 주세요.'},
 {time:'11:30',name:'센서 작업',station:'sensor',team:'센서팀',radio:'중심 정렬과 접근 거리 신호를 확인할 준비가 됐어요. 작업대로 와 주세요.'},
 {time:'12:00',name:'점심 휴식',station:'meeting',team:'동료 다온',radio:'오전 기록은 맡아 둘게요. 회의실에서 점심 먹고 쉬어요.'},
 {time:'13:00',name:'도킹 시뮬레이터',station:'cockpit',team:'시험팀',radio:'오전에 조립한 장치를 연결했어요. 조종석에서 설정을 바꿔 두 번 비교해 주세요.'},
 {time:'15:00',name:'진행·보류 판단',station:'meeting',team:'관제',radio:'16시 접근을 진행해도 될까요? 시험 기록을 가지고 회의실에서 의견을 주세요.'},
 {time:'16:00',name:'무인 화물선 도킹',station:'meeting',team:'관제',radio:'접근 시각이에요. 관제실 창에서 오늘의 결과를 함께 확인해요.'},
 {time:'17:00',name:'정리·인계',station:'drawing',team:'다음 근무 팀',radio:'시험 기록과 남은 확인 사항을 도면 책상에 남겨 주세요. 내일 이어서 볼게요.'},
 {time:'18:00',name:'퇴근',station:'meeting',team:'동료 다온',radio:'오늘의 기록을 남기고 퇴근해요.'}
];
export class Day{
 constructor(){this.stage=0;this.prepared=false;this.drawingChecked=false;this.drawingFound=new Set();this.drawingWrong=new Set();this.boltWrong=new Set();this.sensorWrong=new Set();this.assembled=false;this.repaired=false;this.sensorChecked=false;this.sensors=new Set();this.rested=null;this.spaceDone=false;this.spaceResults=[];this.decision=null;this.reportChecked=false;this.report=null;this.leave=null;this.energy=85;this.record=null}
 get drawingDelay(){return this.drawingWrong.size*2}
 get recheckDelay(){return this.drawingDelay+(this.boltWrong.size+this.sensorWrong.size)*2}
 get delay(){return this.recheckDelay+(this.assembled&&!this.repaired?15:0)}
 get overtime(){return this.leave==='stay'?Math.min(120,this.delay):0}
 get worked(){return 480+this.overtime}
 get pay(){return salaryDay(JOB.annual,this.worked,480)}
 get outcome(){if(!this.decision)return null;if(this.decision==='hold')return 'held';return this.repaired&&this.sensors.size===3&&this.spaceResults.at(-1)?.status==='docked'?'docked':'stopped'}
 get ending(){return this.outcome==='docked'?'무인 화물선 도킹을 지상에서 검증한 하루':this.outcome==='held'?'시험 기록을 보고 도킹을 안전하게 미룬 하루':'관제와 접근을 멈추고 내일의 확인을 남긴 하루'}
 noteBolt(id,expected){if(this.stage!==3||this.assembled||![id,expected].every(n=>Number.isInteger(n)&&n>=0&&n<6)||id===expected)return 0;const size=this.boltWrong.size;this.boltWrong.add(expected+':'+id);return this.boltWrong.size>size?2:0}
 attachSensor(id,port){if(this.stage!==4||!SENSORS[id]||this.sensors.has(id))return {valid:false,note:'이 센서는 이미 연결했거나 지금 연결 시간이 아니에요.'};if(!SENSORS[port])return {valid:false,note:'센서를 내려놓았어요. 연결부 위에 놓으면 확인해요.'};if(id!==port){const size=this.sensorWrong.size;this.sensorWrong.add(id+':'+port);return {valid:false,note:SENSORS[id].reason+' 원래 자리로 돌아왔어요. '+(this.sensorWrong.size>size?'배선 재확인 +2분.':'같은 연결 실수는 시간을 다시 더하지 않아요.')}};this.sensors.add(id);return {valid:true,note:SENSORS[id].name+' 연결했어요. 오후 시험에서 이 신호를 읽어요.'}}

 inspectDrawing(id){if(this.stage!==2||!PARTS[id])return {note:"지금은 도면 점검 시간이 아니에요."};const p=PARTS[id];if(p.clash)this.drawingFound.add(id);else this.drawingWrong.add(id);return {valid:p.clash,note:p.reason+(p.clash?" 제작팀에 위치 조정을 요청해요.":" 이 부품 재확인 +2분(한 번만 반영).")}}
 prepare(){if(this.stage!==1)return false;this.prepared=true;return true}
 assemble(repaired){if(this.stage!==3||this.assembled||typeof repaired!=='boolean')return false;this.repaired=repaired;this.assembled=true;return true}
 completeSpace({results,repaired}){if(this.stage!==6||this.spaceDone||repaired!==this.repaired||!Array.isArray(results)||results.length<2||results.length>4)return false;
 if(results.some(r=>!['docked','fast','offset','fuel','timeout','stopped'].includes(r.status)||!Number.isFinite(r.fuelUsed)||!Number.isFinite(r.offset)||!r.config||r.repaired!==this.repaired))return false;
 if(!results.some(r=>JSON.stringify(r.config)!==JSON.stringify(results[0].config))||!results.some(r=>r.fuelUsed>.2))return false;
 this.spaceResults=results.map(r=>({...r,config:{...r.config}}));this.spaceDone=true;this.energy=Math.max(0,this.energy-results.length*4);return true;
 }
 cleanup(){if(this.stage!==9||this.reportChecked)return false;this.reportChecked=true;this.report='conditions-and-limits';return true}
 next(choice){switch(this.stage){
 case 0:break;case 1:if(!this.prepared)return false;break;
 case 2:if(choice!=='drawing'||this.drawingFound.size!==3)return false;this.drawingChecked=true;break;
 case 3:if(!this.assembled)return false;break;
 case 4:if(choice!=='sensor'||this.sensors.size!==3)return false;this.sensorChecked=true;break;
 case 5:if(!['rest','talk'].includes(choice))return false;this.rested=choice;this.energy=Math.min(100,this.energy+(choice==='rest'?15:8));break;
 case 6:if(!this.spaceDone)return false;break;
 case 7:if(!['go','hold'].includes(choice))return false;this.decision=choice;break;
 case 8:if(choice!=='result')return false;break;
 case 9:if(!this.reportChecked||!['stay','handover'].includes(choice))return false;this.leave=choice;this.energy=Math.max(0,this.energy-this.overtime/15*4);break;
 default:return false;
 }this.stage++;return true}
 make(like,hard){if(this.stage!==10||like===hard||!MOMENTS[like]||!MOMENTS[hard])throw Error('하루를 마치고 서로 다른 순간을 골라요.');this.record ||=makeRecord({app:'aerospace-day',place:'design-lab',job:JOB,annual:JOB.annual,wageYear:JOB.year,wageBasis:JOB.basis,shift:{start:'09:00',end:`${18+Math.floor(this.overtime/60)}:${String(this.overtime%60).padStart(2,'0')}`,breakMin:60},workedMin:this.worked,shiftMin:480,ending:{name:this.ending,icon:'🚀'},like:MOMENTS[like],hard:MOMENTS[hard],extra:{trials:this.spaceResults.length,handedOverMin:this.delay-this.overtime,energy:this.energy,report:this.report,quality:this.repaired?'repair':'unrepaired',spaceTrials:this.spaceResults,drawingChecked:this.drawingChecked,drawingParts:[...this.drawingFound],drawingRecheckMin:this.drawingDelay,boltRecheckMin:this.boltWrong.size*2,sensorRecheckMin:this.sensorWrong.size*2,reportChecked:this.reportChecked,mission:'cargo-docking-1600',decision:this.decision,outcome:this.outcome,sensorChecked:this.sensorChecked,sensors:[...this.sensors]}});const errors=checkRecord(this.record);if(errors.length)throw Error(errors.join(', '));return this.record}
}
