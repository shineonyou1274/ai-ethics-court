import {salaryDay,makeRecord,checkRecord} from './shared/workday.js';
export const JOB={id:'firefighter',name:'소방관',careernet:'385',annual:4000,year:2021,basis:'소방관'};
export const STEPS=[
 {id:'badge',at:540,title:'오늘의 명찰',place:'station'},
 {id:'gear',at:550,title:'내 장비를 준비해요',place:'station',kind:'drag',items:['헬멧','장갑','무전기'],moment:'장비를 직접 챙긴 순간',type:'R'},
 {id:'check',at:585,title:'차량과 장비를 살펴요',place:'station',kind:'tap',items:['타이어','호스함','통신 상태'],moment:'차량과 장비 상태를 확인한 순간',type:'I'},
 {id:'brief',at:630,title:'동료와 오늘의 일을 나눠요',place:'station',kind:'choice'},
 {id:'train',at:660,title:'훈련장의 표적을 맞춰요',place:'training',kind:'spray',moment:'동료와 함께 물줄기를 조절한 순간',type:'R'},
 {id:'rest',at:720,title:'쉬는 시간도 하루의 일부예요',place:'station',kind:'choice'},
 {id:'dispatch',at:810,title:'출동 호출이 들어왔어요',place:'station',kind:'choice'},
 {id:'meet',at:840,title:'현장 밖, 기다리는 사람',place:'field',kind:'choice'},
 {id:'cones',at:870,title:'팀이 맡긴 구역을 표시해요',place:'field',kind:'drag',items:['표지 1','표지 2','표지 3'],moment:'동료와 현장 구역을 나눈 순간',type:'E'},
 {id:'clean',at:960,title:'복귀 후 장비도 돌봐요',place:'station',kind:'scrub',moment:'사용한 장비를 닦아 정리한 순간',type:'C'},
 {id:'report',at:1020,title:'다음 근무자에게 남길 이야기',place:'station',kind:'choice'},
 {id:'leave',at:1080,title:'퇴근 시간이 됐어요',place:'station'},
 {id:'end',at:1080,title:'오늘의 일당',place:'station'}
];
const clamp=x=>Math.max(0,Math.min(100,x));
export class Day{
 constructor(){this.i=0;this.done=false;this.energy=80;this.team=50;this.care=50;this.delay=0;this.breakWorked=0;this.flags={};this.log=[];this.stayed=null;this.record=null;this.choice=null;this.mistakes=new Set();this.hands={};}
 get step(){return STEPS[this.i]}
 get finished(){return this.step.id==='end'}
 remember(label,type){if(label&&!this.log.some(m=>m.label===label))this.log.push({label,type})}
 complete(drain=true){if(this.done||this.finished)return false;this.done=true;if(drain)this.energy=clamp(this.energy-3);if(this.step.moment)this.remember(this.step.moment,this.step.type);return true}
 next(){if(!this.done||this.finished)return false;this.i++;this.done=false;this.choice=null;return true}
 mistake(key){if(this.mistakes.has(this.step.id+key)||this.done)return false;this.mistakes.add(this.step.id+key);this.delay+=3;return true}
 choose(id){if(this.done)return false;const step=this.step.id;
 if(step==='brief'&&['pair','quick'].includes(id)){this.flags.paired=id==='pair';if(this.flags.paired){this.delay+=5;this.team+=12}else this.team+=3;this.remember('동료와 역할을 정한 순간','E')}
 else if(step==='rest'&&['rest','work'].includes(id)){if(id==='rest')this.energy=clamp(this.energy+18);else{this.breakWorked=15;this.delay=Math.max(0,this.delay-15);this.energy=clamp(this.energy-5)} }
 else if(step==='dispatch'&&id==='go'){if(!this.flags.paired){this.delay+=10;this.flags.rechecked=true}this.team=clamp(this.team+3)}
 else if(step==='meet'&&['listen','brief'].includes(id)){this.flags.listened=id==='listen';if(this.flags.listened){this.care+=20;this.delay+=8;this.energy-=4}else this.care+=5;this.remember('기다리는 사람에게 상황을 설명한 순간','S')}
 else if(step==='report'&&['detail','short'].includes(id)){this.flags.detailed=id==='detail';if(this.flags.detailed){this.delay+=10;this.team=clamp(this.team+10)}this.remember('다음 근무자에게 기록을 남긴 순간','C')}
 else if(step==='leave'&&['stay','handover'].includes(id)){this.stayed=id==='stay';this.energy=clamp(this.energy-Math.ceil(this.overtimeMin/15)*4)}
 else return false;
 this.choice=id;return this.complete(false);
 }
 get overtimeMin(){return this.stayed?Math.min(120-this.breakWorked,this.delay):0}
 get workedMin(){return 480+this.breakWorked+this.overtimeMin}
 get handedOverMin(){return this.stayed===null?0:Math.max(0,this.delay-this.overtimeMin)}
 get pay(){return salaryDay(JOB.annual,this.workedMin,480)}
 get clock(){const n=this.finished?1080+this.overtimeMin:this.step.at;return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
 get earned(){const base=Math.min(480,Math.max(0,this.step.at-540-(this.i>5?60:0)));return salaryDay(JOB.annual,this.finished?this.workedMin:base+(this.i>5?this.breakWorked:0),480).total}
 get ending(){if(this.handedOverMin)return '남은 일을 동료에게 이어 준 하루';if(this.flags.listened&&this.flags.detailed)return '사람의 이야기까지 기록에 담은 하루';if(this.flags.rechecked)return '다시 확인하며 호흡을 맞춘 하루';return '함께 준비하고 함께 돌아온 하루'}
 makeRecord(like,hard){if(!this.finished)throw Error('퇴근 뒤 기록해요.');if(!this.log.includes(like)||!this.log.includes(hard)||like===hard)throw Error('서로 다른 두 순간을 골라주세요.');
 if(!this.record)this.record=makeRecord({app:'fire-station',place:'fire-station',job:JOB,annual:JOB.annual,wageYear:JOB.year,wageBasis:JOB.basis,shift:{start:'09:00',end:this.clock,breakMin:60-this.breakWorked},workedMin:this.workedMin,shiftMin:480,ending:{name:this.ending,icon:'🚒'},like,hard,extra:{handedOverMin:this.handedOverMin,breakWorked:this.breakWorked,energy:this.energy,team:this.team,care:this.care}});
 const errors=checkRecord(this.record);if(errors.length)throw Error(errors.join(', '));return this.record;
 }
}
// A bounded spatial task model: progress only follows an actual stroke, never idle time.
export class Surface{
 constructor(){this.points=Array.from({length:48},(_,i)=>({x:.18+(i%8)*.09,y:.27+Math.floor(i/8)*.08,clean:false}))}
 rub(a,b){if(!a||!b||Math.hypot(a.x-b.x,a.y-b.y)<.002)return;const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;for(const p of this.points){const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l));if(Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<.075)p.clean=true}}
 get progress(){return this.points.filter(p=>p.clean).length/this.points.length}
}
