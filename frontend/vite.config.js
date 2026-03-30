import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['date-fns', 'date-fns-tz'], // إضافة هذا السطر
  },
  server: {
    port: 5173,
    open: true
  }
})