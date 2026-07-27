// 의견서 카드 — 공문서 프레임(이중 괘선 + "제 N호 의견서" 헤더), 판결 직인 (기획안 §7.5)

import { useRef, useState, type ReactNode } from 'react';
import { Heart, MessageSquare, Send } from 'lucide-react';
import { COMMENT_FRAMES, JUDGMENT_LABELS } from '../../api/contract';
import { isCourtFields, isTruthFields, type CommentRow, type RoleDef, type Submission } from '../../types';
import { RoleBadge, StatusBadge, TitleBadge, VerdictStamp } from '../common/Badge';

interface Props {
  submission: Submission;
  index: number; // 제 N호
  comments: CommentRow[];
  likeCount: number;
  liked: boolean;
  showLikes: boolean;
  /** court 모드 — 역할팀 배지 표시용 (세션 roles) */
  roles?: RoleDef[];
  /** M3 칭호 뱃지 — 작성자가 획득한 칭호 목록 */
  titles?: string[];
  isMine?: boolean;
  readOnly?: boolean; // 종료된 세션 등
  onToggleLike?: () => void;
  onAddComment?: (text: string) => Promise<void>;
  /** 교사 전권 — 댓글 삭제 */
  onDeleteComment?: (commentId: string) => void;
  /** 교사 패널 등 추가 액션 영역 */
  footer?: ReactNode;
}

