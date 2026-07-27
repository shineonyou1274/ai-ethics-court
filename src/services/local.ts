// LocalStorage 기반 데모/오프라인 백엔드.
// 시트 미연동 상태에서도 전 기능이 동작한다 (단일 기기 한정).
// 검증·권한 로직은 Code.gs와 동일하게 유지한다 (teacherKey, PIN, 하트 중복 방지 등).

import { ApiError, API_VERSION, LS_KEYS } from '../api/contract';
import { compareTeam } from '../lib/board';
import { makeCode, makeId, nowIso } from '../lib/id';
import type {
  BoardData,
  CommentRow,
  JoinResult,
  Session,
  StudentRow,
  StudentStat,
  Submission,
  TeacherBoardData,
} from '../types';
import type {
  AddCommentPayload,
  AdminEditPayload,
  AssignTeamsPayload,
  Backend,
  CreateSessionPayload,
  JoinPayload,
  SaveDraftPayload,
  SetVerdictPayload,
  SubmitOpinionPayload,
  ToggleLikePayload,
  UpdateSessionPayload,
  UpdateSubmissionPayload,
} from './backend';

interface LikeRow {
  session_id: string;
  submission_id: string;
  student_id: string;
  created_at: string;
}

interface SubmissionRec extends Submission {
  pin: string; // 내부 저장 전용 — 응답으로 내보내지 않는다
}

interface LocalDb {
  config: { teacherKey: string };
  sessions: Session[];
  students: StudentRow[];
  submissions: SubmissionRec[];
  comments: CommentRow[];
  likes: LikeRow[];
  boardVersion: number;
}

function loadDb(): LocalDb {
  const raw = localStorage.getItem(LS_KEYS.localDb);
  if (raw) {
    try {
      return JSON.parse(raw) as LocalDb;
    } catch {
      // 손상 시 새로 시작
    }
  }
  return {
    config: { teacherKey: '' },
    sessions: [],
    students: [],
    submissions: [],
    comments: [],
    likes: [],
    boardVersion: 0,
  };
}

function saveDb(db: LocalDb): void {
  localStorage.setItem(LS_KEYS.localDb, JSON.stringify(db));
}

/** pin 제거 후 응답용 사본 (doGet 응답에 pin 절대 미포함 규칙과 동일) */
function stripPin(sub: SubmissionRec): Submission {
  const { pin: _pin, ...rest } = sub;
  return rest;
}

function requireTeacher(db: LocalDb, teacherKey: string): void {
  if (!db.config.teacherKey || teacherKey !== db.config.teacherKey) {
    throw new ApiError('FORBIDDEN', '교사 키가 올바르지 않습니다.');
  }
}

function findSession(db: LocalDb, sessionId: string): Session {
  const s = db.sessions.find((x) => x.session_id === sessionId);
  if (!s) throw new ApiError('NOT_FOUND', '사건을 찾을 수 없습니다.');
  return s;
}

function requireWritable(session: Session): void {
  if (session.status === 'closed' || session.status === 'archived') {
    throw new ApiError('CLOSED', '종료된 사건입니다.');
  }
}

function validateFields(p: { fields: { evidences: { claim: string; source: string }[] } }): void {
  const evs = p.fields.evidences ?? [];
  const filled = evs.filter((e) => e.claim.trim() !== '' || e.source.trim() !== '');
  if (filled.length < 1) {
    throw new ApiError('VALIDATION', '근거를 최소 1개 입력해야 합니다.');
  }
  if (filled.some((e) => e.source.trim() === '')) {
    throw new ApiError('VALIDATION', '모든 근거에 출처를 입력해야 합니다.');
  }
}

/** 데모 모드용 교사 키를 보장 (최초 1회 생성) */
export function ensureLocalTeacherKey(): string {
  const db = loadDb();
  if (!db.config.teacherKey) {
    db.config.teacherKey = 'demo-' + makeId('key').slice(4);
    saveDb(db);
  }
  return db.config.teacherKey;
}

export class LocalBackend implements Backend {
  readonly kind = 'local' as const;

