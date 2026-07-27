// 판결 확정(경량): 승인/반려 토글 + 사유 1줄 (기획안 §11.6 충돌1 판정)

import { useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
import type { Submission } from '../../types';

interface Props {
  submission: Submission;
  busy?: boolean;
  onVerdict: (verdict: 'approved' | 'rejected', note: string) => void;
  onDelete: () => void;
}

export function VerdictPanel({ submission, busy, onVerdict, onDelete }: Props) {
  const [note, setNote] = useState(submission.teacher_note ?? '');
  return (
    <div className="mt-3 border-t-2 border-ink/60 pt-3">
      <p className="mb-2 font-serif text-xs font-bold text-ink">재판부 판결</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || submission.status === 'approved'}
          onClick={() => onVerdict('approved', note)}
          className="flex items-center gap-1 border border-approve bg-approve/10 px-3 py-1.5 text-xs font-bold text-approve hover:bg-approve hover:text-white disabled:opacity-50"
        >
          <Check size={13} /> 승인
        </button>
        <button
          type="button"
          disabled={busy || submission.status === 'rejected'}
          onClick={() => onVerdict('rejected', note)}
          className="flex items-center gap-1 border border-seal bg-seal/10 px-3 py-1.5 text-xs font-bold text-seal hover:bg-seal hover:text-white disabled:opacity-50"
        >
          <X size={13} /> 반려
        </button>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="사유 1줄 (반려 시 학생에게 표시)"
          className="min-w-40 flex-1 border border-line bg-card px-2 py-1.5 text-xs focus:border-ink focus:outline-none"
        />
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          title="의견서 삭제 (교사 전권)"
          className="flex items-center gap-1 border border-line px-2 py-1.5 text-xs text-faint hover:border-seal hover:text-seal disabled:opacity-50"
        >
          <Trash2 size={13} /> 삭제
        </button>
      </div>
    </div>
  );
}
