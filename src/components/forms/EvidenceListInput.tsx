// 근거·출처 반복 블록 — 기본 1개만 펼치고 [근거 추가]는 보조 버튼 (기획안 §11.2)

import { Plus, Trash2 } from 'lucide-react';
import type { Evidence } from '../../types';

interface Props {
  value: Evidence[];
  onChange: (v: Evidence[]) => void;
  disabled?: boolean;
}

export function EvidenceListInput({ value, onChange, disabled }: Props) {
  const update = (i: number, patch: Partial<Evidence>) => {
    onChange(value.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  };
  return (
    <div className="space-y-3">
      {value.map((ev, i) => (
        <div key={i} className="border border-line bg-paper/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-serif text-xs font-bold text-ink">근거 {i + 1}</span>
            {value.length > 1 && !disabled && (
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="flex items-center gap-1 text-xs text-faint hover:text-seal"
              >
                <Trash2 size={12} /> 삭제
              </button>
            )}
          </div>
          <textarea
            value={ev.claim}
            onChange={(e) => update(i, { claim: e.target.value })}
            disabled={disabled}
            rows={2}
            placeholder="근거 내용 (예: 세종 재위는 1418~1450년)"
            className="w-full border border-line bg-card px-3 py-2 text-sm focus:border-ink focus:outline-none disabled:bg-paper"
          />
          <input
            value={ev.source}
            onChange={(e) => update(i, { source: e.target.value })}
            disabled={disabled}
            placeholder="출처 — 기사·논문·기관명 + URL (필수)"
            className="mt-2 w-full border border-line bg-card px-3 py-2 text-sm focus:border-ink focus:outline-none disabled:bg-paper"
          />
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={() => onChange([...value, { claim: '', source: '' }])}
          className="flex items-center gap-1 border border-dashed border-line px-3 py-1.5 text-xs text-faint hover:border-ink hover:text-ink"
        >
          <Plus size={13} /> 근거 추가
        </button>
      )}
    </div>
  );
}
