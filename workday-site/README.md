# 직업체험 사이트 (Vercel)

두 앱을 한 주소에 올려서, 지갑(누적 일당)과 출근 기록을 함께 쓰게 하는 폴더예요.

```
/              첫 화면: 일터 고르기, 지갑, 선생님께 보내기, 선생님용 기록 모으기 (hub.html)
/career-day/   오늘, 출근합니다 (모아 병원 여덟 직업)
/barista-day/  한 잔의 하루 (카페 바리스타)
```

Vercel은 빌드하지 않고 `public/` 을 그대로 올려요. 그래서 **앱을 고친 뒤에는 꼭 다시 묶어서** 함께 커밋해요.

```bash
cd career-day && npm run build && cd ..   # 병원 앱을 고쳤다면
node workday-site/build.mjs               # public/ 다시 묶기
node workday-site/build.mjs --check       # 묶은 것이 소스와 같은지 확인
```

## Vercel에 처음 올리기 (선생님이 한 번)

1. vercel.com 에 로그인하고 **Add New… → Project** 를 눌러요.
2. **Import Git Repository** 에서 `shineonyou1274/ai-ethics-court` 를 골라 **Import** 해요.
   - 목록에 없으면 **Adjust GitHub App Permissions** 에서 이 저장소를 허용해요.
3. 설정 화면에서
   - **Project Name**: 주소가 될 이름이에요. 예: `oneul-chulgeun` → `oneul-chulgeun.vercel.app`
   - **Framework Preset**: `Other`
   - **Root Directory**: **Edit** 를 눌러 `workday-site` 를 골라요. (이게 가장 중요해요)
   - Build and Output Settings 는 그대로 두세요. `vercel.json` 이 정해 줘요.
4. **Deploy** 를 눌러요.

### 지금 상태 (2026-11-16)

- Production Branch: `claude/focused-davinci-c033wr` → 운영 주소 `https://project-o71se.vercel.app/`
- `oneul-chulgeun.vercel.app` 은 아직 연결 전이에요(`DEPLOYMENT_NOT_FOUND`).
- PR을 합친 뒤: Production Branch를 `main` 으로 되돌리고, Settings → Domains 에 `oneul-chulgeun.vercel.app` 을 붙여요.

### 어느 브랜치를 올릴지

Vercel은 처음에 저장소의 기본 브랜치(`main`)를 올려요. 직업체험 작업은 아직 `claude/focused-davinci-c033wr` 에 있어서, 둘 중 하나를 해요.

- **가) main에 합치기**: 작업 브랜치를 `main` 에 합치면(Pull Request), 그 뒤로는 `main` 에 올릴 때마다 사이트가 바뀌어요. 가장 깔끔해요.
- **나) 작업 브랜치를 바로 올리기**: 프로젝트의 **Settings → Git → Production Branch** 를 `claude/focused-davinci-c033wr` 로 바꾸고, **Deployments** 에서 **Redeploy** 해요.

## 지키는 것

- 기존 AI 윤리 법정 앱과 설정은 건드리지 않아요. 이 사이트는 `workday-site/` 만 봐요.
- 서버나 데이터베이스가 없어요. 출근 기록은 학생 기기에, 교사가 모은 기록은 교사 기기에만 남아요.
