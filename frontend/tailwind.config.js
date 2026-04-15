/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta institucional Avisander (extraída del logo y branding Facebook).
        // Naranja vibrante = color principal. Rojo = acento. Amarillo = destacados/CTAs premium.
        primary: {
          DEFAULT: '#F58220',   // Naranja Avisander
          dark: '#D86E12'
        },
        accent: {
          DEFAULT: '#D32F2F',   // Rojo carnicero (acento)
          dark: '#A02020'
        },
        gold: {
          DEFAULT: '#FFD800',   // Amarillo del logo (banner cápsula)
          dark: '#E5C200'
        },
        charcoal: '#0A0A0A',    // Negro profundo
        cream: '#FFFAF3',       // Blanco crema cálido
        sage: '#6B7F6D',
        surface: '#F9FAFB',
        success: '#10B981',
        warning: '#F58220',     // Reusa naranja para coherencia
        error: '#D32F2F'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif']
      },
      boxShadow: {
        soft: '0 40px 80px -20px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(0, 0, 0, 0.05)'
      }
    },
  },
  plugins: [],
}
