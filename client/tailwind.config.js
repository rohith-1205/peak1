/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        cyan: {
          400: '#00F0FF',
          500: '#00D6E6',
        },
        orange: {
          400: '#FF6611',
          500: '#FF5500',
        },
      }
    },
  },
  plugins: [],
}
