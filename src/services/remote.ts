// Apps Script Web App 백엔드 (기획안 §5).
// - 쓰기: doPost + Content-Type text/plain;charset=utf-8 (프리플라이트 없음)
// - 읽기: doGet + 쿼리 파라미터
// - 실패 fallback: 쓰기 실패 시 outbox 큐 보관 (기획안 §5.4)

import { ApiError, LS_KEYS, type Envelope } from '../api/contract';
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

interface OutboxItem {
  action: string;
  payload: Record<string, unknown>;
  queuedAt: string;
}

export function getOutbox(): OutboxItem[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.outbox) ?? '[]') as OutboxItem[];
  } catch {
    return [];
  }
}

function setOutbox(items: OutboxItem[]): void {
  localStorage.setItem(LS_KEYS.outbox, JSON.stringify(items));
}

function enqueue(action: string, payload: Record<string, unknown>): void {
  const items = getOutbox();
  items.push({ action, payload, queuedAt: new Date().toISOString() });
  setOutbox(items);
}

/** 서버 시트에서 오는 원시 세션(JSON 문자열 열)을 클라이언트 타입으로 변환 */
function parseSession(raw: Record<string, unknown>): Session {
  const s = raw as unknown as Session & { questions_json?: string; roles_json?: string };
  return {
    ...s,
    questions:
      s.questions ?? (s.questions_json ? (JSON.parse(s.questions_json) as Record<string, string>) : {}),
    roles: s.roles ?? (s.roles_json ? (JSON.parse(s.roles_json) as Session['roles']) : []),
    team_count: Number(s.team_count) || 0,
    show_likes: String(s.show_likes).toUpperCase() !== 'FALSE',
  };
}

function parseSubmission(raw: Record<string, unknown>): Submission {
  const s = raw as unknown as Submission & { fields_json?: string };
  return {
    ...s,
    fields: s.fields ?? (s.fields_json ? JSON.parse(s.fields_json) : {}),
  };
}

export class RemoteBackend implements Backend {
  readonly kind = 'remote' as const;

  constructor(private url: string) {}

