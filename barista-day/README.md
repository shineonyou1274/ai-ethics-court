# 한 잔의 하루 — 바리스타 직업체험

v13 직접 조작 버전에 공통 직업체험 약속 v1을 적용한 협업 버전(v15)입니다. 스마트폰 터치로 주문·결제·커피 제조·정리·퇴근까지 경험합니다. 고정된 3인칭 카메라와 자동 길찾기로 이동 부담을 줄였습니다.

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
node barista-day/tests/career.mjs
node barista-day/tests/fallback.mjs
```

공통 검사는 먼저 `git fetch origin claude/focused-davinci-c033wr`로 받은 최신 Claude 원본·검사를 임시 폴더에서 실행합니다. 브랜치를 합치지 않으며 `shared/`를 수정하지 않습니다. 최신 shared가 병합된 뒤에는 `node shared/test.mjs`도 직접 실행할 수 있습니다.

퇴근 화면만 살피려면 `python3 -m http.server 8080 --directory barista-day`로 열고 `/tests/ending.html`로 접속합니다. `/tests/ending.html?remakes=1`은 15분 지연, `?remakes=9`는 135분 지연 선택을 확인합니다. 이는 완료 상태를 주입한 QA 전용 화면이며 실제 체험 링크가 아닙니다. 저장 시 해당 테스트 origin에 가상 출근 기록이 생깁니다.

## 배포와 데이터

`dist/`를 정적 호스팅의 공개 루트로 배포합니다. 루트의 `dist/` 제외 규칙을 이 폴더의 `.gitignore`에서 해제했습니다. Three.js와 라이선스가 포함되어 외부 CDN은 필요 없습니다. 개인 정보·인증 정보·기존 Sites의 호스팅 설정은 포함하지 않습니다.

완료한 출근 기록만 `localStorage['workday-records-v1']`에 저장합니다. 제조 중 상태는 새로고침하면 초기화됩니다. 통합 지갑은 동일 origin에서만 공유됩니다. 이번 저장소 변경을 기존 공개 사이트에 자동 배포하지는 않았습니다.
