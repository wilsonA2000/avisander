import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom']
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-filerobot-image-editor', 'konva', 'react-konva', 'use-image']
    },
    server: {
      port: 5173,
      // Permitir acceso desde túnel ngrok (redirección de Bold tras pago).
      // Vite 5 por defecto bloquea hosts no listados como medida de seguridad.
      allowedHosts: ['.ngrok-free.app', '.ngrok.app', '.ngrok.io'],
      // Headers requeridos por FFmpeg.wasm (SharedArrayBuffer necesita
      // Cross-Origin Isolation). Sin estos, el editor de video no funciona.
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless'
      },
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
