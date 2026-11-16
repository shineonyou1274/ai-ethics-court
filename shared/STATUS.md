# 직업체험 시리즈 현황판

> **일을 시작하기 전에 이 파일부터 읽어요.** 지금 상태를 한 장으로 적은 것이고, Claude가 늘 최신으로 고쳐 써요.
> 자세한 사정과 주고받은 말은 게시판에 있어요: `shared/BOARD.md`(Claude) · `barista-day/BOARD.md`(Codex)
> 마지막 고침: 2026-11-16 밤 · 운영 브랜치 `claude/focused-davinci-c033wr` = 통합 브랜치 `claude/integrate-fire` (우주항공·바리스타 16~19 운영 반영)

## 1. 무엇을 만들고 있나

여러 일터에 하루씩 출근해 직접 일하고, 퇴근하면 실제 통계로 계산한 **일당**을 받고, 마음에 남은 순간으로 **나의 흥미**를 돌아보는 진로 체험 시리즈예요. 창업 체험이 아니라 **직업 선택**을 위한 체험이에요.

## 2. 지금 있는 것

| 일터 | 폴더 | 맡은 쪽 | 상태 |
|---|---|---|---|
| 모아 병원 (8직업) | `career-day/` | Claude | 완성, 운영 중 |
| 다솜 소방서 (소방관) | `career-day/` 안의 일터 `fire-station`, 직업 `firefighter` | Claude(새 대화) | 운영 중. **출동 현장 불 끄기 장면을 넣기로 결정**(새 대화에서 다듬는 중) |
| 카페 바리스타 | `barista-day/` | Codex | 8~19번 운영 중 |
| 온빛 항공우주 설계실 (항공우주공학기술자) | `aerospace-day/` (게시판 `aerospace-day/BOARD.md`) | Codex | 만듦. 설계·시험·바람 영향, 세션·보내기. 운영 중. 일터 색 `#5965ac` |
| 공통 약속 | `shared/` | Claude | 일당·기록·세션·교사 코드·디자인 |
| 사이트 | `workday-site/` | Claude | 운영 중. 입구 넷, 도장 11칸 |

- **Codex 판 소방서(`codex/fire-station` 의 `fire-station/`)는 쓰지 않아요.** 브랜치는 참고용으로 남겨요. 그 판의 좋은 점(바닥 눌러 걸어 다니기, 차량 점검)은 나중에 `career-day` 엔진으로 옮길 수 있어요.
- 소방관 기록은 `place: 'fire-station'`, `job.id: 'firefighter'`, 커리어넷 385예요.

### 운영 반영

- 2026-11-16 선생님 승인으로 운영 브랜치를 통합 브랜치(소방서 Claude 판 + 바리스타 8~15번)로 옮겼어요.
- 2026-11-16 선생님 승인으로 우주항공과 바리스타 16~19번도 운영에 올렸어요. 첫 화면 입구 넷이 모두 열려 있어요.
- 앞으로도 운영 브랜치에는 **선생님 승인 뒤에만** 올려요. 새 작업은 다른 브랜치에서 하고 미리 확인해요.

## 3. 꼭 읽을 문서

0. `shared/CHECKLIST.md` — **끝났다고 하기 전에 통과해야 할 검증 조건** (깜박임 재기: `node shared/tools/flicker.cjs <영상>`)
1. `shared/README.md` — 일당, 돌아보기, 출근 기록, 기기를 함께 쓸 때(§3-0), 교사 기록 모으기(§3-1)
2. `shared/DESIGN.md` — 색·글꼴, 화면 위쪽 띠, 하루의 순서, 손맛, 말투, **새 일터 체크 목록(§7)**
3. 맡은 앱의 README와 게시판

## 4. 남은 요청 (번호는 `shared/BOARD.md`의 번호)

**Codex — 바리스타** (통합 브랜치에서 갈라져 시작)
- [x] 8~15 — 통합 브랜치에 합침
- [x] 16~19 — 통합 브랜치에 합침(`codex/aerospace-integration`)

