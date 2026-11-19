# 오후 4시, 무인 화물선 도킹

항공우주공학기술자가 지상 시험동에서 무인 화물선의 도킹 장치를 조립·시험하고, 진행 또는 안전한 보류 의견을 관제에 전달하는 하루입니다. `codex/aerospace-story`는 통합 브랜치 `c5e305e`에서 시작한 1차 작업입니다. 운영 배포·PR 병합은 하지 않습니다.

## 실행

저장소에서 `node workday-site/build.mjs` 후 `python3 -m http.server 8123 --directory workday-site/public`을 실행하고 `/aerospace-day/`를 엽니다. 파일 더블클릭 대신 HTTP 서버를 사용하세요. `?flat=1`이나 평면 모드 버튼으로 같은 하루를 진행합니다.

## 하루와 직접 하는 일

09:00 명찰 → 09:10 우주복·출입 준비 → 09:30 도면 책상 → 10:30 조립대 → 11:30 센서 작업대 → 12:00 점심 → 13:00 조종석 → 15:00 진행/보류 판단 → 16:00 관제 결과 → 17:00 정리·인계 → 18:00 퇴근.

- 무전으로 다음 일이 도착합니다. 다섯 자리의 표시나 걷기 버튼을 누르면 내 캐릭터가 가구를 피해 걸어갑니다. 바닥을 눌러 둘러볼 수도 있습니다.
- 헬멧·장갑·연결부를 집어 인물에 놓습니다. 조립대에서는 체결부 둘레를 손가락으로 돌려 틈을 닫습니다.
- 조종석에서 질량·추력·안정 보조를 설계하고 조종간, 추력, 감속으로 시험합니다. 서로 다른 설정으로 두 번 이상 시험해야 판단 장면으로 갑니다. 실패·중지도 자료이며 추가 시간은 없습니다.
- 미조임 인계는 15분을 미리 알립니다. 18시에 남아서 마치기/정시 인계를 직접 선택합니다.
- 15시에 진행/보류를 직접 고릅니다. 진행을 골라도 체결부가 느슨하거나 마지막 시험이 안전 범위에 들지 않으면 16시에 관제가 접근을 멈추고 내일 다시 확인합니다.
- **1차 범위**: 도면·센서 확인은 간단한 자리 표시 장면입니다. 16시는 관제 결과와 창으로 표현합니다. 도면 간섭 찾기·센서 끌어 붙이기·화물선 실제 접속 애니메이션은 승인된 2차 작업으로 남습니다.
- 비행기 날개·풍동 게임은 제거했습니다. 우주비행사 임무가 아니라 항공우주공학기술자의 지상 모형 시험입니다.

## 유지한 약속

커리어넷 151, 워크넷 2021 항공공학기술자 연봉 중앙값 5,450만 원. 공통 계산 기준 시급 21,730원, 기본 8시간 일당 173,840원. 큰 일당 아래 PAY_NOTE, 돌아보기 순간 8개, 현재 사용자 기록 저장·지갑·교사 코드 내보내기를 유지합니다. [직업정보 출처](https://www.career.go.kr/cloud/w/job/view?seq=151).

3D↔평면을 바꿔도 위치와 작업 기록을 유지합니다. 동작 줄이기는 걷는 팔다리의 반복 움직임을 멈춥니다. 다른 탭에서 출근자가 바뀌면 진행·저장을 막습니다. 새로고침하면 진행 중 하루는 사라지고, 완료해 저장한 기록만 남습니다.

## 구조와 검사

- `dist/model.mjs`: 하루 순서·판단·결과·시간·일당·기록.
- `dist/world.mjs`, `navigation.mjs`: 다섯 작업 자리, 내 캐릭터, 가구를 피하는 이동, 평면 대체.
- `dist/space-model.mjs`, `space-world.mjs`, `space-ui.mjs`: 착용·직접 조임·설계·도킹 조종.
- `dist/app.mjs`: 무전과 하루 화면, 세션·저장·교사 내보내기 연결.
- `node aerospace-day/tests/model.mjs`: 모든 단계의 진행 조건, 진행/보류·안전 중지, 일당·연장·중복 저장.
- `node aerospace-day/tests/navigation.mjs`: 모든 작업 자리 사이 경로와 가구 충돌.
- `node aerospace-day/tests/space.mjs`: 상대 운동, 조임 영향, 비교, 도킹 가능성.
- `node aerospace-day/tests/integration.mjs`: 첫 화면·도장·사용자 분리·공통 파일 일치.
- `node aerospace-day/tests/send-records.mjs`: 교사 코드·세션 분리.
- `node workday-site/build.mjs --check`: 통합 묶음의 원본 일치.

기존 `tests/e2e-series.cjs`, `mode-switch.cjs`, `space-flow.cjs`, `space-access.cjs`는 이전 풍동 하루/장면 순서의 회귀 자료입니다. 새 하루 전체가 통과했다는 근거로 사용하지 않습니다. 현재 직접 조작 확인 범위와 증거는 BOARD에 기록합니다.

### 개념 출처와 한계

- [NASA: 우주복을 착용한 승무원의 Orion 조작계 시험](https://www.nasa.gov/image-article/orion-spacecraft-suited-crew-testing-2/)
- [NASA: Systems Engineering Simulator](https://www.nasa.gov/general/systems-engineering-simulator/)
- [NASA: Orion 엔지니어의 조작계 시뮬레이션 평가](https://www.nasa.gov/missions/artemis/orion/orion-simulations-help-engineers-evaluate-mission-operations-for-crew/)

자료는 지상 시험 업무의 개념 참고입니다. 화면의 우주복 착용 순서, 체결부, 조종·도킹 수치와 고장 모델은 직접 만든 교육용 상대 모형입니다. NASA 장비의 조작법/정비법, 실제 비행역학 계산이나 안전 판정이 아닙니다.