  async ping(): Promise<{ version: string }> {
    return { version: API_VERSION + ' (데모 모드)' };
  }

  // ---- 교사 ----

  async createSession(p: CreateSessionPayload, teacherKey: string): Promise<{ session: Session }> {
    const db = loadDb();
    requireTeacher(db, teacherKey);
    const activeCodes = new Set(
      db.sessions.filter((s) => s.status === 'draft' || s.status === 'open').map((s) => s.code),
    );
    let code = makeCode();
    while (activeCodes.has(code)) code = makeCode();
    const now = nowIso();
    const session: Session = {
      session_id: makeId('ses'),
      code,
      title: p.title,
      mode: p.mode,
      status: 'draft',
      class_name: p.class_name,
      situation_board: p.situation_board,
      questions: p.questions,
      roles: p.roles,
      team_assign: p.team_assign,
      team_count: p.team_count,
      show_likes: true,
      created_at: now,
      updated_at: now,
    };
    db.sessions.push(session);
    db.boardVersion++;
    saveDb(db);
    return { session };
  }

  async updateSession(p: UpdateSessionPayload, teacherKey: string): Promise<{ session: Session }> {
    const db = loadDb();
    requireTeacher(db, teacherKey);
    const session = findSession(db, p.sessionId);
    Object.assign(session, p.patch, { updated_at: nowIso() });
    db.boardVersion++;
    saveDb(db);
    return { session };
  }

  async assignTeams(p: AssignTeamsPayload, teacherKey: string): Promise<{ students: StudentRow[] }> {
    const db = loadDb();
    requireTeacher(db, teacherKey);
    const session = findSession(db, p.sessionId);
    const members = db.students.filter((s) => s.session_id === p.sessionId);
    if (p.mode === 'random') {
      const shuffled = [...members].sort(() => Math.random() - 0.5);
      const count = Math.max(1, session.team_count);
      shuffled.forEach((st, i) => {
        st.team = `${(i % count) + 1}모둠`;
      });
    } else {
      for (const a of p.assignments ?? []) {
        const st = members.find((m) => m.student_id === a.studentId);
        if (st) {
          st.team = a.team;
          if (a.roleId !== undefined) st.role_id = a.roleId;
        }
      }
    }
    // 이미 제출/작성된 의견서에도 모둠 반영
    for (const sub of db.submissions.filter((s) => s.session_id === p.sessionId)) {
      const st = members.find((m) => m.student_id === sub.student_id);
      if (st) sub.team = st.team;
    }
    db.boardVersion++;
    saveDb(db);
    return { students: members };
  }

  async setVerdict(p: SetVerdictPayload, teacherKey: string): Promise<{ submission: Submission }> {
    const db = loadDb();
    requireTeacher(db, teacherKey);
    const sub = db.submissions.find((s) => s.submission_id === p.submissionId);
    if (!sub || sub.status === 'deleted') throw new ApiError('NOT_FOUND', '의견서를 찾을 수 없습니다.');
    sub.status = p.verdict;
    sub.teacher_note = p.note;
    sub.updated_at = nowIso();
    db.boardVersion++;
    saveDb(db);
    return { submission: stripPin(sub) };
  }

  async adminEdit(p: AdminEditPayload, teacherKey: string): Promise<{ updated: boolean }> {
    const db = loadDb();
    requireTeacher(db, teacherKey);
    if (p.target === 'submission') {
      const sub = db.submissions.find((s) => s.submission_id === p.id);
      if (!sub) throw new ApiError('NOT_FOUND', '의견서를 찾을 수 없습니다.');
      Object.assign(sub, p.patch, { updated_at: nowIso() });
    } else {
      const cmt = db.comments.find((c) => c.comment_id === p.id);
      if (!cmt) throw new ApiError('NOT_FOUND', '댓글을 찾을 수 없습니다.');
      Object.assign(cmt, p.patch);
    }
    db.boardVersion++;
    saveDb(db);
    return { updated: true };
  }

  async listSessions(teacherKey: string): Promise<{ sessions: Session[] }> {
    const db = loadDb();
    requireTeacher(db, teacherKey);
    const sessions = [...db.sessions].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { sessions };
  }

