import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

// 기본 빌드: dist/index.html 한 개(곡까지 담김). 파일 하나만 나눠 주면 된다.
// site 빌드(--mode site): site-v2/ 폴더(첫 판은 site/에 그대로 둔다). 웹 주소·QR로 열 때 쓴다. 곡은 따로 받고, 한 번 열면 통신이 끊겨도 돌아간다.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [viteSingleFile()],
  css: { postcss: { plugins: [] } }, // 위 폴더(AI 윤리 법정)의 설정을 물려받지 않는다
  resolve: { alias: mode === 'site' ? [{ find: /^\.\/bgm-data\.js$/, replacement: fileURLToPath(new URL('./src/bgm-none.js', import.meta.url)) }] : [] },
  define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16)) },
  build: { target: 'es2019', chunkSizeWarningLimit: 8000, outDir: mode === 'site' ? 'site-v2' : 'dist' },
}));
