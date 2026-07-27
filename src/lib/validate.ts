// mode별 zod 스키마 — 제출 전 클라이언트 검증 (기획안 §11.3)

import { z } from 'zod';
import { isCourtFields, isTruthFields, type CourtFields, type Mode, type SubmissionFields, type TruthFields } from '../types';

export const evidenceSchema = z.object({
  claim: z.string().trim().min(1, '근거 내용을 입력하세요.'),
  source: z.string().trim().min(1, '출처(기사·논문·기관명+URL)를 입력하세요.'),
});

export const truthFieldsSchema = z.object({
  statement: z.string().trim().min(1, '검증할 AI의 진술을 입력하세요.'),
  judgment: z.enum(['true', 'false', 'partial', 'unverifiable'], {
    errorMap: () => ({ message: '진위 판단을 선택하세요.' }),
  }),
  evidences: z.array(evidenceSchema).min(1, '근거와 출처를 최소 1개 입력하세요.'),
  reflection: z.string().trim().min(1, '마지막 성찰 질문에 답을 입력하세요.'),
});

export const rebuttalSchema = z.object({
  expected: z.string().trim().min(1, '상대측의 예상 반박을 입력하세요.'),
  response: z.string().trim().min(1, '우리 팀의 대응을 입력하세요.'),
});

/** 법정 공방 모드 (기획안 §6.2) */
export const courtFieldsSchema = z.object({
  claim: z.string().trim().min(1, '우리 팀의 주장을 입력하세요.'),
  evidences: z.array(evidenceSchema).min(1, '근거와 출처를 최소 1개 입력하세요.'),
  rebuttal: z.array(rebuttalSchema).min(1, '예상 반박과 대응을 최소 1쌍 입력하세요.'),
});

export const pinSchema = z.string().regex(/^\d{4}$/, 'PIN은 4자리 숫자여야 합니다.');

export const studentIdSchema = z
  .string()
  .regex(/^\d{4,6}$/, '학번은 4~6자리 숫자입니다.');

export const joinCodeSchema = z
  .string()
  .regex(/^[0-9A-Za-z]{4,6}$/, '세션 코드는 4~6자입니다.');

/** 빈 근거 블록(둘 다 공란)은 제거 후 검증 */
export function cleanTruthFields(fields: TruthFields): TruthFields {
  const evidences = fields.evidences.filter((e) => e.claim.trim() !== '' || e.source.trim() !== '');
  return { ...fields, evidences: evidences.length > 0 ? evidences : fields.evidences.slice(0, 1) };
}

/** 빈 근거·빈 반박 쌍(모두 공란)은 제거 후 검증 */
export function cleanCourtFields(fields: CourtFields): CourtFields {
  const evidences = fields.evidences.filter((e) => e.claim.trim() !== '' || e.source.trim() !== '');
  const rebuttal = fields.rebuttal.filter((r) => r.expected.trim() !== '' || r.response.trim() !== '');
  return {
    ...fields,
    evidences: evidences.length > 0 ? evidences : fields.evidences.slice(0, 1),
    rebuttal: rebuttal.length > 0 ? rebuttal : fields.rebuttal.slice(0, 1),
  };
}

/** 검증 실패 시 첫 오류 메시지 반환, 통과 시 null */
export function validateTruthFields(fields: TruthFields): string | null {
  const result = truthFieldsSchema.safeParse(fields);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? '입력을 확인하세요.';
}

export function validateCourtFields(fields: CourtFields): string | null {
  const result = courtFieldsSchema.safeParse(fields);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? '입력을 확인하세요.';
}

// ---- mode 디스패치 (기획안 §11.3 — mode별 zod 스키마, 제출 전 클라이언트 검증) ----

export function cleanFields(mode: Mode, fields: SubmissionFields): SubmissionFields {
  if (isCourtFields(mode, fields)) return cleanCourtFields(fields);
  if (isTruthFields(mode, fields)) return cleanTruthFields(fields);
  return fields;
}

export function validateSubmissionFields(mode: Mode, fields: SubmissionFields): string | null {
  if (isCourtFields(mode, fields)) return validateCourtFields(fields);
  if (isTruthFields(mode, fields)) return validateTruthFields(fields);
  return '의견서 양식이 세션 모드와 일치하지 않습니다. 새로고침 후 다시 시도하세요.';
}
