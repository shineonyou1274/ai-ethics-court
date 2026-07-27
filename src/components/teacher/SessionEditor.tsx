// 사건 개정/편집 폼 — 모드 프리셋 2종(진위 판별/법정 공방)에서 질문 문구만 수정 (기획안 R01, §6)
// 모드·역할 구성은 개정(생성) 시에만 설정한다 — 서버 updateSession이 mode/roles 패치를 받지 않음(M2 결정).

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  DEFAULT_COURT_ROLES,
  MODE_LABELS,
  QUESTION_FIELD_LABELS,
  QUESTION_PRESETS,
} from '../../api/contract';
import type { Mode, RoleDef, Session } from '../../types';

export interface SessionFormValue {
  title: string;
  class_name: string;
  situation_board: string;
  mode: Mode;
  roles: RoleDef[];
  questions: Record<string, string>;
  team_assign: 'random' | 'manual';
  team_count: number;
}

interface Props {
  initial?: Session;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (v: SessionFormValue) => void;
}

export function SessionEditor({ initial, submitLabel, busy, onSubmit }: Props) {
  const isNew = !initial;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [className, setClassName] = useState(initial?.class_name ?? '');
  const [board, setBoard] = useState(initial?.situation_board ?? '');
  const [mode, setMode] = useState<Mode>(initial?.mode ?? 'truth');
  const [roles, setRoles] = useState<RoleDef[]>(
    initial?.roles?.length ? initial.roles : DEFAULT_COURT_ROLES.map((r) => ({ ...r })),
  );
  const [questionsByMode, setQuestionsByMode] = useState<Record<Mode, Record<string, string>>>({
    truth: { ...QUESTION_PRESETS.truth, ...(initial?.mode !== 'court' ? initial?.questions ?? {} : {}) },
    court: { ...QUESTION_PRESETS.court, ...(initial?.mode === 'court' ? initial?.questions ?? {} : {}) },
  });
  const [teamAssign, setTeamAssign] = useState<'random' | 'manual'>(initial?.team_assign ?? 'random');
  const [teamCount, setTeamCount] = useState(initial?.team_count || 6);
  const [showQuestions, setShowQuestions] = useState(false);

  const questions = questionsByMode[mode];
  const setQuestion = (key: string, text: string) =>
    setQuestionsByMode((q) => ({ ...q, [mode]: { ...q[mode], [key]: text } }));

  const addRole = () => {
    if (roles.length >= 4) return;
    let n = roles.length + 1;
    while (roles.some((r) => r.id === `r${n}`)) n++;
    setRoles([...roles, { id: `r${n}`, name: '' }]);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          title: title.trim(),
          class_name: className.trim(),
          situation_board: board,
          mode,
          roles: mode === 'court' ? roles.map((r) => ({ id: r.id, name: r.name.trim() })) : [],
          questions,
          team_assign: teamAssign,
          team_count: teamCount,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-bold">사건명</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="예: 세종대왕 맥북 사건"
            className="input-base"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">학급</span>
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="예: 1-3"
            className="input-base"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-bold">
          상황판 {mode === 'court' ? '(사건 개요 · 쟁점 · 역할 안내)' : '(AI 진술문 · 사건 개요)'}
        </span>
        <textarea
          value={board}
          onChange={(e) => setBoard(e.target.value)}
          required
          rows={6}
          placeholder={
            mode === 'court'
              ? '[사건 개요] 학교가 AI 감정 분석 카메라를 교실에 설치하려 한다.\n[쟁점] 학습 지원 효과 vs 학생 사생활 침해\n[역할 안내] 각 팀은 자기 측 입장에서 주장과 근거를 준비한다.'
              : 'AI가 다음과 같이 진술했다:\n"세종대왕이 훈민정음 창제 중 맥북을 던졌다는 기록이 조선왕조실록에 있다."'
          }
          className="input-base"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-sm font-bold">모드</span>
          {isNew ? (
            <div className="flex gap-2">
              {(['truth', 'court'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`border px-3 py-2 text-sm ${
                    mode === m ? 'border-ink bg-ink font-bold text-white' : 'border-line bg-card text-ink hover:border-ink'
                  }`}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <span className="inline-block border border-ink bg-ink px-3 py-2 text-sm font-bold text-white">
                {MODE_LABELS[mode]}
              </span>
              <p className="mt-1 text-xs text-faint">모드는 개정 후 변경할 수 없습니다.</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-sm font-bold">모둠 배정</span>
            <select
              value={teamAssign}
              onChange={(e) => setTeamAssign(e.target.value as 'random' | 'manual')}
              className="input-base"
            >
              <option value="random">랜덤 배정</option>
              <option value="manual">교사 지정</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">모둠 수</span>
            <input
              type="number"
              min={1}
              max={10}
              value={teamCount}
              onChange={(e) => setTeamCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="input-base"
            />
          </label>
        </div>
      </div>

      {mode === 'court' && (
        <div className="border border-line bg-paper p-3">
          <span className="block text-sm font-bold">역할팀 구성 (2~4팀)</span>
          {isNew ? (
            <>
              <div className="mt-2 space-y-2">
                {roles.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <input
                      value={r.name}
                      onChange={(e) =>
                        setRoles(roles.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))
                      }
                      required
                      placeholder={`역할팀 ${i + 1} 이름 (예: 원고 측 변호사팀)`}
                      className="input-base flex-1"
                    />
                    {roles.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setRoles(roles.filter((_, idx) => idx !== i))}
                        className="text-faint hover:text-seal"
                        title="역할팀 삭제"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {roles.length < 4 && (
                <button
                  type="button"
                  onClick={addRole}
                  className="mt-2 flex items-center gap-1 border border-dashed border-line px-3 py-1.5 text-xs text-faint hover:border-ink hover:text-ink"
                >
                  <Plus size={13} /> 역할팀 추가
                </button>
              )}
            </>
          ) : (
            <>
              <div className="mt-2 flex flex-wrap gap-2">
                {roles.map((r) => (
                  <span key={r.id} className="border border-ink/50 bg-card px-2 py-1 font-serif text-xs font-bold">
                    {r.name}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-xs text-faint">역할팀 구성은 개정 후 변경할 수 없습니다. (배정은 출석부에서)</p>
            </>
          )}
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowQuestions((v) => !v)}
          className="text-xs text-faint underline hover:text-ink"
        >
          질문 문구 수정 {showQuestions ? '접기' : '펼치기'} (양식 구조는 고정)
        </button>
        {showQuestions && (
          <div className="mt-2 space-y-2">
            {Object.keys(QUESTION_PRESETS[mode]).map((key) => (
              <label key={key} className="block">
                <span className="mb-0.5 block text-xs text-faint">{QUESTION_FIELD_LABELS[key] ?? key}</span>
                <input
                  value={questions[key] ?? ''}
                  onChange={(e) => setQuestion(key, e.target.value)}
                  className="input-base"
                />
              </label>
            ))}
            {mode === 'court' && (
              <p className="text-xs text-faint">"○○ 측"은 학생 화면에서 각자의 역할팀 이름으로 바뀌어 표시됩니다.</p>
            )}
          </div>
        )}
      </div>

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? '처리 중…' : submitLabel}
      </button>
    </form>
  );
}
