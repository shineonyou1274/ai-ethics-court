/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 밝은 '법정 문서' 테마 — 다크 네이비 배경 금지 (기획안 §7.5)
        paper: '#FAF7F0', // 배경 아이보리
        card: '#FFFFFF', // 카드 화이트
        ink: '#1F2A44', // 본문 잉크 네이비 (텍스트/괘선 전용)
        seal: '#8C2F2F', // 딥레드 직인 (판결 확정 배지)
        approve: '#2F6B4F', // 승인
        line: '#D9D2C3', // 괘선/보더
        faint: '#6B7280',
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', 'serif'],
        sans: ['"Noto Sans KR"', 'Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
