"""jobs_raw.json(커리어넷 직업 상세)을 앱이 쓰는 src/data/careernet.js 로 줄여 만든다.
사용: python3 scripts/fetch_careernet.py   (scripts 폴더에 jobs_raw.json 생성, 30분쯤 걸림)
      python3 scripts/build_careernet.py <jobs_raw.json 경로>
"""
import json, re, sys, datetime

raw = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'jobs_raw.json'))
out = {}
for cd, j in raw.items():
    wage = j.get('wage')
    try:
        wage = int(str(wage).replace(',', '')) if wage else None
    except ValueError:
        wage = None
    src = j.get('wage_source') or ''
    m = re.search(r'자료\s*:\s*([^,]+),\s*([^()]+)\((\d{4})\)', src)
    rel = re.search(r'관련 직업인 (.+?)의 평균연봉', src)
    works = [w.strip() for w in (j.get('jobWorkList') or []) if isinstance(w, str)][:4]
    if not works:
        works = [w.get('work', '').strip() for w in (j.get('jobWorkList') or []) if isinstance(w, dict)][:4]
    out[cd] = {
        'name': j['job_nm'],
        'wage': wage,
        'from': m.group(1).strip() if m else None,
        'basis': (rel.group(1) if rel else (m.group(2).strip() if m else None)),
        'year': int(m.group(3)) if m else None,
        'sat': j.get('satisfication'),
        'works': [w for w in works if w],
        'aptitude': j.get('aptit_name'),
    }
stamp = datetime.date.today().isoformat()
body = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
open('src/data/careernet.js', 'w').write(
    f'// 커리어넷 직업정보에서 가져온 자료 ({stamp} 받음, {len(out)}개 직업). scripts/build_careernet.py 로 다시 만든다.\n'
    '// wage: 평균연봉(중앙값, 만 원) · from/basis/year: 임금 자료의 출처와 기준 직업, 기준 연도 · sat: 직업 만족도(%)\n'
    f'export const CAREERNET = {body};\n')
print(len(out), 'jobs,', sum(1 for v in out.values() if v['wage']), 'with wage')
