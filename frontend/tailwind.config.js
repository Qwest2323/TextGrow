/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // TextGrow Design Tokens
        primary: {
          50: '#f4f1f8',
          100: '#e9e2f1',
          200: '#d6c8e5',
          300: '#bba3d3',
          400: '#9c76bd',
          500: '#8151a8',
          600: '#602E92', // Main Eminence color
          700: '#5c2c87',
          800: '#4e2571',
          900: '#42205e',
          950: '#2a1339',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#E4EA6F', // Main Manz color
          600: '#d4d058',
          700: '#a3a147',
          800: '#84813d',
          900: '#706b35',
          950: '#413b1a',
        }
      }
    },
  },
  plugins: [],
};