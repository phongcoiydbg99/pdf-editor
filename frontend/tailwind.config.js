/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'pdf-dark': '#111926',
        'pdf-slate': '#1b2433',
        'pdf-muted': '#6b7280',
        'pdf-accent': '#4f8ef7',
      },
    },
  },
  plugins: [],
}
