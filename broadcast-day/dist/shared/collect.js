// 교사 기록 모으기 (서버 없이): 학생 기기의 출근 기록을 짧은 코드로 바꾸고, 교사 화면에서 다시 푼다.
// 두 앱(오늘, 출근합니다 · 한 잔의 하루)이 같이 쓴다. 화면은 모르고 글자만 다룬다.
//
// 코드 모양:  WD1.<본문>.<검사 글자 4개>
//   본문은 { n: 번호나 이름, r: [기록 줄...] } 을 JSON 으로 만들어 base64url 로 바꾼 것
//   기록 줄: [id, app, date, jobId, jobName, payTotal, endingName, likeLabel, likeType, hardLabel, hardType]
// - 번호나 이름은 내보낼 때만 적고 기기에는 남기지 않는다.
// - 일당 말고 다른 돈(가게 매출 등)과 시각 같은 자세한 기록은 넣지 않는다.

export const CODE_PREFIX = 'WD1';
const NAME_MAX = 20;

function b64urlEncode(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = ''; for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
// 옮겨 적다 글자가 빠지거나 바뀌면 알아채는 검사 글자
function check(s) {
  let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36).padStart(4, '0').slice(-4);
}

const clean = (t, max = 60) => String(t ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

// 학생 쪽: 기록 목록 → 코드 한 줄
export function encodeRecords(records, name = '') {
  const rows = records.map((r) => [
    clean(r.id, 40), clean(r.app, 20), clean(r.date, 10), clean(r.job?.id, 30), clean(r.job?.name, 30),
    Math.round(r.pay?.total || 0), clean(r.ending?.name, 40),
    clean(r.like?.label, 60), r.like?.type || null, clean(r.hard?.label, 60), r.hard?.type || null,
  ]);
  const body = b64urlEncode(JSON.stringify({ n: clean(name, NAME_MAX), r: rows }));
  return `${CODE_PREFIX}.${body}.${check(body)}`;
}

// 교사 쪽: 붙여 넣은 글에서 코드를 모두 찾아 푼다. 고장 난 코드는 errors 로 알려 준다.
export function decodeCodes(text) {
  const found = String(text || '').match(/WD1\.[A-Za-z0-9_-]+\.[a-z0-9]{4}/g) || [];
  const students = [], errors = [];
  for (const code of found) {
    const [, body, sum] = code.split('.');
    if (check(body) !== sum) { errors.push({ code, why: '글자가 빠졌거나 바뀌었어요' }); continue; }
    try {
      const o = JSON.parse(b64urlDecode(body));
      if (!Array.isArray(o.r)) throw new Error('rows');
      students.push({
        name: clean(o.n, NAME_MAX),
        records: o.r.filter((x) => Array.isArray(x) && x.length >= 11).map((x) => ({
          id: x[0], app: x[1], date: x[2], jobId: x[3], jobName: x[4], pay: Number(x[5]) || 0, ending: x[6],
          like: x[7], likeType: x[8], hard: x[9], hardType: x[10],
        })),
      });
    } catch { errors.push({ code, why: '풀 수 없는 코드예요' }); }
  }
  return { students, errors, foundAny: found.length > 0 };
}

// 교사 쪽: 모은 줄 → CSV (엑셀에서 한글이 깨지지 않게 BOM 을 붙인다)
export function toCsv(rows) {
  const head = ['번호나 이름', '날짜', '앱', '직업', '일당(세전)', '퇴근길', '끌린 순간', '끌린 유형', '버거운 순간', '버거운 유형'];
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) => [r.name, r.date, r.app, r.jobName, r.pay, r.ending, r.like, r.likeType, r.hard, r.hardType].map(q).join(','));
  return '﻿' + [head.map(q).join(','), ...lines].join('\r\n');
}
