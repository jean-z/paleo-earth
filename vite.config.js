import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 5178 端口：避开 5173-5177
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5178 },
})
