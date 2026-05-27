/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#05070f',
        plasma: '#ff3ea5',
        aurora: '#23d5ff',
        ion: '#91ffef',
        violet: '#8d5bff',
      },
      boxShadow: {
        neon: '0 0 35px rgba(35, 213, 255, 0.28)',
        plasma: '0 0 40px rgba(255, 62, 165, 0.22)',
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -16px, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        floaty: 'floaty 8s ease-in-out infinite',
        shimmer: 'shimmer 18s ease infinite',
      },
    },
  },
  plugins: [],
}
