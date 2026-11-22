/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        thapar: {
          50: '#fdf2f2',
          100: '#fce7e7',
          200: '#fad2d2',
          300: '#f5b0b0',
          400: '#ed7f7f',
          500: '#e05252',
          600: '#cc3535',
          700: '#a82424',
          800: '#8b1e2d', // Thapar Maroon / Crimson Primary
          900: '#731c26',
          950: '#3f0b12',
        },
        campus: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d9eb',
          300: '#95bde0',
          400: '#609dd1',
          500: '#3b80bf',
          600: '#2b66a5',
          700: '#235286',
          800: '#8b1e2d', // Linked to Thapar Maroon for primary elements
          900: '#0f172a', // Midnight Slate
        }
      }
    },
  },
  plugins: [],
}
