// S1 — 진입 분기: [학생 입장] 크게 / [교사] 작게 하단 (기획안 §2)

import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { isDemoMode } from '../services';
import { DemoBadge } from '../components/common/Badge';

export function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="doc-frame">
          <div className="doc-frame-inner">
            <Scale size={40} className="mx-auto text-ink" />
            <h1 className="mt-4 font-serif text-3xl font-black tracking-tight text-ink">AI 윤리 법정</h1>
            <p className="mt-2 text-sm text-faint">AI의 진술, 그대로 믿어도 될까요? 근거로 판단하는 배심원이 되어 보세요.</p>
            <Link
              to="/join"
              className="mt-8 block w-full bg-ink py-4 text-center font-serif text-xl font-bold text-white hover:bg-ink/90"
            >
              학생으로 입장하기
            </Link>
            {isDemoMode() && (
              <div className="mt-3">
                <DemoBadge />
              </div>
            )}
          </div>
        </div>
        <Link to="/teacher" className="mt-6 inline-block text-xs text-faint underline hover:text-ink">
          교사용 입구
        </Link>
      </div>
    </main>
  );
}
