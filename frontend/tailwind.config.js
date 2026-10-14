/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-soft': 'var(--primary-soft)',
        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-soft)',
        warning: 'var(--warning)',
        'warning-soft': 'var(--warning-soft)',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
