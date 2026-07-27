// S2 — 세션 코드 + 학번 + 이름 입장. 재접속 시 LocalStorage 자동 복원 (기획안 §2)

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { ApiError } from '../api/contract';
import { confirmDialog } from '../components/common/ConfirmDialog';
import { toast } from '../components/common/Toast';
import { joinCodeSchema, studentIdSchema } from '../lib/validate';
import { getBackend } from '../services';
import { useAppStore } from '../stores/appStore';

export function Join() {
  const navigate = useNavigate();
  const { identity, session, setIdentity, setSession } = useAppStore();
  const [code, setCode] = useState(session?.code ?? '');
  const [studentId, setStudentId] = useState(identity?.studentId ?? '');
  const [name, setName] = useState(identity?.name ?? '');
  const [busy, setBusy] = useState(false);

  const doJoin = async (confirmName = false) => {
    const codeCheck = joinCodeSchema.safeParse(code.trim());
    if (!codeCheck.success) return toast(codeCheck.error.issues[0].message, 'warn');
    const idCheck = studentIdSchema.safeParse(studentId.trim());
    if (!idCheck.success) return toast(idCheck.error.issues[0].message, 'warn');
    if (!name.trim()) return toast('이름을 입력하세요.', 'warn');

    setBusy(true);
    try {
      const result = await getBackend().join({
        code: code.trim(),
        studentId: studentId.trim(),
        name: name.trim(),
        confirmName,
      });
      setIdentity({ studentId: studentId.trim(), name: name.trim() });
      setSession({
        code: result.session.code,
        sessionId: result.session.session_id,
        team: result.student.team,
        roleId: result.student.role_id,
      });
      toast(`${result.student.team || '모둠 미정'}으로 입장했습니다.`, 'success');
      navigate(`/court/${result.session.code}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NAME_MISMATCH') {
        const yes = await confirmDialog({
          title: '학번 확인',
          message: `${err.message}\n\n내 학번이 맞다면 계속 진행하세요. 아니라면 학번을 다시 확인하세요.`,
          confirmText: '내 학번이 맞아요, 계속',
          cancelText: '다시 입력할게요',
        });
        if (yes) await doJoin(true);
      } else {
        toast(err instanceof Error ? err.message : '입장에 실패했습니다.', 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="doc-frame">
          <div className="doc-frame-inner">
            <h1 className="font-serif text-2xl font-black text-ink">법정 출석부</h1>
            <p className="mt-1 text-xs text-faint">선생님이 알려준 코드와 내 학번, 이름을 입력하세요.</p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void doJoin();
              }}
            >
              <label className="block">
                <span className="mb-1 block text-sm font-bold">사건(세션) 코드</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="예: 3721"
                  className="input-base text-center font-mono text-xl tracking-widest"
                  maxLength={6}
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-bold">학번 (4~6자리 숫자)</span>
                <input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder="예: 10130"
                  className="input-base"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-bold">이름</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 김하늘"
                  className="input-base"
                  maxLength={20}
                />
              </label>
              <button type="submit" disabled={busy} className="btn-primary flex w-full items-center justify-center gap-2 py-3">
                {busy ? '입장 중…' : '출석하기'} <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-xs text-faint hover:text-ink">
          <ChevronLeft size={13} /> 처음으로
        </Link>
      </div>
    </main>
  );
}