  async getTeacherBoard(sessionId: string, teacherKey: string): Promise<TeacherBoardData> {
    const db = loadDb();
    requireTeacher(db, teacherKey);
    findSession(db, sessionId);
    const submissions = db.submissions
      .filter((s) => s.session_id === sessionId && s.status !== 'deleted')
      .map(stripPin);
    const comments = db.comments.filter((c) => c.session_id === sessionId && c.status === 'active');
    const likeCounts: Record<string, number> = {};
    for (const l of db.likes.filter((l) => l.session_id === sessionId)) {
      likeCounts[l.submission_id] = (likeCounts[l.submission_id] ?? 0) + 1;
    }
    const students = db.students.filter((s) => s.session_id === sessionId);
    return { submissions, comments, likeCounts, myLikes: [], boardVersion: db.boardVersion, students };
  }

  // ---- 학생 ----

  async join(p: JoinPayload): Promise<JoinResult> {
    const db = loadDb();
    const session = db.sessions.find(
      (s) => s.code === p.code && (s.status === 'draft' || s.status === 'open'),
    );
    if (!session) throw new ApiError('NOT_FOUND', '해당 코드의 사건이 없습니다. 코드를 확인하세요.');
    if (session.status === 'draft') {
      throw new ApiError('CLOSED', '아직 개정 전인 사건입니다. 선생님의 안내를 기다리세요.');
    }
    let student = db.students.find(
      (s) => s.session_id === session.session_id && s.student_id === p.studentId,
    );
    if (student) {
      // 동일 학번 재입장 — 행 재사용. 이름 불일치 시 경고 (기획안 §12 #6)
      if (student.name !== p.name && !p.confirmName) {
        throw new ApiError(
          'NAME_MISMATCH',
          `이미 '${student.name}'(으)로 입장한 학번입니다. 본인의 학번이 맞는지 확인하세요.`,
        );
      }
      if (p.confirmName) student.name = p.name;
    } else {
      let team = '';
      if (session.team_assign === 'random') {
        // 현재 인원이 가장 적은 모둠에 배정
        const counts = new Map<string, number>();
        for (let i = 1; i <= Math.max(1, session.team_count); i++) counts.set(`${i}모둠`, 0);
        for (const st of db.students.filter((s) => s.session_id === session.session_id)) {
          if (counts.has(st.team)) counts.set(st.team, (counts.get(st.team) ?? 0) + 1);
        }
        let best = '1모둠';
        let min = Infinity;
        for (const [t, c] of counts) {
          if (c < min) {
            min = c;
            best = t;
          }
        }
        team = best;
      }
      student = {
        session_id: session.session_id,
        student_id: p.studentId,
        name: p.name,
        team,
        role_id: '',
        joined_at: nowIso(),
      };
      db.students.push(student);
    }
    const mySub = db.submissions.find(
      (s) =>
        s.session_id === session.session_id && s.student_id === p.studentId && s.status !== 'deleted',
    );
    db.boardVersion++;
    saveDb(db);
    return { session, student, mySubmission: mySub ? stripPin(mySub) : null };
  }

  async saveDraft(p: SaveDraftPayload): Promise<{ submissionId: string; status: 'draft'; updated_at: string }> {
    const db = loadDb();
    const session = findSession(db, p.sessionId);
    requireWritable(session);
    const existing = db.submissions.find(
      (s) => s.session_id === p.sessionId && s.student_id === p.studentId && s.status !== 'deleted',
    );
    const now = nowIso();
    if (existing) {
      if (existing.status !== 'draft') {
        throw new ApiError('VALIDATION', '이미 제출된 의견서입니다. 수정은 PIN으로 진행하세요.');
      }
      existing.fields = p.fields;
      if (p.pin) existing.pin = p.pin;
      existing.updated_at = now;
      db.boardVersion++;
      saveDb(db);
      return { submissionId: existing.submission_id, status: 'draft', updated_at: now };
    }
    const student = db.students.find(
      (s) => s.session_id === p.sessionId && s.student_id === p.studentId,
    );
    const sub: SubmissionRec = {
      submission_id: makeId('sub'),
      session_id: p.sessionId,
      student_id: p.studentId,
      student_name: student?.name ?? '',
      team: student?.team ?? '',
      role_id: student?.role_id ?? '',
      mode: session.mode,
      status: 'draft',
      fields: p.fields,
      pin: p.pin ?? '',
      teacher_note: '',
      created_at: now,
      updated_at: now,
    };
    db.submissions.push(sub);
    db.boardVersion++;
    saveDb(db);
    return { submissionId: sub.submission_id, status: 'draft', updated_at: now };
  }

