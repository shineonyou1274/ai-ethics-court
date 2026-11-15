// 직업체험 사이트 묶기: 두 앱과 첫 화면을 public/ 에 모은다. Vercel 은 이 public/ 을 그대로 올린다.
//   node workday-site/build.mjs          public/ 을 새로 만든다
//   node workday-site/build.mjs --check  public/ 이 지금 소스와 같은지만 본다 (다르면 실패)
//
// public/
//   index.html                첫 화면 (hub.html)
//   shared/*.js, *.css        공통 약속과 디자인 (첫 화면이 지갑을 읽고 디자인을 쓴다)
//   career-day/index.html     오늘, 출근합니다 (career-day/career-day.html, 빌드된 한 파일)
//   barista-day/…             한 잔의 하루 (barista-day/dist 그대로)
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const out = join(here, 'public');
const check = process.argv.includes('--check');

// 무엇을 어디에 둘지: [원본, public 안의 자리]
const plan = [
  [join(here, 'hub.html'), 'index.html'],
  [join(root, 'career-day/career-day.html'), 'career-day/index.html'],
];
for (const f of readdirSync(join(root, 'shared'))) if (/\.(js|css)$/.test(f)) plan.push([join(root, 'shared', f), `shared/${f}`]);
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p); else plan.push([p, `barista-day/${relative(join(root, 'barista-day/dist'), p)}`]);
  }
})(join(root, 'barista-day/dist'));

if (check) {
  const want = new Set(plan.map(([, to]) => to));
  const have = [];
  (function walk(dir) { if (!existsSync(dir)) return; for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else have.push(relative(out, p)); } })(out);
  const stale = plan.filter(([from, to]) => !existsSync(join(out, to)) || !readFileSync(from).equals(readFileSync(join(out, to)))).map(([, to]) => to);
  const extra = have.filter((f) => !want.has(f));
  if (stale.length || extra.length) {
    console.log(`✗ workday-site/public 이 소스와 달라요. node workday-site/build.mjs 를 실행해 주세요.`);
    for (const f of stale) console.log('  바뀜: ' + f);
    for (const f of extra) console.log('  남은 파일: ' + f);
    process.exit(1);
  }
  console.log(`✓ workday-site/public 이 소스와 같아요 (${plan.length}개 파일)`);
} else {
  rmSync(out, { recursive: true, force: true });
  for (const [from, to] of plan) { mkdirSync(dirname(join(out, to)), { recursive: true }); writeFileSync(join(out, to), readFileSync(from)); }
  console.log(`✓ workday-site/public 을 만들었어요 (${plan.length}개 파일)`);
}
