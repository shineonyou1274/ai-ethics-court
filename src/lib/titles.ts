// M3 — 칭호 뱃지 (기획안 R23: 리더보드 없음)
// 세션 안의 광장 데이터만으로 클라이언트에서 계산한다. 서버 저장 없음, 순위 비교 없음.
// 공감(하트) 수 기반 칭호는 두지 않는다 — 인기투표화 우려 (기획안 §11.6 충돌3).

import type { CommentRow, Submission } from '../types';

export const TITLE_RULES = [
  { id: 'evidence', label: '증거 수집관', desc: '근거·출처를 3개 이상 제시' },
  { id: 'juror', label: '성실 배심원', desc: '댓글을 3개 이상 작성' },
  { id: 'approved', label: '공인 검증가', desc: '교사 승인 판결을 받음' },
] as const;

/** 학번 → 획득 칭호 목록. submissions/comments는 광장 표시분(active·비삭제)만 전달한다. */
export function computeTitles(
  submissions: Submission[],
  comments: CommentRow[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (studentId: string, title: string) => {
    const arr = map.get(studentId) ?? [];
    if (!arr.includes(title)) {
      arr.push(title);
      map.set(studentId, arr);
    }
  };

  for (const s of submissions) {
    if (s.status === 'deleted' || s.status === 'draft') continue;
    const evidences = (s.fields as { evidences?: unknown[] }).evidences;
    if (Array.isArray(evidences) && evidences.length >= 3) add(s.student_id, '증거 수집관');
    if (s.status === 'approved') add(s.student_id, '공인 검증가');
  }

  const commentCount = new Map<string, number>();
  for (const c of comments) {
    if (c.status !== 'active') continue;
    commentCount.set(c.author_student_id, (commentCount.get(c.author_student_id) ?? 0) + 1);
  }
  for (const [studentId, n] of commentCount) {
    if (n >= 3) add(studentId, '성실 배심원');
  }
  return map;
}
