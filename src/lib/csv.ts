// M3 — CSV 내보내기 (기획안 §9: UTF-8 BOM, 엑셀 한글 호환)
// P1-1: 학번 등 숫자형 문자열 열은 ="0113" 수식으로 감싸 엑셀의 숫자 변환(앞자리 0 유실)을 차단한다.

function escapeCell(v: string | number): string {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** 엑셀 텍스트 강제 셀 — ="0113" 수식 래핑 (엑셀·구글 시트 모두 문자열로 표시) */
function textCell(v: string | number): string {
  const s = String(v ?? '');
  return '="' + s.replace(/"/g, '""') + '"';
}

/**
 * BOM 포함 UTF-8 CSV를 만들어 브라우저 다운로드를 트리거한다.
 * @param textColumns 앞자리 0을 보존해야 하는 열 인덱스(0-base) — 학번·PIN 등 숫자형 문자열
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  textColumns: number[] = [],
): void {
  const textCols = new Set(textColumns);
  const dataLines = rows.map((r) =>
    r.map((cell, i) => (textCols.has(i) ? escapeCell(textCell(cell)) : escapeCell(cell))).join(','),
  );
  const lines = [headers.map(escapeCell).join(','), ...dataLines];
  const csv = String.fromCharCode(0xfeff) + lines.join('\r\n'); // BOM — 엑셀이 UTF-8로 인식 (완료 기준 ②)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
