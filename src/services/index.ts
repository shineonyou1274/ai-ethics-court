// storage 어댑터 분기 (기획안 데이터 계층 분리 규칙)
// - aic:webappUrl 이 등록되어 있으면 → RemoteBackend (Google Sheets 연동)
// - 없으면 → LocalBackend (데모/오프라인 모드, 이 기기에만 저장)

import { LS_KEYS } from '../api/contract';
import type { Backend } from './backend';
import { LocalBackend } from './local';
import { RemoteBackend } from './remote';

let cached: Backend | null = null;
let cachedUrl: string | null = null;

export function getWebappUrl(): string {
  return localStorage.getItem(LS_KEYS.webappUrl) ?? '';
}

export function setWebappUrl(url: string): void {
  if (url) localStorage.setItem(LS_KEYS.webappUrl, url);
  else localStorage.removeItem(LS_KEYS.webappUrl);
  cached = null;
}

export function getBackend(): Backend {
  const url = getWebappUrl();
  if (cached && cachedUrl === url) return cached;
  cached = url ? new RemoteBackend(url) : new LocalBackend();
  cachedUrl = url;
  return cached;
}

export function isDemoMode(): boolean {
  return getWebappUrl() === '';
}

export { ensureLocalTeacherKey } from './local';
export { getOutbox, RemoteBackend } from './remote';
