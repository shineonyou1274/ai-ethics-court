// 라우트 §2와 1:1. HashRouter(정적 호스팅 호환).
// 학생 화면에는 교사 기능 진입점을 렌더링하지 않는다(숨김이 아니라 미탑재) — 기획안 §2.

import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ConfirmHost } from './components/common/ConfirmDialog';
import { ToastHost } from './components/common/Toast';
import { Home } from './pages/Home';
import { Join } from './pages/Join';
import { Court } from './pages/Court';
import { TeacherHome } from './pages/TeacherHome';
import { TeacherSetup } from './pages/TeacherSetup';
import { TeacherSession } from './pages/TeacherSession';
import { TeacherArchive } from './pages/TeacherArchive';

// PDF 라이브러리(jspdf/html2canvas)는 인쇄 화면에서만 필요 — 지연 로드로 수업용 번들에서 분리
const PrintPage = lazy(() => import('./print/PrintPage').then((m) => ({ default: m.PrintPage })));

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} /> {/* S1 진입 분기 */}
        <Route path="/join" element={<Join />} /> {/* S2 학생 입장 */}
        <Route path="/court/:code" element={<Court />} /> {/* S3 학생 메인 */}
        <Route path="/teacher" element={<TeacherHome />} /> {/* S4 교사 홈 */}
        <Route path="/teacher/setup" element={<TeacherSetup />} /> {/* S5 설치 마법사 */}
        <Route path="/teacher/session/:id" element={<TeacherSession />} /> {/* S6 사건 관리 */}
        <Route path="/teacher/archive" element={<TeacherArchive />} /> {/* S7 학기 누적 집계 (M3) */}
        <Route
          path="/print/:sessionId"
          element={
            <Suspense
              fallback={
                <main className="flex min-h-screen items-center justify-center text-sm text-faint">
                  인쇄 화면 불러오는 중…
                </main>
              }
            >
              <PrintPage />
            </Suspense>
          }
        /> {/* S8 인쇄용 라이트 템플릿 (M2) */}
        <Route path="*" element={<Home />} />
      </Routes>
      <ToastHost />
      <ConfirmHost />
    </HashRouter>
  );
}
