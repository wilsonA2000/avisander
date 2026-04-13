/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DC2626', // Rojo - Color principal
          dark: '#991B1B',    // Rojo oscuro - Hover y acentos
        },
        surface: '#F9FAFB',   // Gris claro - Fondos secundarios
        success: '#16A34A',   // Verde - Confirmaciones
        warning: '#EAB308',   // Amarillo - Ofertas y alertas
        error: '#EF4444',     // Rojo - Errores
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
