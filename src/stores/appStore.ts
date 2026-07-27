// Zustand 단일 스토어: 내 신원 · teacherKey · 현재 세션 (기획안 §7.2)

import { create } from 'zustand';
import { LS_KEYS } from '../api/contract';

export interface Identity {
  studentId: string;
  name: string;
}

export interface CurrentSession {
  code: string;
  sessionId: string;
  team: string;
  roleId: string;
}

interface AppState {
  identity: Identity | null;
  session: CurrentSession | null;
  teacherKey: string;
  setIdentity: (id: Identity | null) => void;
  setSession: (s: CurrentSession | null) => void;
  setTeacherKey: (key: string) => void;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export const useAppStore = create<AppState>((set) => ({
  identity: readJson<Identity>(LS_KEYS.identity),
  session: readJson<CurrentSession>(LS_KEYS.session),
  teacherKey: localStorage.getItem(LS_KEYS.teacherKey) ?? '',
  setIdentity: (identity) => {
    if (identity) localStorage.setItem(LS_KEYS.identity, JSON.stringify(identity));
    else localStorage.removeItem(LS_KEYS.identity);
    set({ identity });
  },
  setSession: (session) => {
    if (session) localStorage.setItem(LS_KEYS.session, JSON.stringify(session));
    else localStorage.removeItem(LS_KEYS.session);
    set({ session });
  },
  setTeacherKey: (teacherKey) => {
    if (teacherKey) localStorage.setItem(LS_KEYS.teacherKey, teacherKey);
    else localStorage.removeItem(LS_KEYS.teacherKey);
    set({ teacherKey });
  },
}));
