// M3 — getBoard 증분 폴링 병합 (기획안 §5.3 since)
// 서버는 since(=이전 boardVersion, 서버 시각 ms)를 받으면
//   submissions/comments: since - 30초(중복 허용 오버랩) 이후 변경분만
//   submissionIds/commentIds: 현재 보여야 할 전체 ID (삭제 감지용)
// 를 반환한다. 클라이언트는 이전 전체본과 병합해 완전한 BoardData를 재구성한다.

import type { BoardData, CommentRow, Submission } from '../types';

/**
 * 모둠명 정렬 (P2-4): "10모둠"이 "2모둠"보다 앞에 오는 문자열 비교 오류 방지.
 * 앞자리 숫자를 추출해 수치 비교, 숫자가 없으면 문자열 비교. Code.gs teamCompare와 동일 규칙.
 */
export function compareTeam(a: string, b: string): number {
  const sa = String(a ?? '');
  const sb = String(b ?? '');
  const na = parseInt(sa, 10);
  const nb = parseInt(sb, 10);
  const aNum = !Number.isNaN(na);
  const bNum = !Number.isNaN(nb);
  if (aNum && bNum && na !== nb) return na - nb;
  if (aNum !== bNum) return aNum ? -1 : 1; // 숫자 시작 모둠을 앞에
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

function sortSubmissions(subs: Submission[]): Submission[] {
  // 서버 getBoard와 동일한 정렬: 모둠순 → 작성 시각순 (공감 수 정렬 금지 — 기획안 §11.6 충돌3)
  return [...subs].sort(
    (a, b) => compareTeam(a.team, b.team) || a.created_at.localeCompare(b.created_at),
  );
}

function sortComments(cmts: CommentRow[]): CommentRow[] {
  return [...cmts].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/**
 * 이전 전체본(prev)과 이번 응답(res)을 병합한다.
 * - prev가 없거나(첫 호출) 응답에 ID 목록이 없으면(구버전 서버) res를 전체본으로 그대로 사용.
 * - 있으면: 변경분을 ID 기준으로 덮어쓰고, ID 목록에 없는 항목은 제거(삭제 반영).
 */
export function mergeBoard(prev: BoardData | undefined, res: BoardData): BoardData {
  if (!prev || !res.submissionIds || !res.commentIds) {
    return {
      ...res,
      submissions: sortSubmissions(res.submissions),
      comments: sortComments(res.comments),
    };
  }
  const subMap = new Map(prev.submissions.map((s) => [s.submission_id, s]));
  for (const s of res.submissions) subMap.set(s.submission_id, s);
  const keepSubs = new Set(res.submissionIds);
  const submissions = sortSubmissions([...subMap.values()].filter((s) => keepSubs.has(s.submission_id)));

  const cmtMap = new Map(prev.comments.map((c) => [c.comment_id, c]));
  for (const c of res.comments) cmtMap.set(c.comment_id, c);
  const keepCmts = new Set(res.commentIds);
  const comments = sortComments([...cmtMap.values()].filter((c) => keepCmts.has(c.comment_id)));

  return {
    submissions,
    comments,
    likeCounts: res.likeCounts, // 공감/내 공감은 항상 전체 반환 (소량)
    myLikes: res.myLikes,
    boardVersion: res.boardVersion,
    showLikes: res.showLikes,
    submissionIds: res.submissionIds,
    commentIds: res.commentIds,
  };
}
