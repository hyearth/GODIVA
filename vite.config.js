import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path, { resolve } from 'path';

export default defineConfig({
  base: './',  // 상대 경로로 설정
  build: {
    rollupOptions: {
      external: false // 외부 모듈을 번들에 포함
    }
  },
})