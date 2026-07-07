/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        idbi: {
          navy: '#002B49',
          blue: '#005A9C',
          cyan: '#00A3E0',
          gold: '#D4AF37',
          light: '#F4F7F9'
        },
        risk: {
          prime: '#10B981', // Emerald 500
          moderate: '#F59E0B', // Amber 500
          high: '#EF4444', // Red 500
          ntc: '#8B5CF6' // Purple 500
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px -3px rgba(0, 163, 224, 0.3)' },
          '100%': { boxShadow: '0 0 25px 5px rgba(0, 163, 224, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
