/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF5FA2',
          light: '#FFF0F7',
        },
        secondary: {
          DEFAULT: '#A855F7',
          light: '#F5F0FF',
        },
        accent: {
          DEFAULT: '#FFB86B',
          light: '#FFF9F2',
        },
        background: {
          DEFAULT: '#FFF7FB',
          light: '#FFF7FB',
        },
        card: {
          DEFAULT: '#FFFFFF',
          elevated: '#FFFDFE',
          soft: '#FFF0F7',
          light: '#FFFFFF',
        },
        border: {
          DEFAULT: 'rgba(255, 95, 162, 0.08)',
          light: 'rgba(255, 95, 162, 0.05)',
        },
        text: {
          DEFAULT: '#1F2937',
          muted: '#6B7280',
          lightMain: '#1F2937',
          lightMuted: '#6B7280',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
