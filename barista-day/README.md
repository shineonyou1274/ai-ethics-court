# 한 잔의 하루 — 바리스타 직업체험 (v11)

스마트폰 터치로 조작하는 Three.js 기반 3D 카페 체험입니다.

## 실행
Python 3이 설치된 컴퓨터에서 압축을 풀고 아래 명령을 실행하세요.

```sh
cd barista-day
python3 -m http.server 8080 --directory dist
```

브라우저에서 http://localhost:8080 을 여세요. ES 모듈을 사용하므로 HTML 파일을 더블클릭하는 대신 로컬 웹 서버로 실행합니다.
스마트폰에서는 같은 네트워크에 있는 컴퓨터의 주소 http://컴퓨터IP:8080 으로 접속하거나, dist 폴더를 정적 웹 호스팅에 게시하세요.

## 구조
- dist/index.html, style.css: 화면과 모바일 UI
- dist/game.js: 3D 카페·캐릭터·이동·손님 흐름
- dist/shift.mjs: 주문·컵 재사용·매출·마감 상태
- dist/workbench.mjs, taste.mjs: 커피 직접 제조와 맛 반응
- dist/cleanup.mjs: 컵 수거와 테이블 문지르기
- dist/washbench.mjs, wash-state.mjs: 컵 세척·헹굼·건조·선반 정리
- dist/vendor/: 함께 제공하는 Three.js와 원본 라이선스

## GitHub에 올리기
새 저장소를 만든 뒤 압축을 푼 폴더 내용을 업로드하세요. Git을 사용하는 경우:

```sh
git init
git add .
git commit -m "Add barista career experience"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

이 ZIP에는 실행 코드와 필요한 라이브러리만 포함되어 있습니다. 배포 계정의 인증 정보, Git 이력, 기존 사이트의 호스팅 식별자는 포함하지 않습니다.
교육용 가상 매출·맛 모델이며 실제 소득이나 적성을 판정하지 않습니다.
