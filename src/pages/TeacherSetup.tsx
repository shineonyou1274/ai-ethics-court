// S5 — 설치 마법사 (기획안 §2 S5, §11.4)
// 0단계 사전 점검 + 5단계: 시트 생성 → 코드 붙여넣기 → setup 실행 → 배포 → URL 연결 테스트

import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import codeGsSource from '../../appsscript/Code.gs?raw';
import { toast } from '../components/common/Toast';
import { RemoteBackend, getWebappUrl, setWebappUrl } from '../services';
import { useAppStore } from '../stores/appStore';

const STEPS = ['사전 점검', '시트 만들기', '코드 붙여넣기', 'setup 실행', '웹 앱 배포', '연결 테스트'];

export function TeacherSetup() {
  const navigate = useNavigate();
  const { setTeacherKey } = useAppStore();
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState(getWebappUrl());
  const [keyInput, setKeyInput] = useState('');
  const [pingState, setPingState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [pingMessage, setPingMessage] = useState('');

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeGsSource);
      toast('서버 코드를 복사했습니다. Apps Script 편집기에 붙여넣으세요.', 'success');
    } catch {
      toast('복사에 실패했습니다. 아래 코드를 직접 선택해 복사하세요.', 'warn');
    }
  };

  const testPing = async () => {
    const trimmed = url.trim();
    if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(trimmed)) {
      return toast('웹 앱 URL 형식이 아닙니다. …/exec 로 끝나는 URL을 붙여넣으세요.', 'warn');
    }
    setPingState('testing');
    try {
      const res = await new RemoteBackend(trimmed).ping();
      setPingState('ok');
      setPingMessage(`연결 성공 — 서버 버전 ${res.version}`);
      toast('연결 테스트 성공', 'success');
    } catch (err) {
      setPingState('fail');
      setPingMessage(err instanceof Error ? err.message : '연결 실패');
      toast('연결에 실패했습니다. 배포 설정(액세스: 모든 사용자)을 확인하세요.', 'error');
    }
  };

  const finish = () => {
    if (pingState !== 'ok') return toast('먼저 연결 테스트를 통과하세요.', 'warn');
    if (!keyInput.trim()) return toast('setup 실행 시 표시된 교사 키를 입력하세요.', 'warn');
    setWebappUrl(url.trim());
    setTeacherKey(keyInput.trim());
    toast('설치가 완료되었습니다. 이제 사건을 개정할 수 있습니다.', 'success');
    navigate('/teacher');
  };

  const Box = ({ children }: { children: ReactNode }) => (
    <div className="space-y-3 text-sm leading-relaxed text-ink">{children}</div>
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-16 pt-8">
      <h1 className="font-serif text-2xl font-black">설치 마법사</h1>
      <p className="mt-1 text-xs text-faint">최초 1회만 설치하면 학기 내내 재사용합니다. 상황(사건)은 데이터, 스크립트는 범용 API입니다.</p>

      {/* 단계 표시 */}
      <ol className="mt-4 flex flex-wrap gap-1 text-xs">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`border px-2 py-1 ${
              i === step ? 'border-ink bg-ink font-bold text-white' : i < step ? 'border-ink/50 text-ink' : 'border-line text-faint'
            }`}
          >
            {i}. {label} {i < step && '✓'}
          </li>
        ))}
      </ol>

      <div className="doc-frame mt-4">
        <div className="doc-frame-inner">
          {step === 0 && (
            <Box>
              <h2 className="font-serif text-lg font-bold">0단계 — 사전 점검</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <b>개인 구글 계정 사용을 권장합니다.</b> 일부 학교(워크스페이스) 계정은 정책상 Apps Script 웹 앱의
                  외부 공개 배포가 차단되어 설치 자체가 불가능할 수 있습니다.
                </li>
                <li>차단된 계정의 증상: 배포 단계에서 "모든 사용자" 옵션이 없거나, 배포 후 접속 시 권한 오류 페이지가 나옵니다.</li>
                <li>이 시트에는 성적·개인정보급 데이터를 넣지 않습니다. (학번·이름·의견서만 기록)</li>
              </ul>
            </Box>
          )}
          {step === 1 && (
            <Box>
              <h2 className="font-serif text-lg font-bold">1단계 — 새 스프레드시트 만들기</h2>
              <p>
                브라우저 주소창에 <code className="bg-paper px-1">sheets.new</code> 를 입력해 새 스프레드시트를 만드세요.
                이름은 자유입니다 (예: <i>AI 윤리 법정 — 1학기</i>).
              </p>
              <p className="text-xs text-faint">탭(Sessions, Students…)은 만들 필요 없습니다. 스크립트가 자동 생성합니다.</p>
            </Box>
          )}
          {step === 2 && (
            <Box>
              <h2 className="font-serif text-lg font-bold">2단계 — Apps Script에 코드 붙여넣기</h2>
              <p>
                방금 만든 시트에서 <b>확장 프로그램 → Apps Script</b> 를 엽니다. 편집기의 기존 내용을 모두 지우고, 아래
                코드를 전체 붙여넣은 뒤 저장(Ctrl+S)하세요.
              </p>
              <button type="button" onClick={() => void copyCode()} className="btn-primary flex items-center gap-1.5">
                <Copy size={14} /> 서버 코드 전체 복사
              </button>
              <textarea
                readOnly
                value={codeGsSource}
                rows={10}
                className="w-full border border-line bg-paper p-2 font-mono text-[11px] leading-snug"
              />
            </Box>
          )}
          {step === 3 && (
            <Box>
              <h2 className="font-serif text-lg font-bold">3단계 — setup 함수 1회 실행 (교사 키 발급)</h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  편집기 상단 함수 선택 상자에서 <code className="bg-paper px-1">setup</code> 을 고르고 <b>실행</b>을 누릅니다.
                </li>
                <li>
                  권한 요청 창이 뜨면 계정을 선택합니다. <b>"확인되지 않은 앱"</b> 경고가 나오면{' '}
                  <b>고급 → (프로젝트 이름)(안전하지 않음)으로 이동</b>을 눌러 승인하세요. 본인이 방금 만든 스크립트라 안전합니다.
                </li>
                <li>
                  실행이 끝나면 하단 <b>실행 로그</b>에 <b>교사 키(teacherKey)</b>가 표시됩니다. 복사해 두세요 — 마지막 단계에서
                  입력합니다.
                </li>
              </ol>
            </Box>
          )}
          {step === 4 && (
            <Box>
              <h2 className="font-serif text-lg font-bold">4단계 — 웹 앱으로 배포</h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>편집기 우측 상단 <b>배포 → 새 배포</b>를 누릅니다.</li>
                <li>유형 선택(톱니바퀴)에서 <b>웹 앱</b>을 고릅니다.</li>
                <li>
                  실행 계정: <b>나</b> / 액세스 권한: <b>모든 사용자</b> 로 설정하고 배포합니다.
                </li>
                <li>
                  표시되는 <b>웹 앱 URL</b>(…/exec)을 복사하세요.
                </li>
              </ol>
              <p className="border border-seal/40 bg-seal/5 px-3 py-2 text-xs text-seal">
                중요: 나중에 코드를 수정하더라도 <b>"새 배포"를 다시 만들지 마세요.</b> URL이 바뀝니다. 반드시{' '}
                <b>배포 관리 → 기존 배포 편집 → 버전만 갱신</b>하세요.
              </p>
            </Box>
          )}
          {step === 5 && (
            <Box>
              <h2 className="font-serif text-lg font-bold">5단계 — 연결 테스트와 키 등록</h2>
              <label className="block">
                <span className="mb-1 block text-sm font-bold">웹 앱 URL</span>
                <input
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setPingState('idle');
                  }}
                  placeholder="https://script.google.com/macros/s/…/exec"
                  className="input-base"
                />
              </label>
              <button type="button" onClick={() => void testPing()} disabled={pingState === 'testing'} className="btn-ghost">
                {pingState === 'testing' ? '테스트 중…' : '연결 테스트 (ping)'}
              </button>
              {pingState === 'ok' && (
                <p className="flex items-center gap-1 text-sm text-approve">
                  <Check size={15} /> {pingMessage}
                </p>
              )}
              {pingState === 'fail' && <p className="text-sm text-seal">{pingMessage}</p>}
              <label className="block">
                <span className="mb-1 block text-sm font-bold">교사 키 (3단계에서 복사한 값)</span>
                <input
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="key_…"
                  className="input-base"
                />
              </label>
              <button type="button" onClick={finish} className="btn-primary">
                설치 완료
              </button>
            </Box>
          )}

          <div className="mt-6 flex justify-between border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-ghost flex items-center gap-1"
            >
              <ChevronLeft size={14} /> 이전
            </button>
            {step < STEPS.length - 1 && (
              <button type="button" onClick={() => setStep((s) => s + 1)} className="btn-primary flex items-center gap-1">
                다음 <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <Link to="/teacher" className="mt-4 inline-flex items-center gap-1 text-xs text-faint hover:text-ink">
        <ChevronLeft size={13} /> 교사 홈으로
      </Link>
    </main>
  );
}
