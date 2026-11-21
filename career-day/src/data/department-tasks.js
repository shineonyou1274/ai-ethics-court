// 한 작업대의 앞줄 물건을 뒤쪽 목적지로 옮긴다. 목적지 번호는 화면에 표시하지 않는다.
export const desks = {
  rxcheck: {
    title:'봉투 기록 대조', hint:'가온 님 기록은 PH-0624, 상담 메모 한 장이에요. 일치하는 봉투는 인계하고 다른 봉투는 재확인해요.',
    objects:['0624 · 메모 1장','0624 · 메모 없음'], destinations:['다시 확인','상담 인계'], route:[1,0],
    good:'sure', bad:'recheck',
  },
  rxhandoff: {
    title:'가온 님 상담 준비', hint:'먼저 질문 메모를 상담 자리에 놓고, 답을 기다리는 문의는 동료에게 보내요.',
    objects:['질문 메모','미회신 문의'], destinations:['동료 인계','상담 자리'], route:[1,0], ordered:true,
  },
  paperwork: {
    title:'창구 교대 준비', hint:'영수증은 수납 담당에게, 개인정보 사본은 잠금함으로 보내고 마지막에 잠금 키를 단말기에 대요.',
    objects:['영수증','신분증 사본','잠금 키'], destinations:['단말기','수납 창구','잠금 서류함'], route:[1,2,0], ordered:true,
  },
  adminroute: {
    title:'바뀐 진료실 안내', hint:'옛 위치에는 이동 안내를, 새 진료실 앞에는 도착 안내를 붙여요.',
    objects:['3층으로 이동','여기가 진료실'], destinations:['3층 입구','2층 승강기'], route:[1,0],
  },
  physiopath: {
    title:'서우 님과 외출 경로 짚기', hint:'빵집까지 가는 길이에요. 계단에는 난간 표시를, 잠깐 쉬어 갈 공원에는 벤치 표시를 놓아요.',
    objects:['벤치 표시','난간 표시'], destinations:['계단','공원'], route:[1,0],
  },
};
