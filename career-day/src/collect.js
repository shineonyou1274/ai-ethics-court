// 교사 기록 모으기 화면 (서버 없이). 코드 만들기와 풀기는 shared/collect.js 가 한다.
//  - 학생: 출근 기록을 코드 한 줄로 만들어 복사한다. 번호나 이름은 이때만 적고 기기에 남기지 않는다.
//  - 교사: 받은 코드를 붙여 넣으면 표와 요약, CSV 가 나온다. 모은 기록은 교사 기기에만 남는다.
import { encodeRecords, decodeCodes, toCsv } from '../../shared/collect.js';
import { RIASEC, won } from '../../shared/workday.js';

const TEACHER_KEY = 'workday-teacher-v1';
const T = ['R', 'I', 'A', 'S', 'E', 'C'];
const keyOf = (r) => `${r.name}|${r.id || `${r.date}|${r.jobId}|${r.like}`}`;
const loadRows = () => { try { const a = JSON.parse(localStorage.getItem(TEACHER_KEY)); return Array.isArray(a) ? a : []; } catch { return []; } };
const saveRows = (rows) => { try { localStorage.setItem(TEACHER_KEY, JSON.stringify(rows)); return true; } catch { return false; } };

async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* 아래로 */ }
  try { const t = document.createElement('textarea'); t.value = text; document.body.append(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok; } catch { return false; }
}