  async submitOpinion(p: SubmitOpinionPayload): Promise<{ submission: Submission }> {
    const db = loadDb();
    const session = findSession(db, p.sessionId);
    requireWritable(session);
    if (!/^\d{4}$/.test(p.pin)) throw new ApiError('VALIDATION', 'PIN은 4자리 숫자여야 합니다.');
    validateFields(p);
    const existing = db.submissions.find(
      (s) => s.session_id === p.sessionId && s.student_id === p.studentId && s.status !== 'deleted',
    );
    const now = nowIso();
    const student = db.students.find(
      (s) => s.session_id === p.sessionId && s.student_id === p.studentId,
    );
    if (existing) {
      // M3(P2-2): 역할 배정 전 서버 draft로 시작한 경우 대비 — 제출 시점의 모둠·역할 재스냅숏
      if (student) {
        existing.team = student.team;
        existing.role_id = student.role_id;
        existing.student_name = student.name;
      }
      existing.fields = p.fields;
      existing.pin = p.pin;
      existing.status = 'submitted';
      existing.updated_at = now;
      db.boardVersion++;
      saveDb(db);
      return { submission: stripPin(existing) };
    }
    const sub: SubmissionRec = {
      submission_id: makeId('sub'),
      session_id: p.sessionId,
      student_id: p.studentId,
      student_name: student?.name ?? '',
      team: student?.team ?? '',
      role_id: student?.role_id ?? '',
      mode: session.mode,
      status: 'submitted',
      fields: p.fields,
      pin: p.pin,
      teacher_note: '',
      created_at: now,
      updated_at: now,
    };
    db.submissions.push(sub);
    db.boardVersion++;
    saveDb(db);
    return { submission: stripPin(sub) };
  }

  async updateSubmission(p: UpdateSubmissionPayload): Promise<{ submission: Submission }> {
    const db = loadDb();
    const sub = db.submissions.find((s) => s.submission_id === p.submissionId);
    if (!sub || sub.status === 'deleted') throw new ApiError('NOT_FOUND', '의견서를 찾을 수 없습니다.');
    const session = findSession(db, sub.session_id);
    requireWritable(session);
    if (sub.pin !== p.pin) throw new ApiError('WRONG_PIN', 'PIN이 일치하지 않습니다.');
    validateFields(p);
    sub.fields = p.fields;
    sub.status = 'submitted'; // 수정 시 재심의 대상
    sub.updated_at = nowIso();
    db.boardVersion++;
    saveDb(db);
    return { submission: stripPin(sub) };
  }

  async addComment(p: AddCommentPayload): Promise<{ comment: CommentRow }> {
    const db = loadDb();
    const sub = db.submissions.find((s) => s.submission_id === p.submissionId);
    if (!sub || sub.status === 'deleted') throw new ApiError('NOT_FOUND', '의견서를 찾을 수 없습니다.');
    const session = findSession(db, sub.session_id);
    requireWritable(session);
    if (!p.text.trim()) throw new ApiError('VALIDATION', '댓글 내용을 입력하세요.');
    const comment: CommentRow = {
      comment_id: makeId('cmt'),
      session_id: sub.session_id,
      submission_id: p.submissionId,
      author_student_id: p.studentId,
      author_name: p.name,
      author_team: p.team,
      text: p.text.trim(),
      status: 'active',
      created_at: nowIso(),
    };
    db.comments.push(comment);
    db.boardVersion++;
    saveDb(db);
    return { comment };
  }

