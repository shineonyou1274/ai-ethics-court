// 제출 현황 모니터링 표 — 입장 학생 + 제출 상태 + 모둠/역할 지정 (기획안 §2 S6)
// M2: 체크 지정 배정 UI — 학생을 체크로 선택해 모둠·역할팀에 일괄 배정 (기획안 §10 M2)

import { useState } from 'react';
import { UserCheck } from 'lucide-react';
import type { Mode, RoleDef, StudentRow, Submission } from '../../types';
import { StatusBadge } from '../common/Badge';

export interface BulkAssignment {
  studentId: string;
  team: string;
  roleId?: string;
}

interface Props {
  students: StudentRow[];
  submissions: Submission[];
  teamCount: number;
  mode: Mode;
  roles: RoleDef[];
  onAssign: (assignments: BulkAssignment[]) => void;
  busy?: boolean;
}

const KEEP = '__keep__';

export function MonitorTable({ students, submissions, teamCount, mode, roles, onAssign, busy }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTeam, setBulkTeam] = useState(KEEP);
  const [bulkRole, setBulkRole] = useState(KEEP);
  const isCourt = mode === 'court';
  const subOf = (studentId: string) => submissions.find((s) => s.student_id === studentId);
  const teams = Array.from({ length: Math.max(1, teamCount) }, (_, i) => `${i + 1}모둠`);

  if (students.length === 0) {
    return (
      <p className="border border-dashed border-line bg-card px-4 py-6 text-center text-sm text-faint">
        아직 입장한 학생이 없습니다. 칠판에 입장 코드를 판서하세요.
      </p>
    );
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allChecked = selected.size === students.length;
  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(students.map((s) => s.student_id)));
  };

  const applyBulk = () => {
    const targets = students.filter((s) => selected.has(s.student_id));
    if (targets.length === 0) return;
    onAssign(
      targets.map((st) => ({
        studentId: st.student_id,
        // 서버 assignTeams(manual)는 team을 항상 덮어쓰므로, 유지 선택 시 현재 값을 그대로 보낸다
        team: bulkTeam === KEEP ? st.team : bulkTeam,
        ...(isCourt ? { roleId: bulkRole === KEEP ? st.role_id : bulkRole } : {}),
      })),
    );
    setSelected(new Set());
  };

  return (
    <div className="border border-line bg-card">
      {/* 체크 지정 배정 바 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper px-3 py-2 text-xs">
        <span className="flex items-center gap-1 font-bold text-ink">
          <UserCheck size={13} /> 선택 {selected.size}명을
        </span>
        <select
          value={bulkTeam}
          onChange={(e) => setBulkTeam(e.target.value)}
          className="border border-line bg-card px-1.5 py-1 text-xs"
        >
          <option value={KEEP}>모둠 유지</option>
          <option value="">모둠 해제</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {isCourt && (
          <select
            value={bulkRole}
            onChange={(e) => setBulkRole(e.target.value)}
            className="border border-line bg-card px-1.5 py-1 text-xs"
          >
            <option value={KEEP}>역할 유지</option>
            <option value="">역할 해제</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          disabled={busy || selected.size === 0 || (bulkTeam === KEEP && (!isCourt || bulkRole === KEEP))}
          onClick={applyBulk}
          className="bg-ink px-2.5 py-1 text-xs font-bold text-white disabled:opacity-40"
        >
          배정
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-ink/60 font-serif text-xs text-ink">
              <th className="px-3 py-2">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="전체 선택" />
              </th>
              <th className="px-3 py-2">학번</th>
              <th className="px-3 py-2">이름</th>
              <th className="px-3 py-2">모둠</th>
              {isCourt && <th className="px-3 py-2">역할팀</th>}
              <th className="px-3 py-2">입장</th>
              <th className="px-3 py-2">의견서</th>
            </tr>
          </thead>
          <tbody>
            {students.map((st) => {
              const sub = subOf(st.student_id);
              return (
                <tr key={st.student_id} className="border-b border-line/60">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(st.student_id)}
                      onChange={() => toggle(st.student_id)}
                      aria-label={`${st.name} 선택`}
                    />
                  </td>
                  <td className="px-3 py-2 font-mono">{st.student_id}</td>
                  <td className="px-3 py-2">{st.name}</td>
                  <td className="px-3 py-2">
                    <select
                      value={st.team}
                      disabled={busy}
                      onChange={(e) =>
                        onAssign([
                          {
                            studentId: st.student_id,
                            team: e.target.value,
                            ...(isCourt ? { roleId: st.role_id } : {}),
                          },
                        ])
                      }
                      className="border border-line bg-card px-1 py-0.5 text-xs"
                    >
                      <option value="">미정</option>
                      {teams.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  {isCourt && (
                    <td className="px-3 py-2">
                      <select
                        value={st.role_id}
                        disabled={busy}
                        onChange={(e) =>
                          onAssign([{ studentId: st.student_id, team: st.team, roleId: e.target.value }])
                        }
                        className="border border-line bg-card px-1 py-0.5 text-xs"
                      >
                        <option value="">미정</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="px-3 py-2 text-xs text-faint">
                    {st.joined_at ? new Date(st.joined_at).toLocaleTimeString() : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {sub ? <StatusBadge status={sub.status} /> : <span className="text-xs text-faint">미작성</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
