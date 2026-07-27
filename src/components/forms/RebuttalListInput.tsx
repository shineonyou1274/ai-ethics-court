// 예상 반박·대응 쌍 반복 블록 (기획안 §6.2) — 기본 1쌍, [쌍 추가]는 보조 버튼

import { Plus, Trash2 } from 'lucide-react';
import type { RebuttalPair } from '../../types';

interface Props {
  value: RebuttalPair[];
  onChange: (v: RebuttalPair[]) => void;
  disabled?: boolean;
}

export function RebuttalListInput({ value, onChange, disabled }: Props) {
  const update = (i: number, patch: Partial<RebuttalPair>) => {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  return (
    <div className="space-y-3">
      {value.map((r, i) => (
        <div key={i} className="border border-line bg-paper/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-serif text-xs font-bold text-ink">공방 {i + 1}</span>
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
            value={r.expected}
            onChange={(e) => update(i, { expected: e.target.value })}
            disabled={disabled}
            rows={2}
            placeholder="상대측 예상 반박 (예: 원고 측 자료는 출처가 불분명하다)"
            className="w-full border border-line bg-card px-3 py-2 text-sm focus:border-ink focus:outline-none disabled:bg-paper"
          />
          <textarea
            value={r.response}
            onChange={(e) => update(i, { response: e.target.value })}
            disabled={disabled}
            rows={2}
            placeholder="우리 팀의 대응 (예: 기관 공식 통계로 재확인했다)"
            className="mt-2 w-full border border-line bg-card px-3 py-2 text-sm focus:border-ink focus:outline-none disabled:bg-paper"
          />
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={() => onChange([...value, { expected: '', response: '' }])}
          className="flex items-center gap-1 border border-dashed border-line px-3 py-1.5 text-xs text-faint hover:border-ink hover:text-ink"
        >
          <Plus size={13} /> 공방 쌍 추가
        </button>
      )}
    </div>
  );
}
