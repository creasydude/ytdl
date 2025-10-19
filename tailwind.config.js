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
        dark: {
          bg: '#0a0a0a',
          surface: '#1a1a1a',
          border: '#2a2a2a',
          text: '#e5e5e5',
          muted: '#a3a3a3',
        },
        light: {
          bg: '#ffffff',
          surface: '#f5f5f5',
          border: '#e5e5e5',
          text: '#171717',
          muted: '#737373',
        }
      },
    },
  },
  plugins: [],
}
