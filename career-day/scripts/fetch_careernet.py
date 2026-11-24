"""커리어넷 직업 목록과 상세(임금·하는 일 등)를 받아 jobs_raw.json으로 저장한다. 끊기면 다시 시도한다."""
import json, subprocess, time, os, sys

BODY = '{"keyword":"","mode":"","searchGubun":"","selectedtab1":[],"selectedtab22":[],"selectedtab3_wage":[],"selectedtab3_wlb":[],"selectedtab3_social":[],"selectedtab4":[]}'


def get(args, tries=5):
    for i in range(tries):
        r = subprocess.run(['curl', '-sS', '-m', '60'] + args, capture_output=True, text=True)
        try:
            return json.loads(r.stdout)
        except Exception:
            time.sleep(2 + i * 2)
    raise RuntimeError('failed: ' + ' '.join(args))


lst = []
for p in range(3):
    d = get(['-X', 'POST', '-H', 'Content-Type: application/json',
             f'https://www.career.go.kr/cloud/api/job/search?size=200&page={p}&sort=reg_dt,desc', '-d', BODY])
    lst += d['content']
print('list', len(lst), flush=True)
json.dump(lst, open('joblist_all.json', 'w'), ensure_ascii=False)

out_path = 'jobs_raw.json'
done = json.load(open(out_path)) if os.path.exists(out_path) else {}
keep = ['job_cd', 'job_nm', 'aptit_name', 'wage', 'wage_source', 'satisfication', 'satisfi_source', 'wlb', 'social',
        'wage_level', 'std_job_nm', 'emp_job_nm', 'rel_job_nm', 'tag', 'jobWorkList', 'jobAbilityList',
        'jobInterestList', 'jobAptitudeList', 'jobEnvironmentList', 'jobKnowList', 'jobDepartList']
for i, j in enumerate(lst):
    cd = str(j['job_cd'])
    if cd in done:
        continue
    d = get([f'https://www.career.go.kr/cloud/api/job/view?seq={cd}'])
    done[cd] = {k: d.get(k) for k in keep}
    if i % 25 == 0:
        json.dump(done, open(out_path, 'w'), ensure_ascii=False)
        print(i, flush=True)
    time.sleep(0.25)
json.dump(done, open(out_path, 'w'), ensure_ascii=False)
print('done', len(done))
