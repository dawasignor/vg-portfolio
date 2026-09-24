import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 5173 is taken by another project on this machine; fail loudly rather than drift.
  server: { port: 5180, strictPort: true },
})
