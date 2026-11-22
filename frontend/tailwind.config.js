/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d9eb',
          300: '#95bde0',
          400: '#609dd1',
          500: '#3b80bf',
          600: '#2b66a5',
          700: '#235286',
          800: '#1e3a8a', // Deep Navy Blue
          900: '#0f172a', // Midnight Slate
        }
      }
    },
  },
  plugins: [],
}
