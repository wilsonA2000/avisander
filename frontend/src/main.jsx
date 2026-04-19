import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { SettingsProvider } from './context/SettingsContext'
// Manrope: texto UI — sans moderna, excelente legibilidad.
// Sólo los pesos realmente usados en pantalla. 800 se usaba en headings
// ocasionales; con 700 alcanza en móvil.
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
// Fraunces: títulos — serif premium. Pesos 500 y 600 se retiraron (nadie
// los usaba específicamente). 900 queda para hero.
import '@fontsource/fraunces/400.css'
import '@fontsource/fraunces/700.css'
import '@fontsource/fraunces/900.css'
// Inter y Playfair se movieron a AdminLayout (admin es lazy, cliente público
// ya no los descarga). Leaflet CSS se carga donde se usa (Ubicacion).
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ToastProvider>
          <SettingsProvider>
            <AuthProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </AuthProvider>
          </SettingsProvider>
        </ToastProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