  async toggleLike(p: ToggleLikePayload): Promise<{ liked: boolean; likeCount: number }> {
    const db = loadDb();
    const sub = db.submissions.find((s) => s.submission_id === p.submissionId);
    if (!sub || sub.status === 'deleted') throw new ApiError('NOT_FOUND', '의견서를 찾을 수 없습니다.');
    const session = findSession(db, sub.session_id);
    requireWritable(session);
    // (submission_id, student_id) 유일 — 학번당 1하트 (기획안 §4.5)
    const idx = db.likes.findIndex(
      (l) => l.submission_id === p.submissionId && l.student_id === p.studentId,
    );
    let liked: boolean;
    if (idx >= 0) {
      db.likes.splice(idx, 1); // 토글 해제 시 물리 삭제 (Likes만 예외)
      liked = false;
    } else {
      db.likes.push({
        session_id: sub.session_id,
        submission_id: p.submissionId,
        student_id: p.studentId,
        created_at: nowIso(),
      });
      liked = true;
    }
    const likeCount = db.likes.filter((l) => l.submission_id === p.submissionId).length;
    db.boardVersion++;
    saveDb(db);
    return { liked, likeCount };
  }

  // ---- 공용 읽기 ----

  async getSession(code: string, studentId?: string): Promise<{ session: Session; student: StudentRow | null }> {
    const db = loadDb();
    // P2-3(검수 P2-1): draft(개정 전) 세션은 학생에게 노출하지 않는다 — Code.gs getSession과 동일 규칙
    const session = db.sessions.find(
      (s) => s.code === code && (s.status === 'open' || s.status === 'closed'),
    );
    if (!session) throw new ApiError('NOT_FOUND', '해당 코드의 사건이 없습니다.');
    const student = studentId
      ? (db.students.find((s) => s.session_id === session.session_id && s.student_id === studentId) ?? null)
      : null;
    return { session, student };
  }

  async getBoard(sessionId: string, studentId: string, since?: string): Promise<BoardData> {
    const db = loadDb();
    const session = findSession(db, sessionId);
    const all = db.submissions
      .filter(
        (s) =>
          s.session_id === sessionId &&
          (s.status === 'submitted' || s.status === 'approved' || s.status === 'rejected'),
      )
      .sort((a, b) => compareTeam(a.team, b.team) || a.created_at.localeCompare(b.created_at)); // P2-4
    const subIds = new Set(all.map((s) => s.submission_id));
    const allComments = db.comments.filter(
      (c) => c.session_id === sessionId && c.status === 'active' && subIds.has(c.submission_id),
    );
    // M3 증분: since(ms) - 30초 오버랩 이후 변경분만. ID 목록은 항상 전체 (삭제 감지용)
    const cutoff = since ? Number(since) - SINCE_OVERLAP_MS : 0;
    const isNew = (iso: string) => {
      const t = new Date(iso).getTime();
      return Number.isNaN(t) || t >= cutoff; // 파싱 실패 시 안전하게 포함
    };
    const submissions = (cutoff > 0 ? all.filter((s) => isNew(s.updated_at)) : all).map(stripPin);
    const comments = cutoff > 0 ? allComments.filter((c) => isNew(c.created_at)) : allComments;
    const likeCounts: Record<string, number> = {};
    const myLikes: string[] = [];
    for (const l of db.likes.filter((l) => l.session_id === sessionId)) {
      likeCounts[l.submission_id] = (likeCounts[l.submission_id] ?? 0) + 1;
      if (l.student_id === studentId) myLikes.push(l.submission_id);
    }
    return {
      submissions,
      comments,
      likeCounts,
      myLikes,
      boardVersion: Date.now(),
      showLikes: session.show_likes !== false,
      submissionIds: all.map((s) => s.submission_id),
      commentIds: allComments.map((c) => c.comment_id),
    };
  }

  // ---- M3: 학기말 학생별 누적 집계 (기획안 §9 — LocalBackend는 메모리에서 동일 규칙으로 집계) ----

