import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { setWebappUrl } from './services';
import './index.css';

// 학생용 링크 지원: ?api=<Apps Script exec URL> 로 열면 이 기기에 연동 URL을 저장한다.
// 교사가 "학생용 링크 복사"로 만든 주소를 학생이 열기만 하면 별도 설정 없이 시트 연동 모드가 된다.
{
  const params = new URLSearchParams(window.location.search);
  const api = params.get('api');
  if (api && /^https:\/\/script\.google(usercontent)?\.com\//.test(api)) {
    setWebappUrl(api);
    params.delete('api');
    const rest = params.toString();
    const clean = window.location.pathname + (rest ? '?' + rest : '') + window.location.hash;
    window.history.replaceState(null, '', clean);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
