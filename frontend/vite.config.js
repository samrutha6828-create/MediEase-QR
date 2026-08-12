import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://mediease-qr.onrender.com',
        changeOrigin: true,
      },
      '/socket.io': {
        target: '',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
