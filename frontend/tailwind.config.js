/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#1e3a8a',  // ネイビー
        'secondary': '#6b7280', // グレー
      }
    },
  },
  plugins: [],
}
