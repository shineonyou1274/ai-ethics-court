// "○초 전 갱신" 배지 + 수동 새로고침 버튼 (기획안 §5.3 폴링 규칙)

import { useEffect, useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';

interface Props {
  updatedAt: number; // dataUpdatedAt (ms). 0이면 미갱신
  isFetching: boolean;
  isError?: boolean;
  onRefresh: () => void;
  pendingCount?: number; // outbox 대기 건수
}

export function RefreshIndicator({ updatedAt, isFetching, isError, onRefresh, pendingCount = 0 }: Props) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const sec = updatedAt ? Math.max(0, Math.round((Date.now() - updatedAt) / 1000)) : null;

  return (
    <div className="flex items-center gap-2 text-xs text-faint">
      {isError && (
        <span className="flex items-center gap-1 border border-seal/50 bg-seal/10 px-2 py-0.5 text-seal">
          <WifiOff size={12} /> 연결 끊김
        </span>
      )}
      {pendingCount > 0 && (
        <span className="border border-amber-500 bg-amber-50 px-2 py-0.5 text-amber-700">
          전송 대기 {pendingCount}건
        </span>
      )}
      <span>{sec === null ? '갱신 전' : sec < 5 ? '방금 갱신' : `${sec}초 전 갱신`}</span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isFetching}
        className="flex items-center gap-1 border border-line bg-card px-2 py-1 text-ink hover:bg-paper disabled:opacity-50"
        title="지금 새로고침"
      >
        <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
        새로고침
      </button>
    </div>
  );
}
