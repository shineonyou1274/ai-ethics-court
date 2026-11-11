import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 결과물은 dist/index.html 한 개. 학생에게 파일 하나만 나눠 주면 된다.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  css: { postcss: { plugins: [] } }, // 위 폴더(AI 윤리 법정)의 설정을 물려받지 않는다
  build: { target: 'es2019', chunkSizeWarningLimit: 2000 },
});
