/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A6B2E',
          dark: '#124D21',
          light: '#2E8B45',
        },
        shell: {
          DEFAULT: '#0C2A1B',
          light: '#123825',
        },
      },
    },
  },
  plugins: [],
}

