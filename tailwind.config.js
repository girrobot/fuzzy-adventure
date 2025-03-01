/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFA500', // Custom orange color
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
        lora: ['Libre+Baskerville', 'serif'],
      },
    },
  },
  plugins: [],
}

