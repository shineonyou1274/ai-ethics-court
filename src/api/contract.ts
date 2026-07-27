// 프론트-Apps Script 단일 계약 (기획안 §5, §13-2)
// appsscript/Code.gs 는 이 계약을 그대로 구현한다. 변경 시 양쪽을 함께 수정할 것.

export const API_VERSION = '1.1.1-M3';

/** 응답 봉투 (기획안 §5.1) — HTTP 상태는 항상 200, ok 필드로 판정 */
export interface OkEnvelope<T> {
  ok: true;
  data: T;
  serverTime: string;
}
export interface FailEnvelope {
  ok: false;
  error: ApiErrorCode;
  message: string;
}
export type Envelope<T> = OkEnvelope<T> | FailEnvelope;

export type ApiErrorCode =
  | 'BUSY'
  | 'NOT_FOUND'
  | 'WRONG_PIN'
  | 'FORBIDDEN'
  | 'CLOSED'
  | 'VALIDATION'
  | 'NAME_MISMATCH'
  | 'OFFLINE';

export class ApiError extends Error {
  code: ApiErrorCode;
  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

/** doPost 액션 (기획안 §5.2) + listSessions(S4 세션 목록용 doGet 확장) */
export type PostAction =
  | 'ping'
  | 'createSession'
  | 'updateSession'
  | 'assignTeams'
  | 'setVerdict'
  | 'adminEdit'
  | 'join'
  | 'saveDraft'
  | 'submitOpinion'
  | 'updateSubmission'
  | 'addComment'
  | 'toggleLike';

export type GetAction =
  | 'ping'
  | 'getSession'
  | 'getBoard' // M3: since(boardVersion) 파라미터로 증분 폴링 지원 (기획안 §5.3)
  | 'getTeacherBoard'
  | 'listSessions'
  | 'getStudentStats'; // M3: 학기말 학생별 누적 집계 (기획안 §9)

/** 진위 판별 모드 기본 질문 문구 (기획안 §6.1) — 교사는 문구만 수정 가능 */
export const TRUTH_QUESTION_PRESET: Record<string, string> = {
  statement: '검증할 AI의 진술은 무엇인가요?',
  judgment: '이 진술의 진위 판단은?',
  evidences: '판단의 근거와 출처는?',
  reflection: '이런 허위·오류 정보가 퍼지면 어떤 일이 생길까요?',
};

export const JUDGMENT_LABELS: Record<string, string> = {
  true: '사실',
  false: '거짓',
  partial: '부분적 사실',
  unverifiable: '판단 불가',
};

/** 법정 공방 모드 기본 질문 문구 (기획안 §6.2) — "○○"는 역할팀 이름으로 치환 */
export const COURT_QUESTION_PRESET: Record<string, string> = {
  claim: '우리 팀(○○ 측)의 주장은 무엇인가요?',
  evidences: '주장을 뒷받침하는 근거와 출처는?',
  rebuttal: '상대측이 어떻게 반박할 것 같나요? 우리는 어떻게 대응하나요?',
};

export const QUESTION_PRESETS: Record<'truth' | 'court', Record<string, string>> = {
  truth: TRUTH_QUESTION_PRESET,
  court: COURT_QUESTION_PRESET,
};

/** 질문 문구 편집기에서 필드 키를 사람이 읽는 이름으로 표시 */
export const QUESTION_FIELD_LABELS: Record<string, string> = {
  statement: '① 검증 진술',
  judgment: '② 진위 판단',
  evidences: '③ 근거·출처',
  reflection: '④ 성찰',
  claim: '① 우리 팀 주장',
  rebuttal: '③ 예상 반박·대응',
};

/** 법정 공방 모드 기본 역할팀 (기획안 §4.1 roles_json 예시) */
export const DEFAULT_COURT_ROLES: { id: string; name: string }[] = [
  { id: 'pl', name: '원고 측 변호사팀' },
  { id: 'df', name: '피고 측 변호사팀' },
];

export const MODE_LABELS: Record<'truth' | 'court', string> = {
  truth: '진위 판별',
  court: '법정 공방',
};

/**
 * 댓글 문장 프레임 3종 — '선택 삽입' 보조 (기획안 R23, §11.6 충돌4: 강제 아님)
 * 클릭 시 입력창에 문장 틀을 넣어 주고, 학생이 자유롭게 고쳐 쓴다.
 */
export const COMMENT_FRAMES: { label: string; text: string }[] = [
  { label: '설득력 있는 근거', text: '근거 ○○이(가) 설득력 있었어요. 왜냐하면 ' },
  { label: '출처 더 확인', text: '출처 ○○의 신뢰도를 더 확인하면 좋겠어요. 왜냐하면 ' },
  { label: '다른 관점', text: '다른 관점에서 ○○도 생각해 볼 수 있을 것 같아요. 왜냐하면 ' },
];

/** LocalStorage 키 (기획안 §7.3) */
export const LS_KEYS = {
  identity: 'aic:identity',
  session: 'aic:session',
  draft: (sessionId: string) => `aic:draft:${sessionId}`,
  outbox: 'aic:outbox',
  teacherKey: 'aic:teacherKey',
  webappUrl: 'aic:webappUrl',
  localDb: 'aic:db:v1',
} as const;
