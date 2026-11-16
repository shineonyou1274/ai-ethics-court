# 직업체험 시리즈 현황판

> **일을 시작하기 전에 이 파일부터 읽어요.** 지금 상태를 한 장으로 적은 것이고, Claude가 늘 최신으로 고쳐 써요.
> 자세한 사정과 주고받은 말은 게시판에 있어요: `shared/BOARD.md`(Claude) · `barista-day/BOARD.md`(Codex)
> 마지막 고침: 2026-11-16 · 기준 커밋 `7e9b724` (`claude/focused-davinci-c033wr`)

## 1. 무엇을 만들고 있나

여러 일터에 하루씩 출근해 직접 일하고, 퇴근하면 실제 통계로 계산한 **일당**을 받고, 마음에 남은 순간으로 **나의 흥미**를 돌아보는 진로 체험 시리즈예요. 창업 체험이 아니라 **직업 선택**을 위한 체험이에요.

## 2. 지금 있는 것

| 일터 | 폴더 | 맡은 쪽 | 상태 |
|---|---|---|---|
| 모아 병원 (8직업) | `career-day/` | Claude | 완성. 직업마다 판단 + 손으로 하는 장면, 교사 기록 모으기, 도장 카드 |
| 카페 바리스타 | `barista-day/` | Codex | v16. 공통 약속 반영됨. **디자인 맞추기·세션은 아직**(아래 4) |
| 소방서 (소방관) | (만들 예정) | Claude 새 대화 | 시작 전 |
| 우주항공 (항공우주공학기술자) | (만들 예정) | Codex | 시작 전 |
| 공통 약속 | `shared/` | Claude | 일당·기록·세션·교사 코드·디자인 |
| 사이트 | `workday-site/` | Claude | 첫 화면 + 묶기. Vercel 프로젝트 `oneul-chulgeun` |

## 3. 꼭 읽을 문서

1. `shared/README.md` — 일당, 돌아보기, 출근 기록, 기기를 함께 쓸 때(§3-0), 교사 기록 모으기(§3-1)
2. `shared/DESIGN.md` — 색·글꼴, 화면 위쪽 띠, 하루의 순서, 손맛, 말투, **새 일터 체크 목록(§7)**
3. 맡은 앱의 README와 게시판

## 4. 남은 요청 (번호는 `shared/BOARD.md`의 번호)

**Codex — 바리스타**
- [ ] 8 "← 다른 일터 고르기"(`../`) — 사이트 안에서만
- [ ] 9 고친 뒤 `node workday-site/build.mjs` 로 다시 묶어 함께 커밋
- [ ] 10 `shared/design.css` 복사, 토큰 쓰기 (카페 색 `#2f6b55`)
- [ ] 11 글꼴: 주아 + 고운돋움
- [ ] 12 위쪽 띠에서 "가상 매출"을 빼고 `바리스타 · 시각` / `🪙 오늘 번 일당`
- [ ] 13 명찰 화면: 하는 일, 근무 시간, 시급 11,980원
- [ ] 14 (바람) 영어 머리말을 한국어로
- [ ] 16 지갑·보내기는 `loadMine()`
- [ ] 17 시작할 때 `needsWhoCheck()` → "누구의 기록인가요?"
- [ ] 18 (바람) 지갑은 `walletSummary()` 모양

**선생님**
- [ ] PR [#5](https://github.com/shineonyou1274/ai-ethics-court/pull/5)를 `main`에 합치기 → `oneul-chulgeun.vercel.app`에 사이트가 열려요(지금은 404)

## 5. 브랜치와 합치기

| 쪽 | 일하는 브랜치 | 시작점 |
|---|---|---|
| Claude (병원, 공통, 사이트) | `claude/focused-davinci-c033wr` | — |
| Codex (바리스타) | `codex/barista-day` | Claude 브랜치 최신에서 다시 갈라져 시작 |
| Codex (우주항공) | `codex/aerospace-day` (제안) | Claude 브랜치 최신 |
| Claude 새 대화 (소방서) | 새 대화의 브랜치 | Claude 브랜치 최신 |

- **남의 폴더는 고치지 않아요.** 폴더가 다르면 합칠 때 충돌이 없어요.
- `shared/` 와 `workday-site/` 는 Claude가 고쳐요. 바꾸고 싶은 게 있으면 게시판에 적어요.
- 앱 안의 공통 파일 복사본(`dist/shared/*`)은 원본과 바이트까지 같아야 해요. 검사: `node shared/test.mjs`
- 합칠 시점은 선생님이 정해요. 합친 뒤에는 이 현황판의 기준 커밋을 고쳐요.

## 6. 새 일터를 만들 때 (소방서, 우주항공)

- **소방서 (Claude 새 대화)**: `career-day/` 엔진을 그대로 써요. 새 일터를 `career-day/src/places/`에, 직업을 `career-day/src/jobs/`에 더해요(`_hospital-day.js` 처럼 일터의 하루 틀을 하나 만들어요). 불 끄기는 3D 가까이 보기(`career-day/src/world/closeup.js`)로 만들어요. 일당 자료: 커리어넷 385 소방관, 연 4,000만 원(2021).
  - **주의**: 병원 앱과 같은 폴더라서, 소방서를 만드는 동안 다른 대화에서는 `career-day/` 를 고치지 않아요.
- **우주항공 (Codex)**: 새 폴더 `aerospace-day/` 에 바리스타처럼 독립 앱으로 만들어요. 일당 자료: 커리어넷 151 항공우주공학기술자, 연 5,450만 원(2021, 항공공학기술자 기준).
  - 공통 파일은 `aerospace-day/dist/shared/` 로 복사해요. 테스트 복사본 목록에 넣고 싶으면 게시판에 적어요. Claude가 `shared/test.mjs` 에 더해요.
- 둘 다 DESIGN.md §7 체크 목록을 지켜요. 다 되면 Claude가 사이트 첫 화면 입구, 도장 카드 칸, `build.mjs` 묶기에 더해요.
- 진로 체험 원칙: 적성 판정이나 직업 순위를 내지 않아요. 전문 업무를 정답처럼 가르치지 않아요. 등장인물은 가상이에요.

## 7. 배포

- Vercel 프로젝트 `oneul-chulgeun` · Root Directory `workday-site` · 빌드 없이 `public/` 을 올려요.
- 지금 `main`을 올려요. PR #5를 합치면 `oneul-chulgeun.vercel.app`에 열려요. PR 미리보기는 `project-o71se.vercel.app`이에요.
- 어느 앱이든 고친 뒤에는 `node workday-site/build.mjs` → `--check` 로 묶은 사이트가 소스와 같은지 확인해요.

## 8. 검사 한 번에

```bash
node shared/test.mjs
(cd career-day && npm test)
for t in barista-day/tests/*.mjs; do node "$t"; done
node workday-site/build.mjs --check
```
