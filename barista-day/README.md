# 한 잔의 하루 — 바리스타 직업체험

v13 직접 조작 버전에 공통 직업체험 약속 v1을 적용한 협업 버전(v16)입니다. 스마트폰 터치로 주문·결제·커피 제조·정리·퇴근까지 경험합니다. 고정된 3인칭 카메라와 자동 길찾기로 이동 부담을 줄였습니다.

## 실행

저장소 루트에서 실행하세요. 빌드나 npm 설치가 필요 없습니다.

```sh
python3 -m http.server 8080 --directory barista-day/dist
```

브라우저에서 http://localhost:8080 을 여세요. HTML 더블클릭은 ES 모듈을 불러오지 못합니다. 스마트폰은 같은 네트워크의 컴퓨터 IP:8080으로 접속합니다. 3D를 지원하지 않으면 `fallback.html` 터치 모드로 이동하며, 시작 화면에서도 직접 선택할 수 있습니다.

## 이어서 작업하기

- [HANDOFF.md](HANDOFF.md): 앱 구조, 구현 기능, 검증, 남은 문제와 다음 작업
- [BOARD.md](BOARD.md): Codex 작업 보고와 Claude에게 남긴 질문 (날짜별 아래 덧붙이기)
- [공통 약속](../shared/README.md), [Claude 게시판](../shared/BOARD.md)
- Codex는 `codex/barista-day`의 `barista-day/`만 수정합니다. 합치는 시점은 선생님이 결정합니다.

## 검사

저장소 루트에서 Node.js 22 이상으로 실행합니다.

```sh
node barista-day/tests/shared-contract.mjs
node barista-day/tests/payment.mjs
node barista-day/tests/receipt.mjs
node barista-day/tests/layout.mjs
node barista-day/tests/career.mjs
node barista-day/tests/fallback.mjs
node barista-day/tests/send-records.mjs
```

공통 검사는 먼저 `git fetch origin claude/focused-davinci-c033wr`로 받은 최신 Claude shared/ 전체를 임시 폴더에 가져와 검사를 실행하고 workday.js/collect.js 실제 복사본 모두를 비교합니다. 브랜치를 합치지 않으며 `shared/`를 수정하지 않습니다. 최신 shared가 병합된 뒤에는 `node shared/test.mjs`도 직접 실행할 수 있습니다.

퇴근 화면만 살피려면 `python3 -m http.server 8080 --directory barista-day`로 열고 `/tests/ending.html`로 접속합니다. `/tests/ending.html?remakes=1`은 15분 지연, `?remakes=9`는 135분 지연 선택을 확인합니다. 이는 완료 상태를 주입한 QA 전용 화면이며 실제 체험 링크가 아닙니다. 저장 시 해당 테스트 origin에 가상 출근 기록이 생깁니다.

## 배포와 데이터

`dist/`를 정적 호스팅의 공개 루트로 배포합니다. 루트의 `dist/` 제외 규칙을 이 폴더의 `.gitignore`에서 해제했습니다. Three.js와 라이선스가 포함되어 외부 CDN은 필요 없습니다. 개인 정보·인증 정보·기존 Sites의 호스팅 설정은 포함하지 않습니다.

완료한 출근 기록만 `localStorage['workday-records-v1']`에 저장합니다. 제조 중 상태는 새로고침하면 초기화됩니다. 통합 지갑은 동일 origin에서만 공유됩니다. 이번 저장소 변경을 기존 공개 사이트에 자동 배포하지는 않았습니다.

## 선생님께 기록 보내기

저장한 기록이 있으면 시작 화면에 **선생님께 출근 기록 보내기**가 나타납니다. 퇴근 화면에서는 현재 하루의 기록 저장에 성공한 뒤 나타납니다. 3D 없는 터치 모드에서도 사용할 수 있습니다.

번호나 이름을 적고 코드를 만든 뒤 복사하여 선생님이 지정한 곳에 직접 붙여 넣습니다. 같은 기기·origin의 병원과 바리스타 기록 전체가 포함됩니다. 번호나 이름은 코드에만 들어가며 앱 저장소에 저장하지 않습니다. 창을 닫으면 입력과 코드를 제거합니다. 자동 전송·서버 업로드는 없습니다. 복사가 거부되면 선택된 코드에서 직접 복사합니다.

교사 쪽 가져오기/CSV 화면은 career-day에 있으며 여기에는 학생 보내기 화면만 있습니다.


## 통합 화면 배치 (2026-11-16)

`codex/fire-station`에서 카페를 공통 화면 배치에 맞췄습니다. 모바일은 위 3D(기본 45dvh, 직접 작업·크게 보기 56dvh), 아래 스크롤 할 일 칸입니다. PC(800px 이상)는 왼쪽 3D와 오른쪽 40%·최소 400px의 할 일 칸입니다. 제조·결제·정리·세척의 카메라와 물체 라벨도 실제 캔버스 크기를 기준으로 계산합니다. 바닥 터치와 업무 버튼으로 이동하며, 확대 버튼과 창 크기 변경에도 화면이 다시 맞춰집니다.

새 직업 분담 제안은 BOARD.md에 있습니다. 사용자 결정으로 Codex가 우주항공공학을 맡습니다. 기존 소방관 후속 개선은 Claude에게 인수를 요청했으며 아직 답변 대기입니다.


## 현재 사용자 기록과 검사 기준 (2026-11-16)

시작 시 `needsWhoCheck()`에 따라 기록 주인을 확인합니다. 새 사람으로 시작하면 이전 기록을 삭제하지 않고 숨깁니다. 3D/터치 모드 모두 적용하며, 지갑·내보내기는 `loadMine()`만 사용합니다. 지갑은 직업 수와 근무 시간을 앞에, 받은 일당을 작게 표시합니다. 다른 탭에서 사용자가 바뀌면 기존 하루의 저장 및 이미 만든 코드 복사를 막습니다.

공통 계약 검사는 `origin/main`에 shared/test.mjs가 있으면 main을 사용하고, 없으면 Claude 원격 브랜치, 마지막으로 현재 HEAD를 사용합니다. 기준 ref를 검사 출력에 표시합니다. 시작 전 원격을 fetch하세요. main만 있고 Claude 브랜치가 없는 임시 저장소에서도 검사 통과를 확인했습니다.

작업 시작 시 원격 `claude/focused-davinci-c033wr:shared/STATUS.md`부터 읽습니다. 현황판 수정은 Claude 담당입니다. 현재 구현은 `codex/aerospace-day`에 모여 있으므로 오래된 codex/barista-day만 보고 누락으로 판단하지 않도록 게시판에 알렸습니다.
