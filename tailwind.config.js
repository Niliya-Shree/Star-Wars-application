module.exports = {
  purge: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        'star-wars-yellow': '#FFE81F',
        'star-wars-blue': '#1E90FF',
        'star-wars-dark': '#1A1A1A',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
