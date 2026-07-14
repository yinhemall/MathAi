/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#050505',
          panel: '#0a0a0f',
          neon: '#00f0ff',
          glow: 'rgba(0, 240, 255, 0.5)'
        }
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 240, 255, 0.3), 0 0 20px rgba(0, 240, 255, 0.2)',
        'neon-strong': '0 0 15px rgba(0, 240, 255, 0.6), 0 0 30px rgba(0, 240, 255, 0.4)',
      }
    },
  },
  plugins: [],
}
