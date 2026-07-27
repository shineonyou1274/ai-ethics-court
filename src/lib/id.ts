/** ID 규칙: 접두사 + timestamp36 + 난수4 (기획안 §4 공통 규칙) */
export function makeId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${ts}_${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** 4자리 입장 코드 */
export function makeCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
