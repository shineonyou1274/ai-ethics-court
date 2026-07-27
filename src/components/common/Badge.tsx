import { Award } from 'lucide-react';
import type { SubmissionStatus } from '../../types';

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const map: Record<SubmissionStatus, { label: string; cls: string }> = {
    draft: { label: '작성 중', cls: 'border-line bg-paper text-faint' },
    submitted: { label: '제출됨', cls: 'border-ink/50 bg-card text-ink' },
    approved: { label: '승인', cls: 'border-approve bg-approve/10 text-approve font-bold' },
    rejected: { label: '반려', cls: 'border-seal bg-seal/10 text-seal font-bold' },
    deleted: { label: '삭제됨', cls: 'border-line bg-paper text-faint line-through' },
  };
  const { label, cls } = map[status];
  return <span className={`border px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
}

/** 판결 확정 직인 (딥레드/그린 도장 느낌) */
export function VerdictStamp({ status }: { status: 'approved' | 'rejected' }) {
  const approved = status === 'approved';
  return (
    <div
      className={`flex h-16 w-16 -rotate-12 items-center justify-center rounded-full border-4 font-serif text-sm font-black ${
        approved ? 'border-approve text-approve' : 'border-seal text-seal'
      }`}
      aria-label={approved ? '승인 직인' : '반려 직인'}
    >
      {approved ? '승인' : '반려'}
    </div>
  );
}

/** 법정 공방 모드 역할팀 배지 (기획안 §6.2) */
export function RoleBadge({ name, mine }: { name: string; mine?: boolean }) {
  return (
    <span
      className={`border px-2 py-0.5 font-serif text-xs font-bold ${
        mine ? 'border-ink bg-ink text-white' : 'border-ink/50 bg-paper text-ink'
      }`}
    >
      {name}
    </span>
  );
}

/** M3 칭호 뱃지 (기획안 R23) — 리더보드 없음, 세션 내 활동 기준 훈장 표시 */
export function TitleBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 border border-approve/60 bg-approve/5 px-1.5 py-0.5 font-serif text-[11px] font-bold text-approve">
      <Award size={11} /> {label}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="border border-amber-500 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
      데모 모드 · 이 기기에만 저장
    </span>
  );
}
