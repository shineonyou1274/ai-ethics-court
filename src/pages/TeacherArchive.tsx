// S7 — 학기 누적: 학생별(학번) 활동 집계표 + CSV 다운로드 (기획안 §2, §9)
// 폴링 없음 — 학기말 수동 1회성 조회 (기획안 §5.3). 집계는 서버(getStudentStats)에서 수행.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronLeft, ChevronRight, Download, RefreshCw, Scale } from 'lucide-react';
import { MODE_LABELS } from '../api/contract';
import { DemoBadge } from '../components/common/Badge';
import { toast } from '../components/common/Toast';
import { downloadCsv } from '../lib/csv';
import { getBackend, isDemoMode } from '../services';
import { useAppStore } from '../stores/appStore';
import type { Mode, StudentStat, SubmissionStatus } from '../types';

type SortKey =
  | 'student_id'
  | 'name'
  | 'session_count'
  | 'submitted_count'
  | 'approved_count'
  | 'rejected_count'
  | 'likes_received'
  | 'likes_given'
  | 'comments_written'
  | 'comments_received'
  | 'last_activity';

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'student_id', label: '학번', numeric: false },
  { key: 'name', label: '이름', numeric: false },
  { key: 'session_count', label: '참여 세션', numeric: true },
  { key: 'submitted_count', label: '제출 의견서', numeric: true },
  { key: 'approved_count', label: '승인', numeric: true },
  { key: 'rejected_count', label: '반려', numeric: true },
  { key: 'likes_received', label: '받은 공감', numeric: true },
  { key: 'likes_given', label: '누른 공감', numeric: true },
  { key: 'comments_written', label: '작성 댓글', numeric: true },
  { key: 'comments_received', label: '받은 댓글', numeric: true },
  { key: 'last_activity', label: '최종 활동', numeric: false },
];

