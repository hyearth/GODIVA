import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path, { resolve } from 'path';

export default defineConfig({
  base: '',
  optimizeDeps: {
    exclude: ['three'] // three를 최적화 대상에서 제외
  },
  build: {
    rollupOptions: {
      external: ['three'] // three를 외부 의존성으로 처리
    }
  },
})