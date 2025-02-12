import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path, { resolve } from 'path';

export default defineConfig({
	base: '',
  build: {
    outDir: './build',
  },
});