const SUB_STATUS_LABEL: Record<SubmissionStatus, string> = {
  draft: '작성 중',
  submitted: '제출',
  approved: '승인',
  rejected: '반려',
  deleted: '삭제',
};

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export function TeacherArchive() {
  const navigate = useNavigate();
  const { teacherKey } = useAppStore();
  const backend = getBackend();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('student_id');
  const [sortDesc, setSortDesc] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // 교사 모드 보호: 키 미보유 시 교사 홈(키 입력 화면)으로
  useEffect(() => {
    if (!teacherKey) navigate('/teacher');
  }, [teacherKey, navigate]);

  const statsQuery = useQuery({
    queryKey: ['studentStats', teacherKey, backend.kind, from, to],
    enabled: !!teacherKey,
    staleTime: Infinity, // 1회성 — 수동 [다시 집계]로만 갱신
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: () =>
      backend.getStudentStats(teacherKey, { from: from || undefined, to: to || undefined }),
  });

  const stats = useMemo(() => statsQuery.data?.stats ?? [], [statsQuery.data]);
  const guarded = !teacherKey;

  // 학급 필터 목록 — 참여 세션의 class_name에서 수집
  const classNames = useMemo(() => {
    const set = new Set<string>();
    for (const s of stats) for (const d of s.sessions) if (d.class_name) set.add(d.class_name);
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'));
  }, [stats]);

  const visible = useMemo(() => {
    let list = stats;
    if (classFilter) {
      list = list.filter((s) => s.sessions.some((d) => d.class_name === classFilter));
    }
    const dir = sortDesc ? -1 : 1;
    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), 'ko') * dir;
    });
  }, [stats, classFilter, sortKey, sortDesc]);

  const clickSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc((v) => !v);
    else {
      setSortKey(key);
      setSortDesc(COLUMNS.find((c) => c.key === key)?.numeric ?? false); // 숫자 열은 내림차순 우선
    }
  };

  const exportCsv = () => {
    if (visible.length === 0) return toast('내보낼 데이터가 없습니다.', 'warn');
    const headers = [
      '학번', '이름', '참여 세션 수', '제출 의견서 수', '승인 수', '반려 수',
      '받은 공감 수', '누른 공감 수', '작성 댓글 수', '받은 댓글 수',
      '최초 활동일', '최종 활동일', '참여 세션 목록',
    ];
    const rows = visible.map((s) => [
      s.student_id, s.name, s.session_count, s.submitted_count, s.approved_count, s.rejected_count,
      s.likes_received, s.likes_given, s.comments_written, s.comments_received,
      s.first_activity, s.last_activity,
      s.sessions.map((d) => `${d.title}${d.class_name ? `(${d.class_name})` : ''}`).join('; '),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    // P1-1: 학번(0열)은 텍스트 강제 — 엑셀의 "0113"→113 숫자 변환 차단
    downloadCsv(`AI윤리법정_학생별집계_${today}.csv`, headers, rows, [0]);
    toast('CSV 파일을 내려받았습니다. (엑셀 호환 UTF-8)', 'success');
  };

  if (guarded) return null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-16 pt-8">
      <Link to="/teacher" className="mb-3 inline-flex items-center gap-1 text-xs text-faint hover:text-ink">
        <ChevronLeft size={13} /> 교사 홈
      </Link>

      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-black">
            <Scale size={22} /> 학기 누적 집계부
          </h1>
          <p className="mt-1 text-xs text-faint">
            학번 기준으로 시트에 누적된 전체 세션의 활동을 집계합니다. 읽기 전용 — 삭제된 의견서·댓글은 제외됩니다.
          </p>
        </div>
        {isDemoMode() && <DemoBadge />}
      </header>

      {/* 필터 · 액션 */}
      <div className="mb-4 flex flex-wrap items-end gap-3 border border-line bg-card px-4 py-3 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-faint">기간(세션 개정일) 시작</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-base py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-faint">기간 끝</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-base py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-faint">학급</span>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="input-base py-1"
          >
            <option value="">전체</option>
            {classNames.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn-ghost flex items-center gap-1 py-1.5"
          disabled={statsQuery.isFetching}
          onClick={() => void statsQuery.refetch()}
        >
          <RefreshCw size={13} className={statsQuery.isFetching ? 'animate-spin' : ''} /> 다시 집계
        </button>
        <button
          type="button"
          className="btn-primary flex items-center gap-1 py-1.5"
          disabled={visible.length === 0}
          onClick={exportCsv}
        >
          <Download size={13} /> CSV 다운로드
        </button>
        <span className="ml-auto text-faint">
          학생 {visible.length}명{classFilter && ` (${classFilter})`}
        </span>
      </div>

      {statsQuery.isLoading ? (
        <p className="border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-faint">
          집계 중… (누적 데이터가 많으면 수 초 걸릴 수 있습니다)
        </p>
      ) : statsQuery.isError ? (
        <p className="border border-seal/50 bg-seal/5 px-4 py-4 text-sm text-seal">
          {statsQuery.error instanceof Error ? statsQuery.error.message : '집계에 실패했습니다.'}
        </p>
      ) : visible.length === 0 ? (
        <p className="border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-faint">
          집계할 학생 활동이 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto border-2 border-ink/70 bg-card">
          <table className="w-full min-w-[860px] text-xs">
            <thead>
              <tr className="border-b-2 border-ink/60 bg-paper text-left">
                <th className="w-6 px-2 py-2" aria-label="상세" />
                {COLUMNS.map((c) => (
                  <th key={c.key} className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => clickSort(c.key)}
                      className={`font-bold ${sortKey === c.key ? 'text-ink underline' : 'text-faint hover:text-ink'}`}
                    >
                      {c.label}
                      {sortKey === c.key && (sortDesc ? ' ▾' : ' ▴')}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <StudentRows
                  key={s.student_id}
                  stat={s}
                  expanded={expanded === s.student_id}
                  onToggle={() => setExpanded((v) => (v === s.student_id ? null : s.student_id))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function StudentRows({
  stat: s,
  expanded,
  onToggle,
}: {
  stat: StudentStat;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-b border-line hover:bg-paper">
        <td className="px-2 py-1.5">
          <button type="button" onClick={onToggle} className="text-faint hover:text-ink" aria-label="세션 상세">
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        </td>
        <td className="px-2 py-1.5 font-mono font-bold text-ink">{s.student_id}</td>
        <td className="px-2 py-1.5">{s.name || '—'}</td>
        <td className="px-2 py-1.5">{s.session_count}</td>
        <td className="px-2 py-1.5">{s.submitted_count}</td>
        <td className="px-2 py-1.5 text-approve">{s.approved_count}</td>
        <td className="px-2 py-1.5 text-seal">{s.rejected_count}</td>
        <td className="px-2 py-1.5">{s.likes_received}</td>
        <td className="px-2 py-1.5">{s.likes_given}</td>
        <td className="px-2 py-1.5">{s.comments_written}</td>
        <td className="px-2 py-1.5">{s.comments_received}</td>
        <td className="px-2 py-1.5 text-faint">{fmtDate(s.last_activity)}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-line bg-paper/60">
          <td />
          <td colSpan={COLUMNS.length} className="px-2 py-2">
            {s.sessions.length === 0 ? (
              <span className="text-faint">참여 세션 없음</span>
            ) : (
              <ul className="space-y-1">
                {s.sessions.map((d) => (
                  <li key={d.session_id} className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink">{d.title || '(제목 없음)'}</span>
                    <span className="text-faint">
                      {d.mode && MODE_LABELS[d.mode as Mode] ? MODE_LABELS[d.mode as Mode] : d.mode}
                      {d.class_name && ` · ${d.class_name}`} · 입장 {fmtDate(d.joined_at)}
                    </span>
                    {d.submission_id ? (
                      <>
                        <span
                          className={`border px-1.5 py-0.5 ${
                            d.submission_status === 'approved'
                              ? 'border-approve text-approve'
                              : d.submission_status === 'rejected'
                                ? 'border-seal text-seal'
                                : 'border-line text-faint'
                          }`}
                        >
                          {d.submission_status ? SUB_STATUS_LABEL[d.submission_status] : '—'}
                        </span>
                        <Link
                          to={`/print/${d.session_id}?sub=${d.submission_id}`}
                          className="text-faint underline hover:text-ink"
                        >
                          의견서 보기
                        </Link>
                      </>
                    ) : (
                      <span className="text-faint">의견서 없음</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
