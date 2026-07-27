// S4 — 교사 홈: teacherKey 등록(최초 1회) → 세션 목록 + [새 사건 개정] (기획안 §2)

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, BarChart3, ChevronLeft, KeyRound, Plus, Wrench } from 'lucide-react';
import { DemoBadge } from '../components/common/Badge';
import { confirmDialog } from '../components/common/ConfirmDialog';
import { toast } from '../components/common/Toast';
import { SessionEditor } from '../components/teacher/SessionEditor';
import { MODE_LABELS } from '../api/contract';
import { ensureLocalTeacherKey, getBackend, isDemoMode, setWebappUrl } from '../services';
import { useAppStore } from '../stores/appStore';
import type { Session, SessionStatus } from '../types';

const STATUS_LABEL: Record<SessionStatus, string> = {
  draft: '대기',
  open: '진행 중',
  closed: '종료',
  archived: '보관',
};

export function TeacherHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { teacherKey, setTeacherKey } = useAppStore();
  const [keyInput, setKeyInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const backend = getBackend();

  const sessionsQuery = useQuery({
    queryKey: ['sessions', teacherKey, backend.kind],
    enabled: !!teacherKey,
    queryFn: () => backend.listSessions(teacherKey),
    retry: false,
  });

  const startDemo = () => {
    const key = ensureLocalTeacherKey();
    setTeacherKey(key);
    toast('데모 모드를 시작했습니다. 모든 데이터는 이 기기에만 저장됩니다.', 'success');
  };

  const disconnect = async () => {
    const yes = await confirmDialog({
      title: '연결 해제',
      message: '교사 키와 시트 연동 정보를 이 기기에서 지웁니다.\n시트의 데이터는 그대로 유지됩니다. 계속할까요?',
      confirmText: '해제',
      danger: true,
    });
    if (!yes) return;
    setTeacherKey('');
    setWebappUrl('');
    void queryClient.clear();
  };

  // ---- teacherKey 미등록 상태 ----
  if (!teacherKey) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-10">
        <div className="doc-frame">
          <div className="doc-frame-inner">
            <h1 className="font-serif text-2xl font-black">교사용 재판부</h1>
            <p className="mt-1 text-xs text-faint">교사 키를 등록하면 사건 개정과 판결 기능을 사용할 수 있습니다.</p>

            <div className="mt-6 space-y-4">
              <div className="border border-line bg-paper p-4">
                <h2 className="flex items-center gap-1.5 text-sm font-bold">
                  <Wrench size={15} /> 처음이신가요? — 구글 시트 연동
                </h2>
                <p className="mt-1 text-xs text-faint">최초 1회 설치로 학기 내내 재사용합니다. (약 10분)</p>
                <Link to="/teacher/setup" className="btn-primary mt-3 inline-block">
                  설치 마법사 시작
                </Link>
              </div>

              <div className="border border-line bg-paper p-4">
                <h2 className="flex items-center gap-1.5 text-sm font-bold">
                  <KeyRound size={15} /> 이미 설치했다면 — 교사 키 입력
                </h2>
                <div className="mt-3 flex gap-2">
                  <input
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="setup 실행 시 표시된 키"
                    className="input-base flex-1"
                  />
                  <button
                    type="button"
                    className="btn-primary shrink-0"
                    onClick={() => {
                      if (!keyInput.trim()) return toast('교사 키를 입력하세요.', 'warn');
                      setTeacherKey(keyInput.trim());
                      toast('교사 키를 등록했습니다.', 'success');
                    }}
                  >
                    등록
                  </button>
                </div>
              </div>

              <div className="border border-dashed border-line p-4">
                <h2 className="text-sm font-bold">시트 없이 체험 — 데모 모드</h2>
                <p className="mt-1 text-xs text-faint">이 기기의 브라우저에만 저장됩니다. 수업 전 기능 확인용.</p>
                <button type="button" onClick={startDemo} className="btn-ghost mt-3">
                  데모 모드로 시작
                </button>
              </div>
            </div>
          </div>
        </div>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-xs text-faint hover:text-ink">
          <ChevronLeft size={13} /> 처음으로
        </Link>
      </main>
    );
  }

  // ---- 세션 목록 ----
  const allSessions = sessionsQuery.data?.sessions ?? [];
  const sessions = allSessions.filter((s) => s.status !== 'archived');
  const archived = allSessions.filter((s) => s.status === 'archived');
  const isForbidden = sessionsQuery.isError && sessionsQuery.error instanceof Error;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-16 pt-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-black">교사용 재판부</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-faint">
            {isDemoMode() ? <DemoBadge /> : <span>구글 시트 연동됨</span>}
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          <Link to="/teacher/archive" className="btn-ghost flex items-center gap-1 py-1.5">
            <BarChart3 size={13} /> 학기 누적 집계
          </Link>
          <Link to="/teacher/setup" className="btn-ghost py-1.5">
            설치/연동 설정
          </Link>
          <button type="button" onClick={() => void disconnect()} className="btn-ghost py-1.5 text-seal">
            연결 해제
          </button>
        </div>
      </header>

      {isForbidden && (
        <div className="mb-4 border border-seal/50 bg-seal/5 px-4 py-3 text-sm text-seal">
          {(sessionsQuery.error as Error).message} — 키를 다시 등록하려면 [연결 해제] 후 재입력하세요.
        </div>
      )}

      <section className="mb-6">
        {!creating ? (
          <button type="button" onClick={() => setCreating(true)} className="btn-primary flex items-center gap-1">
            <Plus size={15} /> 새 사건 개정
          </button>
        ) : (
          <div className="doc-frame">
            <div className="doc-frame-inner">
              <div className="mb-4 flex items-center justify-between border-b-2 border-ink/60 pb-2">
                <h2 className="font-serif text-lg font-bold">새 사건 개정</h2>
                <button type="button" onClick={() => setCreating(false)} className="text-xs text-faint hover:text-ink">
                  닫기
                </button>
              </div>
              <SessionEditor
                submitLabel="사건 개정 (코드 발급)"
                busy={busy}
                onSubmit={async (v) => {
                  setBusy(true);
                  try {
                    const res = await getBackend().createSession(v, teacherKey);
                    toast(`사건이 개정되었습니다. 입장 코드: ${res.session.code}`, 'success');
                    navigate(`/teacher/session/${res.session.session_id}`);
                  } catch (err) {
                    toast(err instanceof Error ? err.message : '사건 개정에 실패했습니다.', 'error');
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-serif text-lg font-bold">사건 목록</h2>
        {sessionsQuery.isLoading ? (
          <p className="text-sm text-faint">불러오는 중…</p>
        ) : sessions.length === 0 ? (
          <p className="border border-dashed border-line bg-card px-4 py-6 text-center text-sm text-faint">
            아직 개정된 사건이 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <SessionListItem key={s.session_id} session={s} />
            ))}
          </ul>
        )}
      </section>

      {archived.length > 0 && (
        <section className="mt-8">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="mb-2 flex items-center gap-1 text-sm text-faint underline hover:text-ink"
          >
            <Archive size={14} /> 보관된 사건 {archived.length}건 {showArchived ? '접기' : '펼치기'}
          </button>
          {showArchived && (
            <ul className="space-y-2 opacity-80">
              {archived.map((s) => (
                <SessionListItem key={s.session_id} session={s} />
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

function SessionListItem({ session: s }: { session: Session }) {
  return (
    <li>
      <Link
        to={`/teacher/session/${s.session_id}`}
        className="flex items-center justify-between gap-2 border border-line bg-card px-4 py-3 hover:border-ink"
      >
        <div>
          <span className="font-serif font-bold text-ink">{s.title}</span>
          <span className="ml-2 text-xs text-faint">
            {MODE_LABELS[s.mode]} · {s.class_name && `${s.class_name} · `}코드 {s.code}
          </span>
        </div>
        <span
          className={`border px-2 py-0.5 text-xs ${
            s.status === 'open'
              ? 'border-approve bg-approve/10 text-approve font-bold'
              : s.status === 'closed'
                ? 'border-seal/60 text-seal'
                : 'border-line text-faint'
          }`}
        >
          {STATUS_LABEL[s.status]}
        </span>
      </Link>
    </li>
  );
}
