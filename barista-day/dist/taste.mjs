// A simplified dilution model for play, not a measurement of real extraction quality.
export function tasteProfile(amount,preferred=1,milk=false){
 const ratio=Math.max(0,Math.min(1.55,Number.isFinite(amount)?amount:0));
 const delta=ratio-preferred,match=Math.abs(delta)<=.16,near=Math.abs(delta)<=.36;
 const label=ratio<.82?'진한 맛':ratio>1.18?'연한 맛':'균형 잡힌 맛';
 const reaction=match?'딱 제가 좋아하는 농도예요!':delta<0?(near?'맛있는데, 제 취향보다 조금 진하네요.':'제 입맛에는 많이 진하네요. 다음엔 조금 더 부어주세요.'):(near?'조금 연하지만 부드럽네요.':'제 입맛에는 많이 연해요. 다음엔 조금 덜 부어주세요.');
 return {amount:ratio,label,volume:Math.round(30+120*ratio),match,tip:match?200:near?100:0,reaction,milk};
}
