// S3 — 학생 메인: 상황판(접이식) + 스테퍼 + 탭 3개 (기획안 §2)
// ① 상황판 ② 의견서 작성(이중 임시저장 + PIN 제출) ③ 배심원 광장(폴링 12초±2초)

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileDown, FileText, Landmark, Save, Users } from 'lucide-react';
import { ApiError } from '../api/contract';
import { DemoBadge, RoleBadge } from '../components/common/Badge';
import { confirmDialog } from '../components/common/ConfirmDialog';
import { RefreshIndicator } from '../components/common/RefreshIndicator';
import { Stepper, type StepIndex } from '../components/common/Stepper';
import { toast } from '../components/common/Toast';
import { SituationBoard } from '../components/board/SituationBoard';
import { SubmissionCard } from '../components/board/SubmissionCard';
import { OpinionForm } from '../components/forms/OpinionForm';
import { PinInput } from '../components/forms/PinInput';
import { clearDraft, readDraft, useLocalDraft, writeDraft } from '../hooks/useLocalDraft';
import { mergeBoard } from '../lib/board';
import { computeTitles } from '../lib/titles';
import { cleanFields, pinSchema, validateSubmissionFields } from '../lib/validate';
import { getBackend, getOutbox, isDemoMode } from '../services';
import { useAppStore } from '../stores/appStore';
import {
  emptyFieldsFor,
  emptyTruthFields,
  type BoardData,
  type Mode,
  type Submission,
  type SubmissionFields,
} from '../types';

type Tab = 'board' | 'write' | 'plaza';

