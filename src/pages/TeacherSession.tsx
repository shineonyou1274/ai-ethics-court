// S6 — 사건 관리: 수업 중 조작 3가지(세션 열기·새로고침·판결 확정) 최상단 고정 (기획안 §11.1)
// + 상황판·질문 편집, 모둠 배정(랜덤/지정), 제출 현황 모니터링, 전권 수정·삭제

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ChevronLeft, Copy, Eye, EyeOff, FileDown, Gavel, Pencil, Shuffle } from 'lucide-react';
import { MODE_LABELS } from '../api/contract';
import { DemoBadge } from '../components/common/Badge';
import { confirmDialog } from '../components/common/ConfirmDialog';
import { RefreshIndicator } from '../components/common/RefreshIndicator';
import { toast } from '../components/common/Toast';
import { SubmissionCard } from '../components/board/SubmissionCard';
import { MonitorTable, type BulkAssignment } from '../components/teacher/MonitorTable';
import { SessionEditor } from '../components/teacher/SessionEditor';
import { VerdictPanel } from '../components/teacher/VerdictPanel';
import { computeTitles } from '../lib/titles';
import { getBackend, getWebappUrl, isDemoMode } from '../services';
import { useAppStore } from '../stores/appStore';
import type { Session } from '../types';

export function TeacherSession() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { teacherKey } = useAppStore();
  const backend = getBackend();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  // 교사 모드 보호: 키 미보유 시 교사 홈(키 입력 화면)으로
  useEffect(() => {
    if (!teacherKey) navigate('/teacher');
  }, [teacherKey, navigate]);

  const sessionsQuery = useQuery({
    queryKey: ['sessions', teacherKey, backend.kind],
    enabled: !!teacherKey,
    queryFn: () => backend.listSessions(teacherKey),
    retry: false,
  });
  const session = sessionsQuery.data?.sessions.find((s) => s.session_id === id) ?? null;

  // 교사 모니터링 폴링 12초 (기획안 §5.3)
  const interval = useMemo(() => 12_000 + Math.round((Math.random() * 2 - 1) * 2_000), []);
  const boardQuery = useQuery({
    queryKey: ['teacherBoard', id],
    enabled: !!teacherKey && !!session,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
    queryFn: () => backend.getTeacherBoard(id, teacherKey),
    retry: false,
  });

  const refreshAll = () => {
    void sessionsQuery.refetch();
    void boardQuery.refetch();
  };

  // M3(P2-1): updateSession 성공 응답을 세션 목록 캐시에 즉시 반영 — 버튼 상태가 다음 폴링을 기다리지 않는다
  const applySessionUpdate = (updated: Session) => {
    queryClient.setQueryData<{ sessions: Session[] }>(
      ['sessions', teacherKey, backend.kind],
      (old) =>
        old
          ? { sessions: old.sessions.map((s) => (s.session_id === updated.session_id ? updated : s)) }
          : old,
    );
  };

  const patchSession = (patch: Parameters<typeof backend.updateSession>[0]['patch']) => async () => {
    const res = await backend.updateSession({ sessionId: id, patch }, teacherKey);
    applySessionUpdate(res.session);
  };

  const run = async (fn: () => Promise<unknown>, successMessage?: string) => {
    setBusy(true);
    try {
      await fn();
      if (successMessage) toast(successMessage, 'success');
      refreshAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : '처리에 실패했습니다.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!teacherKey) return null;
  if (sessionsQuery.isLoading) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-faint">불러오는 중…</main>;
  }
  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-seal">
          {sessionsQuery.error instanceof Error ? sessionsQuery.error.message : '사건을 찾을 수 없습니다.'}
        </p>
        <Link to="/teacher" className="btn-ghost">
          교사 홈으로
        </Link>
      </main>
    );
  }

  const board = boardQuery.data;
  const students = board?.students ?? [];
  const submissions = board?.submissions ?? [];
  const visible = submissions.filter((s) => s.status !== 'deleted');
  const publicSubs = visible.filter((s) => s.status !== 'draft');
  const notSubmitted = students.filter(
    (st) => !submissions.some((s) => s.student_id === st.student_id && s.status !== 'draft'),
  );
  // M3: 칭호 뱃지 — 학생 광장과 동일 규칙으로 계산 (리더보드 없음)
  const titleMap = computeTitles(publicSubs, board?.comments ?? []);

  const statusAction =
    session.status === 'draft'
      ? { label: '개정 개시 (학생 입장 허용)', next: 'open' as const, cls: 'btn-primary' }
      : session.status === 'open'
        ? { label: '폐정 (제출·댓글 마감)', next: 'closed' as const, cls: 'bg-seal px-4 py-2 text-sm font-bold text-white hover:bg-seal/90' }
        : session.status === 'closed'
          ? { label: '재개정', next: 'open' as const, cls: 'btn-ghost' }
          : { label: '보관 해제 (종료 상태로)', next: 'closed' as const, cls: 'btn-ghost' };

  // 세션 단위 아카이브 — 리셋 대체, 교사 확인 모달 2중 (기획안 R04)
  const archiveSession = async () => {
    const first = await confirmDialog({
      title: '사건 보관 (아카이브)',
      message: `'${session.title}' 사건을 보관합니다.\n보관하면 학생 화면에서 더 이상 열람할 수 없고, 사건 목록의 [보관된 사건]으로 이동합니다.\n데이터는 시트에 그대로 남습니다.`,
      confirmText: '보관 진행',
      danger: true,
    });
    if (!first) return;
    const second = await confirmDialog({
      title: '보관 최종 확인',
      message: '정말 보관할까요? 학생 접근이 즉시 차단됩니다.\n(되돌리려면 [보관 해제]를 누르면 됩니다)',
      confirmText: '보관 확정',
      danger: true,
    });
    if (!second) return;
    void run(patchSession({ status: 'archived' }), '사건을 보관했습니다.');
  };

  // 체크 지정 배정 + 이미 작성된 의견서의 role_id 동기화
  // (서버 assignTeams는 team만 의견서에 동기화하므로, 역할 변경분은 adminEdit로 반영 — Code.gs 무변경 유지)
  const assign = (assignments: BulkAssignment[]) =>
    run(async () => {
      await backend.assignTeams({ sessionId: id, mode: 'manual', assignments }, teacherKey);
      const subs = boardQuery.data?.submissions ?? [];
      for (const a of assignments) {
        if (a.roleId === undefined) continue;
        const sub = subs.find((s) => s.student_id === a.studentId && s.status !== 'deleted');
        if (sub && sub.role_id !== a.roleId) {
          await backend.adminEdit(
            { target: 'submission', id: sub.submission_id, patch: { role_id: a.roleId } },
            teacherKey,
          );
        }
      }
    }, undefined);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 pb-16 pt-6">
      <Link to="/teacher" className="mb-3 inline-flex items-center gap-1 text-xs text-faint hover:text-ink">
        <ChevronLeft size={13} /> 사건 목록
      </Link>

      {/* 수업 중 조작 3가지 — 최상단 고정 */}
      <div className="sticky top-0 z-10 border-2 border-ink/70 bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 font-serif text-xl font-black">
              <Gavel size={19} /> {session.title}
            </h1>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-faint">
              {MODE_LABELS[session.mode]} · {session.class_name && `${session.class_name} · `}
              입장 코드{' '}
              <b className="font-mono text-base tracking-widest text-ink">{session.code}</b>
              <button
                type="button"
                title="코드 복사"
                onClick={() => {
                  void navigator.clipboard.writeText(session.code).then(() => toast('코드를 복사했습니다.', 'success'));
                }}
                className="text-faint hover:text-ink"
              >
                <Copy size={13} />
              </button>
              {!isDemoMode() && (
                <button
                  type="button"
                  onClick={() => {
                    // 학생용 링크: 열기만 하면 연동 URL이 자동 저장되고 출석부로 이동한다 (main.tsx ?api= 처리)
                    const link =
                      window.location.origin +
                      window.location.pathname +
                      '?api=' +
                      encodeURIComponent(getWebappUrl()) +
                      '#/join';
                    void navigator.clipboard.writeText(link).then(() => toast('학생용 링크를 복사했습니다. 학급에 공유하세요.', 'success'));
                  }}
                  className="rounded border border-ink/30 px-1.5 py-0.5 text-[11px] text-faint hover:text-ink"
                >
                  학생용 링크 복사
                </button>
              )}
              {isDemoMode() && <DemoBadge />}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              className={statusAction.cls}
              onClick={() =>
                void run(
                  patchSession({ status: statusAction.next }),
                  statusAction.next === 'open' ? '개정되었습니다. 학생이 입장할 수 있습니다.' : '폐정되었습니다.',
                )
              }
            >
              {statusAction.label}
            </button>
            {session.status === 'closed' && (
              <button
                type="button"
                disabled={busy}
                className="btn-ghost flex items-center gap-1"
                onClick={() => void archiveSession()}
              >
                <Archive size={14} /> 보관
              </button>
            )}
            <Link to={`/print/${id}`} className="btn-ghost flex items-center gap-1">
              <FileDown size={14} /> 판례집 PDF
            </Link>
            <RefreshIndicator
              updatedAt={boardQuery.dataUpdatedAt}
              isFetching={boardQuery.isFetching}
              isError={boardQuery.isError}
              onRefresh={refreshAll}
            />
          </div>
        </div>
      </div>

      {/* 사건 편집 */}
      <section className="mt-4">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="flex items-center gap-1 text-xs text-faint underline hover:text-ink"
        >
          <Pencil size={12} /> 상황판·질문 문구 편집 {editing ? '접기' : '펼치기'}
        </button>
        {editing && (
          <div className="doc-frame mt-2">
            <div className="doc-frame-inner">
              <SessionEditor
                initial={session}
                submitLabel="수정 저장"
                busy={busy}
                onSubmit={({ mode: _mode, roles: _roles, ...patch }) =>
                  // mode/roles는 개정 후 변경 불가 — 서버 updateSession이 받지 않는 필드는 보내지 않는다
                  void run(patchSession(patch), '사건 정보를 수정했습니다.').then(() => setEditing(false))
                }
              />
            </div>
          </div>
        )}
      </section>

      {/* 모둠 + 제출 현황 */}
      <section className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-bold">출석부 · 제출 현황</h2>
          <div className="flex items-center gap-2 text-xs text-faint">
            <span>
              입장 {students.length}명 · 제출 {publicSubs.length}명 · 미제출 {notSubmitted.length}명
            </span>
            <button
              type="button"
              disabled={busy || students.length === 0}
              className="btn-ghost flex items-center gap-1 py-1.5"
              onClick={async () => {
                const yes = await confirmDialog({
                  title: '랜덤 모둠 재배정',
                  message: `입장한 ${students.length}명을 ${session.team_count}개 모둠으로 다시 섞습니다. 계속할까요?`,
                  confirmText: '재배정',
                });
                if (yes) void run(() => backend.assignTeams({ sessionId: id, mode: 'random' }, teacherKey), '모둠을 재배정했습니다.');
              }}
            >
              <Shuffle size={13} /> 랜덤 재배정
            </button>
          </div>
        </div>
        <MonitorTable
          students={students}
          submissions={submissions}
          teamCount={session.team_count}
          mode={session.mode}
          roles={session.roles}
          busy={busy}
          onAssign={(assignments) => void assign(assignments)}
        />
      </section>

      {/* 의견서 심의 */}
      <section className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-bold">의견서 심의 · 판결</h2>
          {/* M3: 공감 수 학생 노출 옵션 (기획안 R23 show_likes) — 교사 화면에는 항상 표시 */}
          <button
            type="button"
            disabled={busy}
            className="btn-ghost flex items-center gap-1 py-1.5 text-xs"
            title="끄면 학생 화면에서 공감 숫자가 숨겨집니다 (공감 버튼은 유지)"
            onClick={() =>
              void run(
                patchSession({ show_likes: !session.show_likes }),
                session.show_likes
                  ? '학생 화면에서 공감 수를 숨겼습니다.'
                  : '학생 화면에 공감 수를 표시합니다.',
              )
            }
          >
            {session.show_likes ? <Eye size={13} /> : <EyeOff size={13} />}
            공감 수 학생 노출: {session.show_likes ? '켬' : '끔'}
          </button>
        </div>
        {publicSubs.length === 0 ? (
          <p className="border border-dashed border-line bg-card px-4 py-6 text-center text-sm text-faint">
            아직 제출된 의견서가 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            {publicSubs.map((sub, i) => (
              <SubmissionCard
                key={sub.submission_id}
                submission={sub}
                index={i + 1}
                comments={(board?.comments ?? []).filter((c) => c.submission_id === sub.submission_id)}
                likeCount={board?.likeCounts[sub.submission_id] ?? 0}
                liked={false}
                roles={session.roles}
                titles={titleMap.get(sub.student_id)}
                showLikes
                onDeleteComment={async (commentId) => {
                  const yes = await confirmDialog({
                    title: '댓글 삭제',
                    message: '이 댓글을 삭제할까요? (교사 전권)',
                    confirmText: '삭제',
                    danger: true,
                  });
                  if (yes)
                    void run(
                      () => backend.adminEdit({ target: 'comment', id: commentId, patch: { status: 'deleted' } }, teacherKey),
                      '댓글을 삭제했습니다.',
                    );
                }}
                footer={
                  <>
                    <div className="mt-3 flex justify-end">
                      <Link
                        to={`/print/${id}?sub=${sub.submission_id}`}
                        className="flex items-center gap-1 border border-line px-2 py-1 text-xs text-faint hover:border-ink hover:text-ink"
                      >
                        <FileDown size={12} /> 이 의견서 PDF
                      </Link>
                    </div>
                    <VerdictPanel
                    submission={sub}
                    busy={busy}
                    onVerdict={(verdict, note) =>
                      void run(
                        () => backend.setVerdict({ submissionId: sub.submission_id, verdict, note }, teacherKey),
                        verdict === 'approved' ? '승인 직인을 찍었습니다.' : '반려했습니다.',
                      )
                    }
                    onDelete={async () => {
                      const yes = await confirmDialog({
                        title: '의견서 삭제',
                        message: `${sub.student_name}(${sub.student_id})의 의견서를 삭제할까요?\n데이터는 시트에 남고 화면에서만 제외됩니다.`,
                        confirmText: '삭제',
                        danger: true,
                      });
                      if (yes)
                        void run(
                          () =>
                            backend.adminEdit(
                              { target: 'submission', id: sub.submission_id, patch: { status: 'deleted' } },
                              teacherKey,
                            ),
                          '의견서를 삭제했습니다.',
                        );
                    }}
                    />
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
