import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 빌드하면 dist/index.html 한 개가 나온다. 그 파일 하나만 나눠 주면 된다.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  css: { postcss: { plugins: [] } }, // 위 폴더(AI 윤리 법정)의 설정을 물려받지 않는다
  server: { fs: { allow: ['..'] } }, // 앱끼리 함께 쓰는 ../shared 를 읽는다
  build: { target: 'es2019', chunkSizeWarningLimit: 8000 },
});
