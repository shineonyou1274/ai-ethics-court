import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages 등 하위 경로 배포 호환 (HashRouter 사용이므로 상대 경로로 충분)
  base: './',
  plugins: [react()],
});
