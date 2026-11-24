export const PARTS=[
 {name:'거리 센서 브래킷',angle:0,clash:true,reason:'브래킷 끝이 도킹 링 안쪽 통로를 가로질러요.'},
 {name:'바깥 보호판',angle:60,clash:false,reason:'보호판과 링 사이에 여유가 있어요. 움직일 통로와 겹치는 곳을 찾아요.'},
 {name:'신호 케이블',angle:120,clash:true,reason:'케이블이 화물선이 들어올 원 안으로 지나가요.'},
 {name:'외부 지지대',angle:180,clash:false,reason:'지지대는 바깥쪽에 있어 접속 통로를 막지 않아요.'},
 {name:'잠금 걸쇠',angle:240,clash:true,reason:'걸쇠가 접속면 안쪽으로 너무 깊게 들어와 있어요.'},
 {name:'바깥 기록 단자',angle:300,clash:false,reason:'단자는 링 바깥쪽에 있어요. 안쪽 통로와 겹치지 않아요.'}
];
export const polar=(i,r=1.25)=>{const a=PARTS[i].angle*Math.PI/180-Math.PI/2;return{x:Math.cos(a)*r,y:Math.sin(a)*r}};
export const SENSORS=[
 {name:'거리 센서',reason:'링 위쪽에서 다가오는 화물선을 정면으로 바라봐야 거리를 읽어요.'},
 {name:'중심 센서',reason:'링 오른쪽 아래에서 중심 정렬 신호를 읽어요.'},
 {name:'기록 단자',reason:'링 왼쪽 아래의 기록 케이블과 이어 시험 값을 남겨요.'}
];