**Codex — 우주항공**
- [x] `aerospace-day/` 새 앱 — 통합 브랜치에 합침
- [ ] (바람) 사람 모양을 `career-day/src/world/kit.js` 의 `person()` 에 맞추기(DESIGN.md §1)

**Claude — 정리할 것**
- [x] 소방서 판 결정(Claude 판) → 통합 브랜치에 합침
- [x] 선생님 승인 뒤 운영 브랜치를 통합 브랜치로 앞당기기
- [x] 우주항공 첫 화면 링크·도장 칸·묶기(Codex가 함), 복사본 검사 등록(Claude)
- [x] 선생님 승인 뒤 운영 브랜치를 통합 브랜치로 앞당기기 (우주항공 + 바리스타 16~19) — 2026-11-16 운영 반영, 폰·PC 확인
- [ ] 소방서: 선생님이 **출동 현장 불 끄기 장면(`f57b89d`)을 넣기로** 정함. 새 대화가 안전 한 줄, 더 실감나는 물·불, 깜박임 점검을 더한 뒤 합침 (게시판 2026-11-16 글)
- [x] 소방서: 체크리스트 A·B 필수 통과(두 바퀴), 통합 브랜치에 합침 — 운영 반영 승인 대기
- [ ] Codex: 바리스타·우주항공 채점 결과의 필수 실패 고치기 (게시판 2026-11-16 "Codex에게" 글)
- [ ] Codex 요청: 새 폴더(`fire-station/`, `aerospace-day/`)와 그 게시판을 협업 약속에 등록, `shared/test.mjs` 복사본 검사에 더하기

**선생님**
- [ ] PR [#5](https://github.com/shineonyou1274/ai-ethics-court/pull/5) 합치기 — **선생님이 정해요. 지시가 있을 때까지 아무도 합치지 않아요.**
- [ ] 합친 뒤 Vercel: Production Branch를 `main` 으로 되돌리고, `oneul-chulgeun.vercel.app` 도메인을 프로젝트에 붙이기 (§7)

**Codex — 합치기 전에**
- [ ] 19 `barista-day/tests/shared-contract.mjs` 가 `origin/claude/focused-davinci-c033wr` 를 직접 읽어요. 합친 뒤 그 브랜치를 지우면 깨지니 `origin/main` 기준으로 바꿔 주세요. (`main` 에 `shared/` 가 아직 없을 때는 지금 브랜치로 대신 읽게)

## 5. 브랜치와 합치기

| 쪽 | 일하는 브랜치 | 시작점 |
|---|---|---|
| Claude (병원, 공통, 사이트) | `claude/focused-davinci-c033wr` | — |
| Codex (바리스타) | `codex/barista-day` | Claude 브랜치 최신에서 다시 갈라져 시작 |
| Codex (소방서 판, 바리스타 8~15) | `codex/fire-station` | 0d34862 (세션 기능 전) |
| Codex (우주항공) | `codex/aerospace-day` (제안) | Claude 브랜치 최신 |
| Claude 새 대화 (소방서 판) | `claude/confident-turing-yq0roj` | a3523fa |

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
- **지금 운영 주소는 `https://project-o71se.vercel.app/`** 예요. Production Branch가 PR 브랜치(`claude/focused-davinci-c033wr`)로 되어 있어서, 이 브랜치에 올리면 바로 바뀌어요.
- `oneul-chulgeun.vercel.app` 은 아직 프로젝트에 연결되지 않은 도메인이에요(`DEPLOYMENT_NOT_FOUND`). 학생에게 아직 알리지 않아요.
- PR #5를 합친 뒤 할 일 (선생님, Vercel에서):
  1. Settings → Git → **Production Branch** 를 `main` 으로 되돌리기
  2. Settings → Domains 에서 **`oneul-chulgeun.vercel.app` 붙이기**
  3. 새 주소로 열리는지 Claude가 폰·PC로 확인
- 어느 앱이든 고친 뒤에는 `node workday-site/build.mjs` → `--check` 로 묶은 사이트가 소스와 같은지 확인해요.

## 8. 검사 한 번에

```bash
node shared/test.mjs
(cd career-day && npm test)
for t in barista-day/tests/*.mjs; do node "$t"; done
node workday-site/build.mjs --check
```
