import {makeRecord, salaryDay} from './shared/workday.js';

export const annual = 3937;
export const rooms = ['사무실','수장고','보존처리실','전시실','교육실','휴게실'];
// Each arrival stays on the slip until the player reaches its room.
export const day = [
 {time:540,room:0,title:'단비 님의 기증',voice:'단비',line:'할머니가 콩을 담아 두던 그릇이에요. 전시되는 날, 저도 볼 수 있을까요?',choices:['전시되면 제일 먼저 보여 드릴게요'],reply:['단비 님이 오래된 그릇 사진과 연락처를 남겼어요.']},
 {time:570,room:1,title:'기증품을 옮겨요',voice:'수장고 동료',line:'완충재를 깐 상자를 준비했어요. 그릇의 무게를 어디로 받치면 좋을까요?',hand:'carry'},
 {time:615,room:2,title:'흙 아래의 무늬',voice:'보존 담당',line:'표면 상태를 확인했어요. 부드러운 붓으로 얇게 붙은 흙을 털어 볼까요?',hand:'brush'},
 {time:675,room:3,title:'손끝으로 보는 전시',voice:'어린이 관람객',line:'선생님, 저 빗살을 손으로 만져 봐도 돼요?',choices:['교육실 복제품을 건네기','옆에서 확대 그림 함께 보기'],reply:['아이가 복제품 위의 홈을 따라 손끝을 움직여요.','아이가 두 줄 사이에서 작은 빗살 하나를 찾아요.']},
 {time:720,room:5,title:'점심 교대',voice:'안내 동료',line:'제가 전시실을 볼게요. 오후 단체 관람 자료는 책상에 있어요.',choices:['한 시간 쉬기','30분 쉬고 교구 준비하기'],reply:['동료에게 무전기를 맡기고 점심을 먹었어요.','점심 뒤 복제품을 꺼내 단체 교구를 준비했어요.']},
 {time:780,room:2,title:'흩어진 뚜껑 조각',voice:'보존 담당',line:'함께 온 뚜껑의 세 조각이에요. 원본에 접착하기 전, 받침 위에서 방향을 살펴요.',hand:'fit'},
 {time:825,room:3,title:'사진 한 장',voice:'관람객',line:'할머니께 보여 드리려고요. 플래시를 켜도 될까요?',choices:['플래시 끄는 법 함께 찾기','밝은 교육실 복제품으로 안내'],reply:['관람객이 플래시를 끄고 한 발 가까이서 찍었어요.','관람객이 교육실에서 복제품의 무늬를 찍었어요.']},
 {time:900,room:4,title:'두 곳에서 온 연락',voice:'안내 데스크',line:'단비 님과 단체가 동시에 도착했어요. 옛 보자기를 함께 둔 진열장도 환경 점검 신호를 보내요.',choices:['동료에게 단체를 맡기고 단비 님 모시기','단체를 직접 맞고 단비 님께 양해 구하기'],reply:['동료가 단체를 교육실로 안내해요. 단비 님과 먼저 진열장을 점검해요.','단체에게 뚜껑 무늬를 보여 줬어요. 단비 님은 먼저 가시며 전시 사진을 부탁해요.']},
 {time:945,room:3,title:'그릇 곁의 옛 보자기',voice:'시설 동료',line:'그릇 곁에 빛에 민감한 천도 있어요. 두 눈금을 전시 계획의 초록 범위로 맞춰 주세요.',hand:'case'},
 {time:1020,room:0,title:'단비 님에게',voice:'단비',line:'',choices:['기증 기록에 오늘 이야기 남기기'],reply:['그릇의 쓰임과 기증자의 말을 함께 기록했어요.']}
];
export const clock = min => Math.floor(min/60).toString().padStart(2,'0')+':'+(min%60).toString().padStart(2,'0');
export const moments = [['질그릇 옮기기','R'],['무늬 찾아내기','I'],['조각 맞추기','R'],['관람객 안내','S'],['전시 환경 맞추기','C'],['기증자와 연락하기','S']];
export function finish({rest,delay,stay,first,like,hard,session,id}){
 const end=1080+(stay?delay:0), worked=end-540-rest;
 return makeRecord({app:'museum-day',place:'museum',job:{id:'curator',name:'학예사',careernet:348},
 annual,wageYear:2021,wageBasis:'학예사',shift:{start:'09:00',end:clock(end),breakMin:rest},workedMin:worked,shiftMin:480,
 ending:{name:first?'단비 님과 첫 전시를 함께 본 하루':'전시 사진에 약속을 담아 보낸 하루',icon:'🏺'},
 like:{label:moments[like][0],type:moments[like][1]},hard:{label:moments[hard][0],type:moments[hard][1]},
 session,id,extra:{promised:true,firstVisitor:first,handedOver:stay?0:delay}});
}
export const earned=(minute,rest)=>salaryDay(annual,Math.max(0,minute-540-rest)).total;
