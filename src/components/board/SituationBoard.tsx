// 상황판 (접이식) + 외부 AI 챗봇 활동 안내 문구 상시 노출 (기획안 §11.1)
// court 모드: 사건 개요·쟁점(본문) + 역할팀 안내 섹션 + 내 역할 강조 (기획안 §6.2 상황판 고도화)

import { useState } from 'react';
import { ChevronDown, ChevronUp, Gavel, Scale } from 'lucide-react';
import type { Mode, RoleDef } from '../../types';

interface Props {
  title: string;
  body: string;
  mode?: Mode;
  roles?: RoleDef[];
  myRoleId?: string;
  defaultOpen?: boolean;
}

export function SituationBoard({ title, body, mode = 'truth', roles = [], myRoleId = '', defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const isCourt = mode === 'court';
  return (
    <section className="border-2 border-ink/70 bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 font-serif text-base font-bold text-ink">
          <Gavel size={17} /> 사건 상황판 — {title}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="border-t border-line px-4 py-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{body}</p>

          {isCourt && roles.length > 0 && (
            <div className="mt-4 border border-ink/30 bg-paper p-3">
              <h3 className="flex items-center gap-1.5 font-serif text-sm font-bold text-ink">
                <Scale size={14} /> 역할팀 안내
              </h3>
              <ul className="mt-2 space-y-1.5">
                {roles.map((r) => {
                  const mine = r.id === myRoleId;
                  return (
                    <li
                      key={r.id}
                      className={`flex items-center gap-2 border px-2 py-1.5 text-sm ${
                        mine ? 'border-ink bg-ink/5 font-bold text-ink' : 'border-line bg-card text-ink'
                      }`}
                    >
                      <span className="font-serif">{r.name}</span>
                      {mine && (
                        <span className="border border-ink bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">
                          우리 팀
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-faint">
                우리 팀의 입장에서 주장·근거·예상 반박을 준비하세요. 상대 팀 의견서는 배심원 광장에서
                열람할 수 있습니다.
                {!myRoleId && ' (역할팀은 선생님이 배정합니다 — 배정 전에는 작성 안내만 표시됩니다.)'}
              </p>
            </div>
          )}

          <p className="mt-4 border-t border-dashed border-line pt-3 text-xs text-faint">
            ※ AI 진술의 검증(사실 확인·자료 조사)은 선생님이 안내한 외부 AI 챗봇과 검색을 활용하세요.
            이 앱에는 의견서 작성과 상호 심의만 기록합니다.
          </p>
        </div>
      )}
    </section>
  );
}
