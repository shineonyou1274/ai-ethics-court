// 모드별 의견서 양식 (기획안 §6) — 질문 라벨은 세션 questions에서 주입
// truth: 진술/판단/근거/성찰 (§6.1) · court: 주장/근거/예상 반박·대응 (§6.2)

import { ClipboardPaste } from 'lucide-react';
import { COURT_QUESTION_PRESET, JUDGMENT_LABELS, TRUTH_QUESTION_PRESET } from '../../api/contract';
import {
  isCourtFields,
  isTruthFields,
  type CourtFields,
  type Judgment,
  type Mode,
  type SubmissionFields,
  type TruthFields,
} from '../../types';
import { EvidenceListInput } from './EvidenceListInput';
import { RebuttalListInput } from './RebuttalListInput';

interface Props {
  mode: Mode;
  questions: Record<string, string>;
  fields: SubmissionFields;
  onChange: (f: SubmissionFields) => void;
  situationText: string;
  /** court 모드 — 내 역할팀 이름 ("○○ 측" 치환) */
  roleName?: string;
  disabled?: boolean;
}

const JUDGMENTS: Judgment[] = ['true', 'false', 'partial', 'unverifiable'];

export function OpinionForm({ mode, questions, fields, onChange, situationText, roleName, disabled }: Props) {
  if (isCourtFields(mode, fields)) {
    return (
      <CourtForm
        questions={questions}
        fields={fields}
        onChange={onChange}
        roleName={roleName}
        disabled={disabled}
      />
    );
  }
  if (isTruthFields(mode, fields)) {
    return (
      <TruthForm
        questions={questions}
        fields={fields}
        onChange={onChange}
        situationText={situationText}
        disabled={disabled}
      />
    );
  }
  return <p className="text-sm text-seal">의견서 양식을 불러오지 못했습니다. 새로고침해 주세요.</p>;
}

// ---- 진위 판별 (§6.1) ----

function TruthForm({
  questions,
  fields,
  onChange,
  situationText,
  disabled,
}: {
  questions: Record<string, string>;
  fields: TruthFields;
  onChange: (f: SubmissionFields) => void;
  situationText: string;
  disabled?: boolean;
}) {
  const q = (key: string) => questions[key] || TRUTH_QUESTION_PRESET[key] || key;
  const set = (patch: Partial<TruthFields>) => onChange({ ...fields, ...patch });

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1 block text-sm font-bold text-ink">1. {q('statement')}</label>
        <div className="flex gap-2">
          <input
            value={fields.statement}
            onChange={(e) => set({ statement: e.target.value })}
            disabled={disabled}
            placeholder="검증 대상 진술 한 줄"
            className="flex-1 border border-line bg-card px-3 py-2 text-sm focus:border-ink focus:outline-none disabled:bg-paper"
          />
          {!disabled && (
            <button
              type="button"
              onClick={() => set({ statement: situationText.split('\n')[0]?.slice(0, 200) ?? '' })}
              title="상황판 첫 줄 가져오기"
              className="flex items-center gap-1 border border-line bg-paper px-2 py-1 text-xs text-ink hover:bg-line/40"
            >
              <ClipboardPaste size={13} /> 상황판에서
            </button>
          )}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-bold text-ink">2. {q('judgment')}</span>
        <div className="flex flex-wrap gap-2">
          {JUDGMENTS.map((j) => (
            <button
              key={j}
              type="button"
              disabled={disabled}
              onClick={() => set({ judgment: j })}
              className={`border px-3 py-1.5 text-sm ${
                fields.judgment === j
                  ? 'border-ink bg-ink font-bold text-white'
                  : 'border-line bg-card text-ink hover:border-ink'
              } disabled:opacity-60`}
            >
              {JUDGMENT_LABELS[j]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-bold text-ink">3. {q('evidences')}</span>
        <p className="mb-2 text-xs text-faint">근거 최소 1개, 출처가 비어 있으면 제출할 수 없어요.</p>
        <EvidenceListInput
          value={fields.evidences}
          onChange={(evidences) => set({ evidences })}
          disabled={disabled}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-bold text-ink">4. {q('reflection')}</label>
        <textarea
          value={fields.reflection}
          onChange={(e) => set({ reflection: e.target.value })}
          disabled={disabled}
          rows={4}
          placeholder="이 정보가 퍼졌을 때 생길 수 있는 일을 구체적으로 적어 보세요."
          className="w-full border border-line bg-card px-3 py-2 text-sm focus:border-ink focus:outline-none disabled:bg-paper"
        />
      </div>
    </div>
  );
}

// ---- 법정 공방 (§6.2) ----

function CourtForm({
  questions,
  fields,
  onChange,
  roleName,
  disabled,
}: {
  questions: Record<string, string>;
  fields: CourtFields;
  onChange: (f: SubmissionFields) => void;
  roleName?: string;
  disabled?: boolean;
}) {
  // "○○ 측" → 내 역할팀 이름 치환
  const q = (key: string) => {
    const raw = questions[key] || COURT_QUESTION_PRESET[key] || key;
    return roleName ? raw.replace('○○ 측', roleName).replace('○○', roleName) : raw;
  };
  const set = (patch: Partial<CourtFields>) => onChange({ ...fields, ...patch });

  return (
    <div className="space-y-6">
      {!roleName && (
        <p className="border border-dashed border-line bg-paper px-3 py-2 text-xs text-faint">
          아직 역할팀이 배정되지 않았습니다. 선생님이 배정하면 상단에 우리 팀 배지가 표시됩니다.
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-bold text-ink">1. {q('claim')}</label>
        <textarea
          value={fields.claim}
          onChange={(e) => set({ claim: e.target.value })}
          disabled={disabled}
          rows={3}
          placeholder="우리 팀의 핵심 주장을 한 문단으로 정리해 보세요."
          className="w-full border border-line bg-card px-3 py-2 text-sm focus:border-ink focus:outline-none disabled:bg-paper"
        />
      </div>

      <div>
        <span className="mb-1 block text-sm font-bold text-ink">2. {q('evidences')}</span>
        <p className="mb-2 text-xs text-faint">근거 최소 1개, 출처가 비어 있으면 제출할 수 없어요.</p>
        <EvidenceListInput
          value={fields.evidences}
          onChange={(evidences) => set({ evidences })}
          disabled={disabled}
        />
      </div>

      <div>
        <span className="mb-1 block text-sm font-bold text-ink">3. {q('rebuttal')}</span>
        <p className="mb-2 text-xs text-faint">예상 반박과 대응을 쌍으로, 최소 1쌍 입력하세요.</p>
        <RebuttalListInput
          value={fields.rebuttal}
          onChange={(rebuttal) => set({ rebuttal })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
