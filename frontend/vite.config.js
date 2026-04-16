import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Permitir acceso desde túnel ngrok (redirección de Bold tras pago).
      // Vite 5 por defecto bloquea hosts no listados como medida de seguridad.
      allowedHosts: ['.ngrok-free.app', '.ngrok.app', '.ngrok.io'],
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true
        },
        '/media': {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  }
})
