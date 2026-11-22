# 누리 역사박물관 · 학예사의 하루

단비 님이 기증한 질그릇이 수장고에서 보존처리실을 거쳐 전시실로 간다. 전시 환경 점검과 단체 관람이 겹칠 때 누구에게 무엇을 부탁하느냐에 따라 단비 님은 첫 관람객이 되거나 가족과 함께 전시 사진을 본다.

## 열기

저장소에서 `python3 -m http.server 8187`을 실행하고 `/museum-day/dist/`를 연다. 통합할 때는 이 디렉터리의 내용을 사이트의 `museum-day/`로 복사한다. 세션·지갑 공유는 다른 일터와 같은 origin에서 작동한다. 진입 카드·도장·빌드 목록은 총괄 담당 범위다.

## 조작

- 방 이름을 누르면 명찰을 단 학예사가 그곳으로 걷는다. 다음 일을 받은 방은 초록색이다.
- 장갑을 누르고 그릇의 바닥을 잡아 완충 상자 안에 놓는다.
- 부드러운 붓을 든 뒤 겹친 흙을 여러 번 쓸어 빗살무늬를 드러낸다.
- 볼록한 뚜껑 조각을 톡 눌러 90도씩 돌린다. 서로 다른 절단면과 테두리가 이어지도록 세 조각을 옮긴다.
- 습도·조명 손잡이를 좌우로 민다. 초록 구간은 질그릇과 보자기를 함께 전시하는 가상 전시 계획이다.
- WebGL을 이용할 수 없으면 같은 모형을 SVG로 투영한다. `?view=flat`으로 확인할 수 있다. 기기가 동작 줄이기를 요청하면 이동이 즉시 끝나고 관람객의 반복 운동이 멈춘다.

## 자료와 계산

- 학예사의 법적 근거. [박물관 및 미술관 진흥법 제6조](https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1016174485)
- 손잡이에 하중을 싣지 않고 몸체를 받치는 이유. [캐나다 보존연구소의 도자기·유리 자료](https://www.canada.ca/en/conservation-institute/services/conservation-preservation-publications/canadian-conservation-institute-notes/care-ceramics-glass.html)
- 빛에 민감한 직물을 함께 진열할 때의 고려 사항. [캐나다 보존연구소의 직물 보존 자료](https://www.canada.ca/en/conservation-institute/services/care-objects/textiles-costumes.html)
- 시리즈의 커리어넷 스냅샷 `career-day/src/data/careernet.js`에서 직업 코드 348, 워크넷 2021년 학예사 기준 연 3,937만 원을 사용한다. 공통 계산식 기준 시급 15,700원, 8시간 125,600원이다. 기증자의 만족이나 처리한 조각 수는 일당에 반영하지 않는다. [커리어넷 학예사](https://www.career.go.kr/cloud/w/job/view?seq=348)

## 구성과 검사

`dist/day.mjs`는 일정과 기록, `studio.mjs`는 건물과 모형, `hands.mjs`는 직접 조작, `app.mjs`는 출퇴근 흐름을 맡는다. `dist/shared/`는 공통 원본과 같은 복사본이다. Three.js와 대체 투영기의 라이선스는 `dist/vendor/`에 있다.

`node museum-day/tests/contract.mjs`로 계약과 결말별 급여를 확인한다. 위의 로컬 서버와 Playwright Chromium 준비 후 `node museum-day/tests/day-browser.cjs`로 네 크기에서 직접 포인터 입력을 재생한다. `MUSEUM_URL`, `MUSEUM_DEVICE`, `MUSEUM_REVIEW`, `MUSEUM_VIDEO`로 주소·기기·출력 위치를 고를 수 있다. 동영상은 `node shared/tools/flicker.cjs <영상>`으로 검사한다.