  async getStudentStats(
    teacherKey: string,
    opts?: { from?: string; to?: string },
  ): Promise<{ stats: StudentStat[] }> {
    const db = loadDb();
    requireTeacher(db, teacherKey);
    const from = opts?.from ?? '';
    const to = opts?.to ?? '';
    // 기간 필터: 세션 개정일(created_at) 기준 — ISO 문자열 비교 (기획안 §9 from/to)
    const allowed =
      from || to
        ? new Set(
            db.sessions
              .filter(
                (s) => (!from || s.created_at >= from) && (!to || s.created_at <= to + '\uffff'),
              )
              .map((s) => s.session_id),
          )
        : null;
    const inRange = (sid: string) => !allowed || allowed.has(sid);
    const sessionById = new Map(db.sessions.map((s) => [s.session_id, s]));

    const stats = new Map<string, StudentStat & { _nameAt: string }>();
    const stat = (id: string) => {
      let s = stats.get(id);
      if (!s) {
        s = {
          student_id: id,
          name: '',
          session_count: 0,
          submitted_count: 0,
          approved_count: 0,
          rejected_count: 0,
          likes_received: 0,
          likes_given: 0,
          comments_written: 0,
          comments_received: 0,
          first_activity: '',
          last_activity: '',
          sessions: [],
          _nameAt: '',
        };
        stats.set(id, s);
      }
      return s;
    };
    const touch = (s: StudentStat, iso: string) => {
      if (!iso) return;
      if (!s.first_activity || iso < s.first_activity) s.first_activity = iso;
      if (!s.last_activity || iso > s.last_activity) s.last_activity = iso;
    };

    for (const r of db.students) {
      if (!inRange(r.session_id)) continue;
      const s = stat(r.student_id);
      s.session_count++;
      if (r.joined_at >= s._nameAt) {
        s.name = r.name; // 최신 참여 행 기준 이름
        s._nameAt = r.joined_at;
      }
      const ses = sessionById.get(r.session_id);
      s.sessions.push({
        session_id: r.session_id,
        title: ses?.title ?? '',
        class_name: ses?.class_name ?? '',
        mode: ses?.mode ?? '',
        joined_at: r.joined_at,
        submission_id: null,
        submission_status: null,
      });
      touch(s, r.joined_at);
    }

    // 의견서 — deleted 제외 (비파괴 원칙 §9), draft는 제출 수에서 제외
    const subAuthor = new Map<string, { studentId: string; deleted: boolean }>();
    for (const sub of db.submissions) {
      if (!inRange(sub.session_id)) continue;
      subAuthor.set(sub.submission_id, {
        studentId: sub.student_id,
        deleted: sub.status === 'deleted',
      });
      if (sub.status === 'deleted') continue;
      const s = stat(sub.student_id);
      if (sub.status !== 'draft') {
        s.submitted_count++;
        if (sub.status === 'approved') s.approved_count++;
        if (sub.status === 'rejected') s.rejected_count++;
      }
      const detail = s.sessions.find((d) => d.session_id === sub.session_id);
      if (detail) {
        detail.submission_id = sub.submission_id;
        detail.submission_status = sub.status;
      }
      touch(s, sub.created_at);
      touch(s, sub.updated_at);
    }

    for (const c of db.comments) {
      if (!inRange(c.session_id) || c.status !== 'active') continue;
      const s = stat(c.author_student_id);
      s.comments_written++;
      touch(s, c.created_at);
      const target = subAuthor.get(c.submission_id);
      if (target && !target.deleted) stat(target.studentId).comments_received++;
    }

    for (const l of db.likes) {
      if (!inRange(l.session_id)) continue;
      const s = stat(l.student_id);
      s.likes_given++;
      touch(s, l.created_at);
      const target = subAuthor.get(l.submission_id);
      if (target && !target.deleted) stat(target.studentId).likes_received++;
    }

    const list = [...stats.values()]
      .map(({ _nameAt: _drop, ...rest }) => rest)
      .sort((a, b) => a.student_id.localeCompare(b.student_id));
    return { stats: list };
  }
}

/** 증분 폴링 오버랩(ms) — 읽기 스냅숏과 boardVersion 시각 사이 경계 유실 방지 (중복은 병합으로 흡수) */
const SINCE_OVERLAP_MS = 30_000;