export function SubmissionCard({
  submission: sub,
  index,
  comments,
  likeCount,
  liked,
  showLikes,
  roles,
  titles,
  isMine,
  readOnly,
  onToggleLike,
  onAddComment,
  onDeleteComment,
  footer,
}: Props) {
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const roleName = roles?.find((r) => r.id === sub.role_id)?.name ?? '';

  // M3 — 댓글 문장 프레임 '선택 삽입' (강제 아님, 기획안 §11.6 충돌4)
  const insertFrame = (text: string) => {
    setCommentText((prev) => (prev.trim() ? prev + ' ' + text : text));
    commentInputRef.current?.focus();
  };

  const submitComment = async () => {
    if (!commentText.trim() || !onAddComment || sending) return;
    setSending(true);
    try {
      await onAddComment(commentText);
      setCommentText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <article className="relative border-2 border-ink/70 bg-card p-1">
      <div className="border border-ink/30 p-4">
        {/* 헤더 */}
        <header className="flex items-start justify-between gap-2 border-b-2 border-ink/60 pb-2">
          <div>
            <h3 className="font-serif text-base font-bold text-ink">제 {index}호 의견서</h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-faint">
              {roleName && <RoleBadge name={roleName} />}
              <span>
                {sub.team || '모둠 미정'} · {sub.student_name} ({sub.student_id})
              </span>
              {isMine && <span className="font-bold text-ink">— 내 의견서</span>}
              {titles?.map((t) => <TitleBadge key={t} label={t} />)}
            </p>
          </div>
          <StatusBadge status={sub.status} />
        </header>

        {/* 판결 직인 */}
        {(sub.status === 'approved' || sub.status === 'rejected') && (
          <div className="absolute right-4 top-10 opacity-80">
            <VerdictStamp status={sub.status} />
          </div>
        )}

        {/* 본문 — 모드별 렌더 */}
        <div className="mt-3 space-y-3 text-sm text-ink">
          <SubmissionBody submission={sub} />
          {sub.teacher_note && sub.status === 'rejected' && (
            <p className="border border-seal/40 bg-seal/5 px-2 py-1 text-xs text-seal">
              반려 사유: {sub.teacher_note}
            </p>
          )}
        </div>

        {/* 공감 + 댓글 */}
        <div className="mt-4 flex items-center gap-3 border-t border-line pt-3">
          {onToggleLike && (
            <button
              type="button"
              onClick={onToggleLike}
              disabled={readOnly}
              className={`flex items-center gap-1 border px-2 py-1 text-xs ${
                liked ? 'border-seal bg-seal/10 text-seal' : 'border-line text-faint hover:border-seal hover:text-seal'
              } disabled:opacity-50`}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              공감{showLikes ? ` ${likeCount}` : ''}
            </button>
          )}
          <span className="flex items-center gap-1 text-xs text-faint">
            <MessageSquare size={14} /> 댓글 {comments.length}
          </span>
        </div>

        {comments.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {comments.map((c) => (
              <li key={c.comment_id} className="flex items-start justify-between gap-2 bg-paper px-2 py-1.5 text-xs">
                <span>
                  <span className="font-bold text-ink">
                    {c.author_name}
                    {c.author_team ? ` (${c.author_team})` : ''}
                  </span>
                  <span className="ml-2 text-ink/90">{c.text}</span>
                </span>
                {onDeleteComment && (
                  <button
                    type="button"
                    onClick={() => onDeleteComment(c.comment_id)}
                    className="shrink-0 text-faint hover:text-seal"
                  >
                    삭제
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {onAddComment && !readOnly && (
          <div className="mt-2">
            {/* M3 댓글 문장 프레임 3종 — 클릭하면 입력창에 문장 틀 삽입 */}
            <div className="mb-1 flex flex-wrap gap-1">
              {COMMENT_FRAMES.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => insertFrame(f.text)}
                  className="border border-dashed border-line bg-paper px-2 py-0.5 text-[11px] text-faint hover:border-ink hover:text-ink"
                  title={f.text}
                >
                  + {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
            <input
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) void submitComment();
              }}
              placeholder="근거를 중심으로 의견을 남겨 보세요"
              className="flex-1 border border-line bg-card px-2 py-1.5 text-xs focus:border-ink focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void submitComment()}
              disabled={sending || !commentText.trim()}
              className="flex items-center gap-1 bg-ink px-3 py-1.5 text-xs text-white disabled:opacity-50"
            >
              <Send size={12} /> 등록
            </button>
            </div>
          </div>
        )}

        {footer}
      </div>
    </article>
  );
}

/** 의견서 본문 — mode에 따라 진위 판별/법정 공방 양식 렌더 (인쇄 템플릿에서도 재사용) */
export function SubmissionBody({ submission: sub }: { submission: Submission }) {
  const f = sub.fields;
  if (isCourtFields(sub.mode, f)) {
    return (
      <>
        <div>
          <span className="font-bold">주장 </span>
          <span className="whitespace-pre-wrap text-ink/90">{f.claim}</span>
        </div>
        <EvidenceList evidences={f.evidences} />
        <div>
          <span className="font-bold">예상 반박 · 대응</span>
          <ul className="mt-1 space-y-1.5">
            {f.rebuttal.map((r, i) => (
              <li key={i} className="border-l-2 border-line pl-2">
                <span className="block">
                  <span className="text-xs font-bold text-seal">반박</span>{' '}
                  <span className="whitespace-pre-wrap">{r.expected}</span>
                </span>
                <span className="block">
                  <span className="text-xs font-bold text-approve">대응</span>{' '}
                  <span className="whitespace-pre-wrap">{r.response}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }
  if (isTruthFields(sub.mode, f)) {
    return (
      <>
        <div>
          <span className="font-bold">검증 진술 </span>
          <span className="text-ink/90">{f.statement}</span>
        </div>
        <div>
          <span className="font-bold">판단 </span>
          <span className="border border-ink/50 bg-paper px-2 py-0.5 font-serif font-bold">
            {f.judgment ? JUDGMENT_LABELS[f.judgment] : '—'}
          </span>
        </div>
        <EvidenceList evidences={f.evidences} />
        <div>
          <span className="font-bold">성찰 </span>
          <span className="whitespace-pre-wrap text-ink/90">{f.reflection}</span>
        </div>
      </>
    );
  }
  return <p className="text-xs text-faint">의견서 본문을 표시할 수 없습니다.</p>;
}

function EvidenceList({ evidences }: { evidences: { claim: string; source: string }[] }) {
  return (
    <div>
      <span className="font-bold">근거·출처</span>
      <ul className="mt-1 space-y-1">
        {evidences.map((e, i) => (
          <li key={i} className="border-l-2 border-line pl-2">
            <span>{e.claim}</span>
            <span className="block break-all text-xs text-faint">출처: {e.source}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
