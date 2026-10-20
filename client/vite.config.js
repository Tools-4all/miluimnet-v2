import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // בזמן פיתוח React רץ על פורט 5173 והשרת על 3000.
    // proxy מעביר כל בקשה ל-/api (ולצ'אט ב-/socket.io) לשרת Express
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
})
