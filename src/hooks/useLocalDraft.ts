// 임시저장 이중화 1단계 — LocalStorage 자동 저장, 5초 디바운스 (기획안 §7.4)

import { useEffect, useRef, useState } from 'react';
import { LS_KEYS } from '../api/contract';
import type { SubmissionFields } from '../types';

export interface DraftData {
  fields: SubmissionFields;
  pin: string;
  updatedAt: string;
}

export function readDraft(sessionId: string): DraftData | null {
  try {
    const raw = localStorage.getItem(LS_KEYS.draft(sessionId));
    return raw ? (JSON.parse(raw) as DraftData) : null;
  } catch {
    return null;
  }
}

export function clearDraft(sessionId: string): void {
  localStorage.removeItem(LS_KEYS.draft(sessionId));
}

export function writeDraft(sessionId: string, fields: SubmissionFields, pin: string): string {
  const updatedAt = new Date().toISOString();
  localStorage.setItem(LS_KEYS.draft(sessionId), JSON.stringify({ fields, pin, updatedAt }));
  return updatedAt;
}

/**
 * fields/pin 변경 후 5초 디바운스로 LocalStorage에 자동 저장.
 * 반환: 마지막 로컬 저장 시각(표시용).
 */
export function useLocalDraft(
  sessionId: string,
  fields: SubmissionFields,
  pin: string,
  enabled: boolean,
): string | null {
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false;
      return; // 최초 마운트(복원 직후)는 저장하지 않음
    }
    const t = setTimeout(() => {
      setSavedAt(writeDraft(sessionId, fields, pin));
    }, 5000);
    return () => clearTimeout(t);
  }, [sessionId, fields, pin, enabled]);

  return savedAt;
}
