const names={docked:'범위 안 정지',fast:'접근 속도 큼',offset:'중심 벗어남',fuel:'연료 부족',timeout:'시간 종료',stopped:'중지 기록'};
export function comparisonHTML(results){
 const selected=results.slice(-2),start=results.length-selected.length;
 const rows=[['결과',r=>names[r.status]],['질량',r=>r.config.mass],['추력 설정',r=>r.config.power],['안정 보조',r=>r.config.assist?'켬':'끔'],['체결부',r=>r.repaired?'조임':'틈 있음'],['중심 오차',r=>r.offset],['접근 속도',r=>r.speed],['연료 사용',r=>r.fuelUsed]];
 return `<table class="trial-comparison"><caption>조종석에서 내가 남긴 최근 두 시험</caption><thead><tr><th scope="col">비교 항목</th>${selected.map((r,i)=>`<th scope="col">${start+i+1}차</th>`).join('')}</tr></thead><tbody>${rows.map(([label,read])=>`<tr><th scope="row">${label}</th>${selected.map(r=>`<td>${read(r)}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="fine">시험 때의 설정과 결과예요. 관제와 다음 근무 팀이 같은 기록을 이어 봐요.</p>`;
}
