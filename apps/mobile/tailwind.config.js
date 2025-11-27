/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        peach: {
          50: '#FFF5F3',
          200: '#FFD4C4',
          400: '#FF8A75',
          500: '#FF6B4D',
          600: '#E85A3F',
        },
        eduGreen: {
          50: '#F0FDFC',
          200: '#99F6E4',
          400: '#4ECDC4',
          500: '#14B8A6',
          600: '#0D9488',
        },
        eduBlue: {
          50: '#F0F9FF',
          200: '#A8DADC',
          400: '#38BDF8',
          500: '#457B9D',
          600: '#0284C7',
        },
      },
    },
  },
  plugins: [],
};