  private async post<T>(
    action: string,
    payload: Record<string, unknown>,
    retried = false,
    fromOutbox = false, // outbox 재전송 중이면 실패해도 다시 enqueue하지 않음 (중복 방지 — 항목은 retryOutbox가 유지)
  ): Promise<T> {
    // 쓰기 유실 금지 (P1-3): 네트워크 실패·비JSON 응답·BUSY 최종 실패 모두 outbox 보관
    const keep = (): void => {
      if (action !== 'ping' && !fromOutbox) enqueue(action, payload);
    };
    let res: Response;
    try {
      res = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload }),
        redirect: 'follow',
      });
    } catch {
      // 네트워크 실패 — 쓰기 페이로드를 outbox에 보관 (제출물 유실 금지)
      keep();
      throw new ApiError('OFFLINE', '연결에 실패했습니다. 저장 대기 중입니다.');
    }
    let env: Envelope<T>;
    try {
      env = (await res.json()) as Envelope<T>;
    } catch {
      // 비JSON 응답(HTML 로그인 페이지 등) — 원문 SyntaxError를 노출하지 않는다 (P2-5)
      keep();
      throw new ApiError(
        'OFFLINE',
        '서버 응답을 해석할 수 없습니다. Apps Script 배포 설정(액세스: 모든 사용자)을 확인하세요.',
      );
    }
    if (!env.ok) {
      if (env.error === 'BUSY') {
        if (!retried) {
          // 1.5초 후 1회 자동 재시도 (기획안 §5.1)
          await new Promise((r) => setTimeout(r, 1500));
          return this.post<T>(action, payload, true, fromOutbox);
        }
        // BUSY 최종 실패 (P1-3): 쓰기 요청을 outbox에 보관 — 학생 제출물 유실 방지
        if (action !== 'ping' && !fromOutbox) {
          enqueue(action, payload);
          throw new ApiError('OFFLINE', '서버가 혼잡합니다. 요청을 전송 대기함에 보관했습니다.');
        }
      }
      throw new ApiError(env.error, env.message);
    }
    return env.data;
  }

  private async get<T>(params: Record<string, string>): Promise<T> {
    const qs = new URLSearchParams(params).toString();
    let res: Response;
    try {
      res = await fetch(`${this.url}?${qs}`, { method: 'GET', redirect: 'follow' });
    } catch {
      throw new ApiError('OFFLINE', '연결이 끊겼습니다.');
    }
    let env: Envelope<T>;
    try {
      env = (await res.json()) as Envelope<T>;
    } catch {
      // 비JSON 응답 — 원문 SyntaxError를 노출하지 않는다 (P2-5)
      throw new ApiError(
        'OFFLINE',
        '서버 응답을 해석할 수 없습니다. Apps Script 배포 설정(액세스: 모든 사용자)을 확인하세요.',
      );
    }
    if (!env.ok) throw new ApiError(env.error, env.message);
    return env.data;
  }

  /** outbox 재전송 — 성공한 항목만 제거 */
  async retryOutbox(): Promise<{ sent: number; remaining: number }> {
    const items = getOutbox();
    const remaining: OutboxItem[] = [];
    let sent = 0;
    for (const item of items) {
      try {
        await this.post(item.action, item.payload, false, true);
        sent++;
      } catch {
        remaining.push(item);
      }
    }
    setOutbox(remaining);
    return { sent, remaining: remaining.length };
  }

  async ping(): Promise<{ version: string }> {
    return this.post('ping', {});
  }

  async createSession(p: CreateSessionPayload, teacherKey: string): Promise<{ session: Session }> {
    const data = await this.post<{ session: Record<string, unknown> }>('createSession', { ...p, teacherKey });
    return { session: parseSession(data.session) };
  }

  async updateSession(p: UpdateSessionPayload, teacherKey: string): Promise<{ session: Session }> {
    const data = await this.post<{ session: Record<string, unknown> }>('updateSession', { ...p, teacherKey });
    return { session: parseSession(data.session) };
  }

  async assignTeams(p: AssignTeamsPayload, teacherKey: string): Promise<{ students: StudentRow[] }> {
    return this.post('assignTeams', { ...p, teacherKey });
  }

  async setVerdict(p: SetVerdictPayload, teacherKey: string): Promise<{ submission: Submission }> {
    const data = await this.post<{ submission: Record<string, unknown> }>('setVerdict', { ...p, teacherKey });
    return { submission: parseSubmission(data.submission) };
  }

  async adminEdit(p: AdminEditPayload, teacherKey: string): Promise<{ updated: boolean }> {
    return this.post('adminEdit', { ...p, teacherKey });
  }

  async listSessions(teacherKey: string): Promise<{ sessions: Session[] }> {
    const data = await this.get<{ sessions: Record<string, unknown>[] }>({
      action: 'listSessions',
      teacherKey,
    });
    return { sessions: data.sessions.map(parseSession) };
  }

  async getTeacherBoard(sessionId: string, teacherKey: string): Promise<TeacherBoardData> {
    const data = await this.get<
      Omit<TeacherBoardData, 'submissions'> & { submissions: Record<string, unknown>[] }
    >({ action: 'getTeacherBoard', sessionId, teacherKey });
    return { ...data, submissions: data.submissions.map(parseSubmission) };
  }

  async getStudentStats(
    teacherKey: string,
    opts?: { from?: string; to?: string },
  ): Promise<{ stats: StudentStat[] }> {
    return this.get({
      action: 'getStudentStats',
      teacherKey,
      ...(opts?.from ? { from: opts.from } : {}),
      ...(opts?.to ? { to: opts.to } : {}),
    });
  }

  async join(p: JoinPayload): Promise<JoinResult> {
    const data = await this.post<{
      session: Record<string, unknown>;
      student: StudentRow;
      mySubmission: Record<string, unknown> | null;
    }>('join', { ...p });
    return {
      session: parseSession(data.session),
      student: data.student,
      mySubmission: data.mySubmission ? parseSubmission(data.mySubmission) : null,
    };
  }

  async saveDraft(p: SaveDraftPayload): Promise<{ submissionId: string; status: 'draft'; updated_at: string }> {
    return this.post('saveDraft', { ...p });
  }

  async submitOpinion(p: SubmitOpinionPayload): Promise<{ submission: Submission }> {
    const data = await this.post<{ submission: Record<string, unknown> }>('submitOpinion', { ...p });
    return { submission: parseSubmission(data.submission) };
  }

  async updateSubmission(p: UpdateSubmissionPayload): Promise<{ submission: Submission }> {
    const data = await this.post<{ submission: Record<string, unknown> }>('updateSubmission', { ...p });
    return { submission: parseSubmission(data.submission) };
  }

  async addComment(p: AddCommentPayload): Promise<{ comment: CommentRow }> {
    return this.post('addComment', { ...p });
  }

  async toggleLike(p: ToggleLikePayload): Promise<{ liked: boolean; likeCount: number }> {
    return this.post('toggleLike', { ...p });
  }

  async getSession(code: string, studentId?: string): Promise<{ session: Session; student: StudentRow | null }> {
    const data = await this.get<{ session: Record<string, unknown>; student: StudentRow | null }>({
      action: 'getSession',
      code,
      ...(studentId ? { studentId } : {}),
    });
    return { session: parseSession(data.session), student: data.student };
  }

  async getBoard(sessionId: string, studentId: string, since?: string): Promise<BoardData> {
    const data = await this.get<Omit<BoardData, 'submissions'> & { submissions: Record<string, unknown>[] }>({
      action: 'getBoard',
      sessionId,
      studentId,
      ...(since ? { since } : {}), // M3 증분 폴링 — 구버전 서버는 파라미터를 무시하고 전체 반환
    });
    return { ...data, submissions: data.submissions.map(parseSubmission) };
  }
}
