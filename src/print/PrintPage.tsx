// S8 — 인쇄용 라이트 템플릿 (기획안 §2 S8, R05, §10 M2)
// - 화면 테마와 무관하게 흰 배경 A4 페이지로 렌더 → html2canvas 페이지별 캡처 → jsPDF 병합
// - 장문 캡처 품질 문제 회피: 콘텐츠를 블록 단위로 측정해 A4 페이지로 "미리 분할" (기획안 §11.3)
// - 한글 폰트 깨짐 방지: document.fonts.ready 대기 후 측정·캡처 (기획안 §12 #8)
// 데이터 경로: 교사(teacherKey) → listSessions + getTeacherBoard / 학생 → getSession(code) + getBoard

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ChevronLeft, FileDown, Loader2 } from 'lucide-react';
import { JUDGMENT_LABELS, MODE_LABELS } from '../api/contract';
import { toast } from '../components/common/Toast';
import { getBackend } from '../services';
import { useAppStore } from '../stores/appStore';
import {
  isCourtFields,
  isTruthFields,
  type CommentRow,
  type Session,
  type Submission,
} from '../types';

// A4 @96dpi: 794 × 1123px. 여백 48px, 하단 쪽번호 영역 28px.
const PAGE_W = 794;
const PAGE_H = 1123;
const PAD = 48;
const CONTENT_W = PAGE_W - PAD * 2;
const CONTENT_H = PAGE_H - PAD * 2 - 28;
const BLOCK_GAP = 10; // 페이지 내 블록 간 간격(px) — 측정 시 합산

interface Block {
  key: string;
  node: ReactNode;
}