export function Court() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { identity, setSession } = useAppStore();
  const backend = getBackend();

  const [tab, setTab] = useState<Tab>('board');
  const [fields, setFields] = useState<SubmissionFields>(emptyTruthFields());
  const [pin, setPin] = useState('');
  const [restored, setRestored] = useState(false);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editPin, setEditPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [serverSavedAt, setServerSavedAt] = useState<string | null>(null);
  const lastSynced = useRef<string>('');

  // 미입장 시 입장 화면으로
  useEffect(() => {
    if (!identity) navigate('/join');
  }, [identity, navigate]);

  // 입장(재입장) — 세션 + 내 제출물 로드
  const joinQuery = useQuery({
    queryKey: ['join', code, identity?.studentId],
    enabled: !!identity,
    staleTime: Infinity,
    queryFn: () =>
      backend.join({ code, studentId: identity!.studentId, name: identity!.name, confirmName: true }),
  });

  // 종료(closed) 세션 읽기 전용 폴백 (기획안 M2 — 종료 후 읽기 전용):
  // 서버 join은 closed 세션에 NOT_FOUND를 주므로, 실패 시 getSession으로 세션을 조회해
  // 이미 참여했던 학생에게는 열람 전용 화면을 제공한다. (Code.gs 무변경 유지)
  const fallbackQuery = useQuery({
    queryKey: ['sessionReadOnly', code, identity?.studentId],
    enabled: !!identity && joinQuery.isError,
    retry: false,
    queryFn: () => backend.getSession(code, identity!.studentId),
  });

  const readOnlyMode = !joinQuery.data && !!fallbackQuery.data;
  const session = joinQuery.data?.session ?? fallbackQuery.data?.session ?? null;
  const student = joinQuery.data?.student ?? fallbackQuery.data?.student ?? null;
  const sessionClosed =
    session?.status === 'closed' || session?.status === 'archived' || readOnlyMode;

  // 임시저장 복원 (기획안 §7.4-3): 시트 draft vs LocalStorage draft 중 선택
  useEffect(() => {
    if (!joinQuery.data || restored) return;
    const serverSub = joinQuery.data.mySubmission;
    const localDraft = readDraft(joinQuery.data.session.session_id);
    setMySubmission(serverSub);
    setSession({
      code: joinQuery.data.session.code,
      sessionId: joinQuery.data.session.session_id,
      team: joinQuery.data.student.team,
      roleId: joinQuery.data.student.role_id,
    });

    const mode: Mode = joinQuery.data.session.mode;
    const apply = (f: SubmissionFields, p: string) => {
      const base = emptyFieldsFor(mode);
      const merged = { ...base, ...f } as SubmissionFields;
      // 반복 블록은 최소 1개 유지
      if (!merged.evidences?.length) merged.evidences = emptyFieldsFor(mode).evidences;
      if ('rebuttal' in merged && !merged.rebuttal?.length && 'rebuttal' in base) {
        merged.rebuttal = base.rebuttal;
      }
      setFields(merged);
      if (p) setPin(p);
    };

    void (async () => {
      if (serverSub && serverSub.status !== 'draft') {
        // 이미 제출됨 — 제출본 표시, 로컬 draft는 제출 완료로 간주하고 정리
        clearDraft(joinQuery.data.session.session_id);
        apply(serverSub.fields, '');
      } else if (serverSub && localDraft) {
        const serverNewer = serverSub.updated_at > localDraft.updatedAt;
        const differs = JSON.stringify(serverSub.fields) !== JSON.stringify(localDraft.fields);
        if (differs) {
          const useLocal = await confirmDialog({
            title: '임시저장 복원',
            message: `저장본이 두 개 있습니다. 어느 쪽을 이어서 쓸까요?\n\n· 이 기기 저장본: ${new Date(localDraft.updatedAt).toLocaleString()}\n· 서버 저장본: ${new Date(serverSub.updated_at).toLocaleString()}\n\n(${serverNewer ? '서버' : '이 기기'} 쪽이 더 최신입니다)`,
            confirmText: '이 기기 저장본',
            cancelText: '서버 저장본',
          });
          if (useLocal) apply(localDraft.fields, localDraft.pin);
          else apply(serverSub.fields, '');
        } else {
          apply(localDraft.fields, localDraft.pin);
        }
        toast('작성 중이던 의견서를 복원했습니다.', 'success');
      } else if (localDraft) {
        apply(localDraft.fields, localDraft.pin);
        toast('작성 중이던 의견서를 복원했습니다.', 'success');
      } else if (serverSub) {
        apply(serverSub.fields, '');
        toast('서버에 임시저장된 의견서를 복원했습니다.', 'success');
      } else {
        // 저장본 없음 — 세션 모드에 맞는 빈 양식으로 초기화 (court는 §6.2 양식)
        apply(emptyFieldsFor(mode), '');
      }
      setRestored(true);
    })();
  }, [joinQuery.data, restored, setSession]);

  const isSubmitted = !!mySubmission && mySubmission.status !== 'draft';
  const canWrite = restored && !sessionClosed && (!isSubmitted || editMode);

  // 1단계: LocalStorage 자동 저장 (5초 디바운스)
  const localSavedAt = useLocalDraft(session?.session_id ?? '', fields, pin, canWrite && !!session);

  // 2단계: 60초 주기 서버 draft 저장 (변경분 있을 때만)
  const saveDraftToServer = useCallback(
    async (manual = false) => {
      if (!session || !identity || isSubmitted || sessionClosed) return;
      const snapshot = JSON.stringify(fields);
      if (!manual && snapshot === lastSynced.current) return;
      try {
        const res = await backend.saveDraft({
          sessionId: session.session_id,
          studentId: identity.studentId,
          fields,
          pin: pin || undefined,
        });
        lastSynced.current = snapshot;
        setServerSavedAt(res.updated_at);
        if (manual) toast('임시저장 완료 (서버 기록)', 'success');
      } catch (err) {
        if (manual) toast(err instanceof Error ? err.message : '임시저장 실패', 'error');
      }
    },
    [backend, session, identity, fields, pin, isSubmitted, sessionClosed],
  );

  useEffect(() => {
    if (!canWrite || isSubmitted) return;
    const t = setInterval(() => void saveDraftToServer(false), 60_000);
    return () => clearInterval(t);
  }, [canWrite, isSubmitted, saveDraftToServer]);

  // 광장 폴링 — 탭 활성 시에만, 12초 ± 2초 지터 (기획안 §5.3)
  // M3: since(boardVersion) 증분 폴링 — 이전 전체본과 병합해 완전한 광장을 유지한다
  const interval = useMemo(() => 12_000 + Math.round((Math.random() * 2 - 1) * 2_000), []);
  const boardCache = useRef<{ sessionId: string; data?: BoardData }>({ sessionId: '' });
  const boardQuery = useQuery({
    queryKey: ['board', session?.session_id],
    enabled: !!session && !!identity && tab === 'plaza',
    refetchInterval: interval,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const sid = session!.session_id;
      const prev = boardCache.current.sessionId === sid ? boardCache.current.data : undefined;
      const res = await backend.getBoard(
        sid,
        identity!.studentId,
        prev && prev.boardVersion ? String(prev.boardVersion) : undefined,
      );
      const merged = mergeBoard(prev, res);
      boardCache.current = { sessionId: sid, data: merged };
      return merged;
    },
  });

  const submit = async () => {
    if (!session || !identity) return;
    const cleaned = cleanFields(session.mode, fields);
    const fieldError = validateSubmissionFields(session.mode, cleaned);
    if (fieldError) return toast(fieldError, 'warn');
    const pinCheck = pinSchema.safeParse(pin);
    if (!pinCheck.success) return toast(pinCheck.error.issues[0].message, 'warn');
    const yes = await confirmDialog({
      title: '의견서 제출',
      message: '제출하면 배심원 광장에 공개됩니다.\n제출 후 수정은 PIN으로만 가능합니다. 제출할까요?',
      confirmText: '제출',
    });
    if (!yes) return;
    setSaving(true);
    try {
      const res = await backend.submitOpinion({
        sessionId: session.session_id,
        studentId: identity.studentId,
        fields: cleaned,
        pin,
      });
      setMySubmission(res.submission);
      setEditMode(false);
      clearDraft(session.session_id); // 제출 성공 시 로컬 draft 삭제 (기획안 §7.3)
      toast('의견서가 제출되었습니다. 배심원 광장에서 확인하세요.', 'success');
      setTab('plaza');
      void queryClient.invalidateQueries({ queryKey: ['board'] });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'OFFLINE') {
        writeDraft(session.session_id, cleaned, pin);
        toast('연결 실패 — 제출 내용은 저장 대기 중입니다. 연결 복구 후 다시 제출하세요.', 'warn');
      } else {
        toast(err instanceof Error ? err.message : '제출에 실패했습니다.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!mySubmission || !session) return;
    const cleaned = cleanFields(session.mode, fields);
    const fieldError = validateSubmissionFields(session.mode, cleaned);
    if (fieldError) return toast(fieldError, 'warn');
    const pinCheck = pinSchema.safeParse(editPin);
    if (!pinCheck.success) return toast(pinCheck.error.issues[0].message, 'warn');
    setSaving(true);
    try {
      const res = await backend.updateSubmission({
        submissionId: mySubmission.submission_id,
        pin: editPin,
        fields: cleaned,
      });
      setMySubmission(res.submission);
      setEditMode(false);
      toast('의견서를 수정했습니다. (재심의 대상이 됩니다)', 'success');
      void queryClient.invalidateQueries({ queryKey: ['board'] });
    } catch (err) {
      toast(err instanceof Error ? err.message : '수정에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (joinQuery.isLoading || (joinQuery.isError && fallbackQuery.isLoading) || !identity) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-faint">법정 입장 중…</main>;
  }
  if (!session || !student) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-seal">
          {session && !student
            ? '종료된 사건입니다. 참여 기록이 있는 학생만 열람할 수 있습니다.'
            : joinQuery.error instanceof Error
              ? joinQuery.error.message
              : '사건을 찾을 수 없습니다.'}
        </p>
        <button type="button" className="btn-ghost" onClick={() => navigate('/join')}>
          입장 화면으로
        </button>
      </main>
    );
  }

  const step: StepIndex = isSubmitted ? 3 : 1;
  const board = boardQuery.data;
  const comments = board?.comments ?? [];
  // M3: show_likes 옵션은 폴링 응답에 실려 실시간 반영 (구버전 서버는 세션 값 사용)
  const showLikes = board?.showLikes ?? session.show_likes;
  // M3: 칭호 뱃지 — 세션 내 광장 데이터만으로 계산, 리더보드 없음 (기획안 R23)
  const titleMap = computeTitles(board?.submissions ?? [], comments);
  const outboxCount = backend.kind === 'remote' ? getOutbox().length : 0;
  // court 모드 — 내 역할팀 배지 (기획안 §6.2)
  const myRoleName =
    session.mode === 'court' ? session.roles.find((r) => r.id === student.role_id)?.name ?? '' : '';

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-3 pb-16 pt-4">
      {/* 헤더 */}
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-lg font-black text-ink">{session.title}</h1>
          <p className="flex flex-wrap items-center gap-1 text-xs text-faint">
            {myRoleName && <RoleBadge name={myRoleName} mine />}
            <span>
              {session.class_name && `${session.class_name} · `}코드 {session.code} ·{' '}
              {student.team || '모둠 미정'} · {identity.name} ({identity.studentId})
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode() && <DemoBadge />}
          {sessionClosed && (
            <span className="border border-seal bg-seal/10 px-2 py-0.5 text-xs font-bold text-seal">폐정(종료)</span>
          )}
        </div>
      </header>

      <div className="mb-4">
        <Stepper current={step} />
      </div>

      {/* 탭 */}
      <nav className="mb-4 flex border-b-2 border-ink/60">
        {(
          [
            ['board', '상황판', Landmark],
            ['write', '의견서 작성', FileText],
            ['plaza', '배심원 광장', Users],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm ${
              tab === key ? 'bg-ink font-bold text-white' : 'text-faint hover:text-ink'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </nav>

      {tab === 'board' && (
        <SituationBoard
          title={session.title}
          body={session.situation_board}
          mode={session.mode}
          roles={session.roles}
          myRoleId={student.role_id}
        />
      )}

      {tab === 'write' && (
        <section className="doc-frame">
          <div className="doc-frame-inner">
            <div className="flex items-center justify-between border-b-2 border-ink/60 pb-2">
              <h2 className="font-serif text-lg font-bold">의견서</h2>
              <span className="text-xs text-faint">
                {isSubmitted && !editMode
                  ? '제출 완료'
                  : serverSavedAt
                    ? `서버 저장 ${new Date(serverSavedAt).toLocaleTimeString()}`
                    : localSavedAt
                      ? '이 기기에 방금 저장됨'
                      : '자동 저장 대기'}
              </span>
            </div>

            {sessionClosed && (
              <p className="mt-3 border border-seal/40 bg-seal/5 px-3 py-2 text-xs text-seal">
                종료된 사건입니다. 열람만 가능합니다 — 제출된 의견서는 [배심원 광장]에서 확인하세요.
              </p>
            )}

            {!sessionClosed && (
              <div className="mt-4">
                <OpinionForm
                  mode={session.mode}
                  questions={session.questions}
                  fields={fields}
                  onChange={setFields}
                  situationText={session.situation_board}
                  roleName={myRoleName || undefined}
                  disabled={!canWrite}
                />
              </div>
            )}

            {/* 하단 액션 */}
            {!sessionClosed && (
              <div className="mt-6 space-y-4 border-t border-line pt-4">
                {!isSubmitted && (
                  <>
                    <PinInput value={pin} onChange={setPin} />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-ghost flex items-center gap-1"
                        onClick={() => {
                          if (session) writeDraft(session.session_id, fields, pin);
                          void saveDraftToServer(true);
                        }}
                      >
                        <Save size={14} /> 임시저장
                      </button>
                      <button type="button" className="btn-primary" disabled={saving} onClick={() => void submit()}>
                        {saving ? '제출 중…' : '의견서 제출 (송고)'}
                      </button>
                    </div>
                  </>
                )}
                {isSubmitted && !editMode && (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-approve">제출이 완료된 의견서입니다.</p>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        setEditMode(true);
                        setEditPin('');
                      }}
                    >
                      수정하기 (PIN 필요)
                    </button>
                    {mySubmission && (
                      <Link
                        to={`/print/${session.session_id}?sub=${mySubmission.submission_id}`}
                        className="btn-ghost flex items-center gap-1"
                      >
                        <FileDown size={14} /> 내 의견서 PDF
                      </Link>
                    )}
                  </div>
                )}
                {isSubmitted && editMode && (
                  <div className="space-y-3">
                    <PinInput value={editPin} onChange={setEditPin} label="제출할 때 정한 PIN" />
                    <div className="flex gap-2">
                      <button type="button" className="btn-ghost" onClick={() => setEditMode(false)}>
                        취소
                      </button>
                      <button type="button" className="btn-primary" disabled={saving} onClick={() => void saveEdit()}>
                        {saving ? '저장 중…' : '수정 저장'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'plaza' && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold">배심원 광장</h2>
            <RefreshIndicator
              updatedAt={boardQuery.dataUpdatedAt}
              isFetching={boardQuery.isFetching}
              isError={boardQuery.isError}
              onRefresh={() => void boardQuery.refetch()}
              pendingCount={outboxCount}
            />
          </div>
          {!board || board.submissions.length === 0 ? (
            <p className="border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-faint">
              아직 제출된 의견서가 없습니다. 첫 배심원이 되어 보세요.
            </p>
          ) : (
            <div className="space-y-4">
              {board.submissions.map((sub, i) => (
                <SubmissionCard
                  key={sub.submission_id}
                  submission={sub}
                  index={i + 1}
                  comments={comments.filter((c) => c.submission_id === sub.submission_id)}
                  likeCount={board.likeCounts[sub.submission_id] ?? 0}
                  liked={board.myLikes.includes(sub.submission_id)}
                  showLikes={showLikes}
                  roles={session.roles}
                  titles={titleMap.get(sub.student_id)}
                  isMine={sub.student_id === identity.studentId}
                  readOnly={sessionClosed}
                  onToggleLike={async () => {
                    try {
                      await backend.toggleLike({ submissionId: sub.submission_id, studentId: identity.studentId });
                      void boardQuery.refetch();
                    } catch (err) {
                      toast(err instanceof Error ? err.message : '공감 처리에 실패했습니다.', 'error');
                    }
                  }}
                  onAddComment={async (text) => {
                    try {
                      await backend.addComment({
                        submissionId: sub.submission_id,
                        studentId: identity.studentId,
                        name: identity.name,
                        team: student.team,
                        text,
                      });
                      void boardQuery.refetch();
                    } catch (err) {
                      toast(err instanceof Error ? err.message : '댓글 등록에 실패했습니다.', 'error');
                      throw err;
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
