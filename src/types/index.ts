// 데이터 모델 단일 정의 (기획안 §4 시트 스키마와 1:1)

export type Mode = 'truth' | 'court';
export type SessionStatus = 'draft' | 'open' | 'closed' | 'archived';
export type SubmissionStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'deleted';
export type Judgment = 'true' | 'false' | 'partial' | 'unverifiable';

export interface RoleDef {
  id: string;
  name: string;
}

export interface Session {
  session_id: string;
  code: string;
  title: string;
  mode: Mode;
  status: SessionStatus;
  class_name: string;
  situation_board: string;
  questions: Record<string, string>;
  roles: RoleDef[];
  team_assign: 'random' | 'manual';
  team_count: number;
  show_likes: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentRow {
  session_id: string;
  student_id: string; // 학번: 4~6자리 숫자 문자열 (앞자리 0 보존)
  name: string;
  team: string;
  role_id: string;
  joined_at: string;
}

export interface Evidence {
  claim: string;
  source: string;
}

/** 진위 판별 모드 의견서 양식 (기획안 §6.1) */
export interface TruthFields {
  statement: string;
  judgment: Judgment | '';
  evidences: Evidence[];
  reflection: string;
}

/** 예상 반박 · 대응 쌍 (기획안 §6.2) */
export interface RebuttalPair {
  expected: string;
  response: string;
}

/** 법정 공방 모드 의견서 양식 (기획안 §6.2) */
export interface CourtFields {
  claim: string;
  evidences: Evidence[];
  rebuttal: RebuttalPair[];
}

export type SubmissionFields = TruthFields | CourtFields;

export interface Submission {
  submission_id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  team: string;
  role_id: string;
  mode: Mode;
  status: SubmissionStatus;
  fields: SubmissionFields;
  teacher_note: string;
  created_at: string;
  updated_at: string;
  // pin은 서버 응답에 절대 포함하지 않는다 (기획안 §4.3)
}

export interface CommentRow {
  comment_id: string;
  session_id: string;
  submission_id: string;
  author_student_id: string;
  author_name: string;
  author_team: string;
  text: string;
  status: 'active' | 'deleted';
  created_at: string;
}

export interface BoardData {
  submissions: Submission[];
  comments: CommentRow[];
  likeCounts: Record<string, number>;
  myLikes: string[];
  /** 서버 시각(ms). M3 증분 폴링의 since 기준값 — 다음 호출에 그대로 돌려보낸다 */
  boardVersion: number;
  /** M3: show_likes 옵션을 폴링에 실어 학생 화면에 실시간 반영 (구버전 서버는 미포함) */
  showLikes?: boolean;
  /** M3 증분 폴링: 현재 광장에 보여야 할 전체 ID 목록 — 증분 응답에서 삭제 감지용 */
  submissionIds?: string[];
  commentIds?: string[];
}

export interface TeacherBoardData extends BoardData {
  students: StudentRow[];
}

/** 학생별 누적 집계의 세션 참여 상세 (기획안 §9 — 학생 1인 상세) */
export interface StudentSessionStat {
  session_id: string;
  title: string;
  class_name: string;
  mode: string;
  joined_at: string;
  submission_id: string | null;
  submission_status: SubmissionStatus | null;
}

/** 학기말 학생별(학번) 누적 집계 한 행 (기획안 §9 집계 항목과 1:1) */
export interface StudentStat {
  student_id: string;
  /** 최신 참여 행 기준 이름 (동명이인은 학번으로 구분) */
  name: string;
  session_count: number;
  submitted_count: number;
  approved_count: number;
  rejected_count: number;
  likes_received: number;
  likes_given: number;
  comments_written: number;
  comments_received: number;
  first_activity: string;
  last_activity: string;
  sessions: StudentSessionStat[];
}

export interface JoinResult {
  session: Session;
  student: StudentRow;
  mySubmission: Submission | null;
}

export function emptyTruthFields(): TruthFields {
  return { statement: '', judgment: '', evidences: [{ claim: '', source: '' }], reflection: '' };
}

export function emptyCourtFields(): CourtFields {
  return {
    claim: '',
    evidences: [{ claim: '', source: '' }],
    rebuttal: [{ expected: '', response: '' }],
  };
}

export function emptyFieldsFor(mode: Mode): SubmissionFields {
  return mode === 'court' ? emptyCourtFields() : emptyTruthFields();
}

/** fields_json은 mode로 판별한다 (Submission.mode = 세션에서 복사, 기획안 §4.3) */
export function isTruthFields(mode: Mode, f: SubmissionFields): f is TruthFields {
  return mode !== 'court' && 'judgment' in f;
}

export function isCourtFields(mode: Mode, f: SubmissionFields): f is CourtFields {
  return mode === 'court' && 'claim' in f;
}