export function PrintPage() {
  const { sessionId = '' } = useParams();
  const [params] = useSearchParams();
  const onlySubId = params.get('sub') ?? '';
  const { teacherKey, identity, session: storedSession } = useAppStore();
  const backend = getBackend();

  // ---- 데이터 로드 (교사 경로 우선, 학생 폴백) ----
  const isTeacherPath = !!teacherKey;
  const canStudentPath = !!identity && storedSession?.sessionId === sessionId && !!storedSession?.code;

  const dataQuery = useQuery({
    queryKey: ['print', sessionId, onlySubId, isTeacherPath],
    enabled: isTeacherPath || canStudentPath,
    retry: false,
    queryFn: async (): Promise<{ session: Session; submissions: Submission[]; comments: CommentRow[]; likeCounts: Record<string, number> }> => {
      if (isTeacherPath) {
        const { sessions } = await backend.listSessions(teacherKey);
        const session = sessions.find((s) => s.session_id === sessionId);
        if (!session) throw new Error('사건을 찾을 수 없습니다.');
        const board = await backend.getTeacherBoard(sessionId, teacherKey);
        return {
          session,
          submissions: board.submissions.filter((s) => s.status !== 'draft' && s.status !== 'deleted'),
          comments: board.comments,
          likeCounts: board.likeCounts,
        };
      }
      const { session } = await backend.getSession(storedSession!.code, identity!.studentId);
      if (session.session_id !== sessionId) throw new Error('사건을 찾을 수 없습니다.');
      const board = await backend.getBoard(sessionId, identity!.studentId);
      return { session, submissions: board.submissions, comments: board.comments, likeCounts: board.likeCounts };
    },
  });

  const data = dataQuery.data;
  const submissions = data
    ? onlySubId
      ? data.submissions.filter((s) => s.submission_id === onlySubId)
      : data.submissions
    : [];

  // ---- 블록 구성 → 측정 → 페이지 분할 ----
  const blocks: Block[] = data ? buildBlocks(data.session, submissions, data.comments, data.likeCounts, !!onlySubId) : [];
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[][] | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      // 인쇄 URL로 직행하면 세리프 폰트 로드가 아직 시작 전일 수 있어 명시적으로 로드한다
      try {
        await Promise.all([
          document.fonts.load('900 26px "Noto Serif KR"'),
          document.fonts.load('700 15px "Noto Serif KR"'),
          document.fonts.load('400 13px "Noto Sans KR"'),
          document.fonts.load('700 13px "Noto Sans KR"'),
        ]);
      } catch {
        // 로드 실패 시에도 fonts.ready 이후 진행 (시스템 폰트로 대체)
      }
      await document.fonts.ready;
      if (alive) setFontsReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (!fontsReady || !measureRef.current || blocks.length === 0) return;
    const children = Array.from(measureRef.current.children) as HTMLElement[];
    const grouped: number[][] = [];
    let current: number[] = [];
    let h = 0;
    children.forEach((el, i) => {
      const bh = el.offsetHeight + BLOCK_GAP;
      if (current.length > 0 && h + bh > CONTENT_H) {
        grouped.push(current);
        current = [];
        h = 0;
      }
      current.push(i);
      h += bh;
    });
    if (current.length > 0) grouped.push(current);
    setPages(grouped);
    // blocks는 data에서 파생 — data 갱신 시에만 재측정
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsReady, data, onlySubId]);

  // ---- PDF 저장 ----
  const exportPdf = async () => {
    if (!pages || !data) return;
    setExporting(true);
    try {
      await document.fonts.ready;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      for (let i = 0; i < pages.length; i++) {
        const el = pageRefs.current[i];
        if (!el) continue;
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', logging: false });
        const img = canvas.toDataURL('image/jpeg', 0.92);
        if (i > 0) doc.addPage();
        doc.addImage(img, 'JPEG', 0, 0, 210, 297);
      }
      const name = onlySubId
        ? `의견서_${submissions[0]?.student_name ?? ''}_${data.session.title}.pdf`
        : `판례집_${data.session.title}.pdf`;
      doc.save(name);
      toast('PDF를 저장했습니다.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'PDF 생성에 실패했습니다.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // ---- 렌더 ----
  if (!isTeacherPath && !canStudentPath) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-seal">인쇄 화면에 접근할 수 없습니다. 교사 키 등록 또는 해당 사건 참여가 필요합니다.</p>
        <Link to="/" className="btn-ghost">처음으로</Link>
      </main>
    );
  }
  if (dataQuery.isLoading || !fontsReady) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-faint">인쇄 준비 중…</main>;
  }
  if (dataQuery.isError || !data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-seal">
          {dataQuery.error instanceof Error ? dataQuery.error.message : '데이터를 불러오지 못했습니다.'}
        </p>
        <Link to="/" className="btn-ghost">처음으로</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-faint/20 pb-16">
      {/* 상단 도구 막대 — 캡처 대상 아님 */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            to={teacherKey ? `/teacher/session/${sessionId}` : `/court/${storedSession?.code ?? ''}`}
            className="inline-flex items-center gap-1 text-xs text-faint hover:text-ink"
          >
            <ChevronLeft size={13} /> 돌아가기
          </Link>
          <h1 className="font-serif text-base font-bold text-ink">
            {onlySubId ? '의견서 인쇄' : '판례집 인쇄'} — {data.session.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-faint">{pages ? `A4 ${pages.length}쪽` : '분할 계산 중…'}</span>
          <button
            type="button"
            className="btn-primary flex items-center gap-1"
            disabled={!pages || exporting}
            onClick={() => void exportPdf()}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            {exporting ? 'PDF 생성 중…' : 'PDF 저장'}
          </button>
        </div>
      </div>

      {submissions.length === 0 ? (
        <p className="mx-auto mt-10 max-w-lg border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-faint">
          인쇄할 의견서가 없습니다. (제출된 의견서만 판례집에 실립니다)
        </p>
      ) : (
        <>
          {/* 측정용 오프스크린 컨테이너 — 페이지와 동일한 폭 */}
          <div
            ref={measureRef}
            aria-hidden
            className="print-light absolute -left-[9999px] top-0 bg-white"
            style={{ width: CONTENT_W }}
          >
            {blocks.map((b) => (
              <div key={b.key} style={{ marginBottom: BLOCK_GAP }}>
                {b.node}
              </div>
            ))}
          </div>

          {/* A4 페이지 렌더 (캡처 대상) */}
          {pages && (
            <div className="mx-auto mt-6 flex flex-col items-center gap-6">
              {pages.map((blockIdxs, pi) => (
                <div
                  key={pi}
                  ref={(el) => {
                    pageRefs.current[pi] = el;
                  }}
                  className="print-light relative overflow-hidden bg-white shadow-md"
                  style={{ width: PAGE_W, height: PAGE_H, padding: PAD }}
                >
                  {blockIdxs.map((bi) => (
                    <div key={blocks[bi].key} style={{ marginBottom: BLOCK_GAP }}>
                      {blocks[bi].node}
                    </div>
                  ))}
                  <span
                    className="absolute bottom-5 left-0 right-0 text-center text-[11px]"
                    style={{ color: '#6B7280' }}
                  >
                    - {pi + 1} / {pages.length} -
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

// ================= 블록 빌더 (인쇄 전용 라이트 마크업 — 흰 배경, 잉크 텍스트) =================

const INK = '#1F2A44';
const FAINT = '#6B7280';
const LINE = '#D9D2C3';
const SEAL = '#8C2F2F';
const APPROVE = '#2F6B4F';

function buildBlocks(
  session: Session,
  submissions: Submission[],
  comments: CommentRow[],
  likeCounts: Record<string, number>,
  single: boolean,
): Block[] {
  const blocks: Block[] = [];
  const roleName = (id: string) => session.roles.find((r) => r.id === id)?.name ?? '';

  // 표지/머리 블록
  blocks.push({
    key: 'cover',
    node: (
      <div style={{ color: INK, borderBottom: `3px double ${INK}`, paddingBottom: 12 }}>
        <p className="font-serif" style={{ fontSize: 13, letterSpacing: 4, color: FAINT }}>
          AI 윤리 법정 — {single ? '의 견 서' : '판 례 집'}
        </p>
        <h1 className="font-serif" style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>
          {session.title}
        </h1>
        <p style={{ fontSize: 12, color: FAINT, marginTop: 6 }}>
          {MODE_LABELS[session.mode]} 모드
          {session.class_name ? ` · ${session.class_name}` : ''} · 발행일{' '}
          {new Date().toLocaleDateString('ko-KR')}
          {single ? '' : ` · 수록 의견서 ${submissions.length}건`}
        </p>
      </div>
    ),
  });

  // 사건 상황판
  blocks.push({
    key: 'situation',
    node: (
      <div style={{ color: INK, border: `1px solid ${LINE}`, padding: 12 }}>
        <p className="font-serif" style={{ fontSize: 13, fontWeight: 700 }}>
          사건 상황판
        </p>
        <p style={{ fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.7, marginTop: 6 }}>
          {session.situation_board}
        </p>
        {session.mode === 'court' && session.roles.length > 0 && (
          <p style={{ fontSize: 12, marginTop: 8, color: FAINT }}>
            역할팀: {session.roles.map((r) => r.name).join(' · ')}
          </p>
        )}
      </div>
    ),
  });

  submissions.forEach((sub, i) => {
    const subComments = comments.filter((c) => c.submission_id === sub.submission_id);
    const likes = likeCounts[sub.submission_id] ?? 0;

    // 의견서 머리
    blocks.push({
      key: `${sub.submission_id}-head`,
      node: (
        <div
          style={{
            color: INK,
            borderTop: `2px solid ${INK}`,
            borderBottom: `1px solid ${LINE}`,
            padding: '10px 2px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <span className="font-serif" style={{ fontSize: 15, fontWeight: 700 }}>
            제 {i + 1}호 의견서
            {sub.mode === 'court' && sub.role_id ? (
              <span style={{ fontSize: 12, marginLeft: 8, border: `1px solid ${INK}`, padding: '1px 6px' }}>
                {roleName(sub.role_id)}
              </span>
            ) : null}
          </span>
          <span style={{ fontSize: 12, color: FAINT }}>
            {sub.team || '모둠 미정'} · {sub.student_name} ({sub.student_id}) · 공감 {likes}
            {sub.status === 'approved' ? (
              <b style={{ color: APPROVE, marginLeft: 6 }}>[승인]</b>
            ) : sub.status === 'rejected' ? (
              <b style={{ color: SEAL, marginLeft: 6 }}>[반려]</b>
            ) : null}
          </span>
        </div>
      ),
    });

    // 본문 필드 블록
    const f = sub.fields;
    if (isCourtFields(sub.mode, f)) {
      blocks.push(field(`${sub.submission_id}-claim`, '주장', f.claim));
      f.evidences.forEach((e, ei) =>
        blocks.push(
          field(`${sub.submission_id}-ev${ei}`, `근거 ${ei + 1}`, e.claim, `출처: ${e.source}`),
        ),
      );
      f.rebuttal.forEach((r, ri) =>
        blocks.push(
          field(
            `${sub.submission_id}-rb${ri}`,
            `공방 ${ri + 1}`,
            `예상 반박 — ${r.expected}`,
            `대응 — ${r.response}`,
          ),
        ),
      );
    } else if (isTruthFields(sub.mode, f)) {
      blocks.push(
        field(
          `${sub.submission_id}-st`,
          '검증 진술 · 판단',
          f.statement,
          `판단: ${f.judgment ? JUDGMENT_LABELS[f.judgment] : '—'}`,
        ),
      );
      f.evidences.forEach((e, ei) =>
        blocks.push(
          field(`${sub.submission_id}-ev${ei}`, `근거 ${ei + 1}`, e.claim, `출처: ${e.source}`),
        ),
      );
      blocks.push(field(`${sub.submission_id}-rf`, '성찰', f.reflection));
    }

    if (sub.teacher_note && sub.status === 'rejected') {
      blocks.push(field(`${sub.submission_id}-note`, '반려 사유', sub.teacher_note));
    }

    // 배심원 의견 (댓글)
    if (subComments.length > 0) {
      blocks.push({
        key: `${sub.submission_id}-cmt-h`,
        node: (
          <p className="font-serif" style={{ fontSize: 12, fontWeight: 700, color: INK }}>
            배심원 의견 {subComments.length}건
          </p>
        ),
      });
      subComments.forEach((c) =>
        blocks.push({
          key: c.comment_id,
          node: (
            <p style={{ fontSize: 11.5, color: INK, borderLeft: `2px solid ${LINE}`, paddingLeft: 8, lineHeight: 1.6 }}>
              <b>
                {c.author_name}
                {c.author_team ? ` (${c.author_team})` : ''}
              </b>{' '}
              — {c.text}
            </p>
          ),
        }),
      );
    }
  });

  return blocks;
}

function field(key: string, label: string, body: string, sub?: string): Block {
  return {
    key,
    node: (
      <div style={{ color: INK }}>
        <p className="font-serif" style={{ fontSize: 12, fontWeight: 700 }}>
          {label}
        </p>
        <p style={{ fontSize: 12.5, whiteSpace: 'pre-wrap', lineHeight: 1.7, marginTop: 2 }}>{body}</p>
        {sub && (
          <p style={{ fontSize: 11.5, color: FAINT, marginTop: 2, wordBreak: 'break-all' }}>{sub}</p>
        )}
      </div>
    ),
  };
}
