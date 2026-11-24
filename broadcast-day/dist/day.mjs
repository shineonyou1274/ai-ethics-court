import {makeRecord,salaryDay} from './shared/workday.js';
export const annual=4500;
export const rooms=['회의실','분장실','스튜디오','부조정실','편집실','휴게실'];
export const day=[
 {time:540,room:0,title:'첫 생방송을 앞두고',voice:'📞 섭외 전화',line:'보람이에요. 떡 만드는 얘기는 자신 있는데, 카메라 앞에서 언제 말을 시작하죠?',choices:['손 신호로 시작을 알려 드릴게요','먼저 눈을 맞추고 함께 손 신호를 연습해요'],reply:['보람 님이 손을 펴 보이며 신호를 연습해요.','서로 눈이 마주치면 손을 펴기로 약속했어요.']},
 {time:585,room:2,title:'렌즈 앞의 보람 님',voice:'🎙️ 카메라 감독',line:'손잡이로 얼굴을 화면 가운데 담고 렌즈 옆 초점 링을 돌려 주세요.',hand:'camera'},
 {time:630,room:3,title:'목소리 둘, 음악 하나',voice:'🎙️ 음향 리허설',line:'진행자와 보람 님이 차례로 인사해요. 두 목소리를 살리고 배경 음악은 낮춰요.',hand:'mix'},
 {time:680,room:1,title:'실수한 장면',voice:'💬 보람',line:'떡 이름을 잘못 말한 리허설도 방송에 나오나요?',choices:['보람 님과 쓸 장면 정하기','실수 장면 빼고 다시 찍기'],reply:['보람 님이 손으로 떡을 빚는 장면을 골랐어요.','다시 찍은 소개를 편집실에 보냈어요.']},
 {time:720,room:5,title:'교대 시간',voice:'💬 동료 PD',line:'제가 부조정실을 볼게요. 오후 큐시트는 책상에 있어요.',choices:['한 시간 쉬기','30분 쉬고 큐시트 점검'],reply:['점심을 먹고 목소리를 쉬었어요.','점심 뒤 바뀐 순서를 확인했어요.']},
 {time:780,room:0,title:'확인 전의 제보',voice:'📞 작가',line:'시장 이전 소식이 퍼졌어요. 조회 수가 오르는데 출처가 한 곳뿐이에요.',choices:['시장과 구청에 각각 확인','확인될 때까지 관련 자막 보류','한 곳만 듣고 먼저 송출 (+10분)'],reply:['두 곳에서 확인한 일정만 큐시트에 적었어요.','시청자에게 확인된 내용만 전하기로 했어요.','제보에 나온 위치를 자막에 넣었어요. 작가가 시장에 다시 전화해 보기로 해요.']},
 {time:900,room:3,title:'속보가 끼어들었다',voice:'⏱️ 생방송 1분 전',line:'시장 속보가 먼저 나가요. 보람 님 인터뷰가 뒤로 밀렸어요.',choices:['진행자에게 속보를 맡기고 손 신호 주기','속보를 직접 잡고 인터뷰 시작을 동료에게 맡기기'],reply:['보람 님이 당신의 손 신호를 보고 고개를 끄덕여요.','동료가 인터뷰를 열었어요. 보람 님이 당신을 찾다가 한 박자 늦게 시작해요.']},
 {time:905,room:3,title:'지금, 송출',voice:'⏱️ 라이브 큐',line:'대기 화면을 고른 뒤 TAKE로 송출하세요. 큐가 켜지면 인물과 떡을 차례로 보여 줘요.',hand:'switch'},
 {time:970,room:4,title:'다시보기 30초',voice:'💬 편집 기사',line:'시장 전경, 인터뷰, 손끝 장면으로 이야기를 엮어요. 끝의 빈 6초를 잘라 주세요.',hand:'edit'},
 {time:1030,room:1,title:'방송이 끝난 뒤',voice:'💬 보람',line:'',choices:['오늘 방송 일지 남기기'],reply:['출연자가 건넨 말과 다음 방송에 바꿀 점을 일지에 담았어요.']}
];
export const clock=min=>Math.floor(min/60).toString().padStart(2,'0')+':'+(min%60).toString().padStart(2,'0');
export const moments=[['구도와 초점 맞추기','A'],['마이크 레벨 듣기','R'],['출연자와 장면 고르기','S'],['제보 확인하기','I'],['생방송 큐 내기','E'],['다시보기 편집하기','A']];
export function finish({rest,delay,stay,first,like,hard,session}){
 const end=1080+(stay?delay:0);
 return makeRecord({app:'broadcast-day',place:'broadcast-station',job:{id:'broadcast-producer',name:'방송연출가',careernet:301},annual,wageYear:2021,wageBasis:'방송연출가',shift:{start:'09:00',end:'18:00',breakMin:rest},workedMin:end-540-rest,shiftMin:480,session,
 ending:{name:first?'손 신호로 첫 방송을 함께 연 하루':'속보 뒤의 첫마디를 동료와 이은 하루',icon:'🎬'},
 like:{label:moments[like][0],type:moments[like][1]},hard:{label:moments[hard][0],type:moments[hard][1]},extra:{handSignal:first,actualEnd:clock(end),handedOver:stay?0:delay}});
}
export const earned=(minute,rest)=>salaryDay(annual,Math.max(0,minute-540-rest)).total;
