import type {
  BoardData,
  JoinResult,
  Session,
  StudentRow,
  StudentStat,
  Submission,
  SubmissionFields,
  TeacherBoardData,
} from '../types';

// ---- 요청 페이로드 타입 (기획안 §5.2) ----

export interface CreateSessionPayload {
  title: string;
  mode: 'truth' | 'court';
  situation_board: string;
  questions: Record<string, string>;
  roles: { id: string; name: string }[];
  team_assign: 'random' | 'manual';
  team_count: number;
  class_name: string;
}

export interface UpdateSessionPayload {
  sessionId: string;
  patch: Partial<
    Pick<
      Session,
      | 'title'
      | 'situation_board'
      | 'questions'
      | 'status'
      | 'team_assign'
      | 'team_count'
      | 'class_name'
      | 'show_likes' // M3: 공감 수 학생 노출 옵션 (기획안 R23)
    >
  >;
}

export interface AssignTeamsPayload {
  sessionId: string;
  mode: 'random' | 'manual';
  assignments?: { studentId: string; team: string; roleId?: string }[];
}

export interface SetVerdictPayload {
  submissionId: string;
  verdict: 'approved' | 'rejected';
  note: string;
}

export interface AdminEditPayload {
  target: 'submission' | 'comment';
  id: string;
  patch: { status?: 'deleted' } & Record<string, unknown>;
}

export interface JoinPayload {
  code: string;
  studentId: string;
  name: string;
  /** 동일 학번-다른 이름 경고 모달 확인 후 재시도 플래그 (기획안 §12 #6) */
  confirmName?: boolean;
}

export interface SaveDraftPayload {
  sessionId: string;
  submissionId?: string;
  studentId: string;
  fields: SubmissionFields;
  pin?: string;
}

export interface SubmitOpinionPayload {
  sessionId: string;
  submissionId?: string;
  studentId: string;
  fields: SubmissionFields;
  pin: string;
}

export interface UpdateSubmissionPayload {
  submissionId: string;
  pin: string;
  fields: SubmissionFields;
}

export interface AddCommentPayload {
  submissionId: string;
  studentId: string;
  name: string;
  team: string;
  text: string;
}

export interface ToggleLikePayload {
  submissionId: string;
  studentId: string;
}

/**
 * 스토리지 어댑터 인터페이스 (기획안 §7.1 데이터 계층 분리).
 * - RemoteBackend: Apps Script Web App (시트 연동)
 * - LocalBackend: LocalStorage (데모/오프라인 모드) — 시트 미연동 상태에서도 전 기능 동작
 */
export interface Backend {
  readonly kind: 'local' | 'remote';

  ping(): Promise<{ version: string }>;

  // 교사 (teacherKey 필수 — 불일치 시 FORBIDDEN)
  createSession(p: CreateSessionPayload, teacherKey: string): Promise<{ session: Session }>;
  updateSession(p: UpdateSessionPayload, teacherKey: string): Promise<{ session: Session }>;
  assignTeams(p: AssignTeamsPayload, teacherKey: string): Promise<{ students: StudentRow[] }>;
  setVerdict(p: SetVerdictPayload, teacherKey: string): Promise<{ submission: Submission }>;
  adminEdit(p: AdminEditPayload, teacherKey: string): Promise<{ updated: boolean }>;
  listSessions(teacherKey: string): Promise<{ sessions: Session[] }>;
  getTeacherBoard(sessionId: string, teacherKey: string): Promise<TeacherBoardData>;
  /** M3 — 학기말 학생별(학번) 누적 집계. 1회성 수동 호출 (기획안 §9) */
  getStudentStats(
    teacherKey: string,
    opts?: { from?: string; to?: string },
  ): Promise<{ stats: StudentStat[] }>;

  // 학생
  join(p: JoinPayload): Promise<JoinResult>;
  saveDraft(p: SaveDraftPayload): Promise<{ submissionId: string; status: 'draft'; updated_at: string }>;
  submitOpinion(p: SubmitOpinionPayload): Promise<{ submission: Submission }>;
  updateSubmission(p: UpdateSubmissionPayload): Promise<{ submission: Submission }>;
  addComment(p: AddCommentPayload): Promise<{ comment: import('../types').CommentRow }>;
  toggleLike(p: ToggleLikePayload): Promise<{ liked: boolean; likeCount: number }>;

  // 공용 읽기
  getSession(code: string, studentId?: string): Promise<{ session: Session; student: StudentRow | null }>;
  /** since: 이전 응답의 boardVersion(서버 시각 ms) — 주면 증분 응답 (M3, 기획안 §5.3) */
  getBoard(sessionId: string, studentId: string, since?: string): Promise<BoardData>;
}
