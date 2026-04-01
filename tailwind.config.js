/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  theme: {
    fontFamily: {},
    extend: {},
  },
  plugins: [require('tailwindcss-animate')],
};