// ── 학생: 선생님께 보내기 ──
export function sendView({ view, $, esc, records, back }) {
  if (!records.length) {
    view(`<h2>선생님께 출근 기록 보내기</h2><div class="bubble">아직 남긴 출근 기록이 없어요. 하루를 마치고 '출근 기록에 남기기'를 누르면 여기서 보낼 수 있어요.</div><button class="btn ghost" id="back">돌아가기</button>`);
    $('#back').onclick = back; return;
  }
  view(`
    <p class="eyebrow">출근 기록 ${records.length}개</p>
    <h2>선생님께 출근 기록 보내기</h2>
    <div class="bubble"><ol class="path">${records.map((r) => `<li>${esc(r.job?.name)} <span>· ${esc(r.date)} · ${won(r.pay?.total || 0)} · 💛 ${esc(r.like?.label)}</span></li>`).join('')}</ol></div>
    <label class="field"><b class="jua">번호나 이름</b><input id="who" maxlength="20" autocomplete="off" placeholder="예: 12번, 또는 선생님이 정한 별명"></label>
    <p class="fine">코드를 만들 때만 쓰고, 이 기기에는 남기지 않아요.</p>
    <button class="btn" id="make">코드 만들기</button>
    <div id="codeOut"></div>
    <button class="btn ghost" id="back">돌아가기</button>`);
  $('#back').onclick = back;
  $('#make').onclick = () => {
    const who = $('#who').value.trim();
    if (!who) { $('#who').focus(); $('#who').classList.add('need'); return; }
    const code = encodeRecords(records, who);
    $('#codeOut').innerHTML = `<div class="bubble code"><b class="jua">내 출근 기록 코드</b>
      <textarea id="code" readonly rows="4">${esc(code)}</textarea>
      <div class="twin"><button class="btn" id="cp">복사하기</button>${navigator.share ? '<button class="btn ghost" id="sh">보내기</button>' : '<span></span>'}</div>
      <p class="fine">복사한 코드를 선생님이 알려 준 곳(학급 게시판, 메신저 등)에 붙여 넣어 보내요. 코드에는 직업, 날짜, 일당, 고른 순간만 들어 있어요.</p></div>`;
    $('#cp').onclick = async () => { const ok = await copy(code); $('#cp').textContent = ok ? '복사했어요 ✓' : '길게 눌러 직접 복사해요'; if (!ok) { $('#code').focus(); $('#code').select(); } };
    $('#sh')?.addEventListener('click', () => navigator.share({ text: code }).catch(() => {}));
    $('#codeOut').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
}

// ── 교사: 기록 모으기 ──
export function teacherView({ view, $, esc, back }) {
  let rows = loadRows();
  const bars = (counts, total, label) => Object.entries(counts).map(([k, n]) => `<div class="bar"><span>${label(k)}</span><i style="--w:${total ? Math.round(n / total * 100) : 0}%"></i><b>${n}</b></div>`).join('');

  function render(msg = '') {
    const people = [...new Set(rows.map((r) => r.name))];
    const jobs = {}; for (const r of rows) jobs[r.jobName] = (jobs[r.jobName] || 0) + 1;
    const like = Object.fromEntries(T.map((t) => [t, 0])), hard = Object.fromEntries(T.map((t) => [t, 0]));
    for (const r of rows) { if (like[r.likeType] !== undefined) like[r.likeType]++; if (hard[r.hardType] !== undefined) hard[r.hardType]++; }
    const byPerson = people.map((p) => { const mine = rows.filter((r) => r.name === p); return { p, mine }; });
    view(`
      <p class="eyebrow">선생님용</p>
      <h2>출근 기록 모으기</h2>
      <p class="fine">학생이 보낸 코드를 아래에 붙여 넣어요. 여러 개를 한꺼번에 붙여 넣어도 돼요. 모은 기록은 이 기기의 이 화면에만 남고 어디로도 보내지 않아요.</p>
      <textarea id="paste" rows="4" placeholder="WD1.로 시작하는 코드를 붙여 넣어요"></textarea>
      <button class="btn" id="add">더하기</button>
      ${msg ? `<div class="reply" role="status">${msg}</div>` : ''}
      ${rows.length ? `
      <div class="stats"><div><b>${people.length}</b><small>학생</small></div><div><b>${rows.length}</b><small>출근 기록</small></div><div><b>${Object.keys(jobs).length}</b><small>다녀온 직업</small></div></div>
      <div class="bubble"><b class="jua">직업별로 다녀온 횟수</b>${bars(Object.fromEntries(Object.entries(jobs).sort((a, b) => b[1] - a[1])), rows.length, esc)}</div>
      <div class="bubble"><b class="jua">💛 끌린 순간의 흥미 유형</b>${bars(like, rows.length, (t) => RIASEC[t].name)}
        <b class="jua" style="display:block;margin-top:10px">🪨 버거운 순간의 흥미 유형</b>${bars(hard, rows.length, (t) => RIASEC[t].name)}
        <p class="fine">고른 순간이 어느 쪽 일이었는지 센 것이에요. 학생의 적성을 판정하는 숫자가 아니에요.</p></div>
      <div class="bubble"><b class="jua">학생별</b>
        <table class="roster"><thead><tr><th>번호나 이름</th><th>출근</th><th>다녀온 직업</th><th>💛 끌린 유형</th></tr></thead><tbody>
        ${byPerson.map(({ p, mine }) => `<tr><td>${esc(p)}</td><td>${mine.length}</td><td>${esc([...new Set(mine.map((r) => r.jobName))].join(', '))}</td><td>${esc(mine.map((r) => RIASEC[r.likeType]?.name).filter(Boolean).join(', '))}</td></tr>`).join('')}
        </tbody></table></div>
      <details class="bubble"><summary class="jua">기록 하나하나 보기 (${rows.length})</summary>
        <table class="roster"><thead><tr><th>이름</th><th>날짜</th><th>직업</th><th>일당</th><th>퇴근길</th><th>💛 끌린 순간</th><th>🪨 버거운 순간</th></tr></thead><tbody>
        ${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.date)}</td><td>${esc(r.jobName)}</td><td>${won(r.pay)}</td><td>${esc(r.ending)}</td><td>${esc(r.like)}</td><td>${esc(r.hard)}</td></tr>`).join('')}
        </tbody></table></details>
      <div class="twin"><button class="btn" id="csv">CSV 내려받기</button><button class="btn ghost" id="clear">모두 지우기</button></div>
      <p class="fine">일당은 직업마다 조사한 사람 수가 적은 자료로 계산했어요. 직업끼리 견주거나 순위를 매기는 데 쓰지 말아 주세요.</p>` : ''}
      <button class="btn ghost" id="back">돌아가기</button>`);
    $('#back').onclick = back;
    $('#add').onclick = () => {
      const { students, errors, foundAny } = decodeCodes($('#paste').value);
      if (!foundAny) return render('코드를 찾지 못했어요. WD1.로 시작하는 코드를 통째로 붙여 넣어 주세요.');
      const have = new Set(rows.map(keyOf)); let added = 0, skipped = 0;
      for (const s of students) for (const r of s.records) { const row = { ...r, name: s.name }; if (have.has(keyOf(row))) { skipped++; continue; } have.add(keyOf(row)); rows.push(row); added++; }
      const stored = saveRows(rows);
      render([`학생 ${students.length}명의 기록 ${added}개를 더했어요.`, skipped ? `이미 있던 ${skipped}개는 건너뛰었어요.` : '', errors.length ? `고장 난 코드 ${errors.length}개는 다시 받아 주세요.` : '', stored ? '' : '이 기기에는 저장하지 못했어요. 화면을 닫기 전에 CSV로 내려받아 주세요.'].filter(Boolean).join(' '));
    };
    $('#csv')?.addEventListener('click', () => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
      a.download = `workday-records-${new Date().toISOString().slice(0, 10)}.csv`; /* 한글 파일 이름은 일부 브라우저에서 무시되어 영문으로 */ document.body.append(a); a.click(); a.remove();
    });
    $('#clear')?.addEventListener('click', () => { if (confirm('모은 기록을 모두 지울까요? 지우기 전에 CSV로 내려받아 두면 좋아요.')) { rows = []; saveRows(rows); render('모두 지웠어요.'); } });
  }
  render();
}
