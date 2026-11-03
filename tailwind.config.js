const flowbite = require("flowbite-react/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{jsx,js,tsx,ts}", flowbite.content(),],
  theme: {
    extend: {
      colors: {
        lightPrimaryColor: '#1b7571',
        primaryColor: '#225c59',
        lighestPrimaryColor: '#c3f3f1',
        inputBgColor: '#c2bfbf81'
      },
      screens: {
        max950: { max: '950px' },
        max980: { max: '980px' },
        max850: { max: '850px' },
        min536: { min: '536px' },
        min800: { min: '800px' },
        min1050: { min: '1050px' },
        max1008: { max: '1008px' },
        max478: { max: '478px' },
        max450: { max: '450px' },
        max406: { max: '406px' },
        max500: { max: '500px' },
        max600: { max: '600px' },
        min600: { min: '600px' },
        max767: { max: "767px" },
        max900: { max: '900px' },
        max1050: { max: '1050px' },
        max1194: { max: '1194px' },
        max1350: { max: '1350px' },
        max1250: { max: '1250px' },
        max1920: { max: '1920px' },
        min1920: { min: '1920px' },
        min1700: { min: '1700px' },
        min1800: { min: '1800px' },
        max1078: { max: '1078px' },
        max800: { max: '800px' },
        max536: { max: '536px' },
        xs: '1000px'
      },
      fontFamily: {
        inter: ['"Inter"', 'sans-serif'],
        poppins: ['"Poppins"', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        baijamjuree: ['"Bai Jamjuree"', 'sans-serif'],
        josefin: ['"Josefin Sans"', 'sans-serif'],
        instrument: ['"Instrument Sans"', 'sans-serif'],
        outfit: ['"Outfit"', 'sans-serif'],
        k2d: ['"K2D"', 'sans-serif'],
      }
    },
  },
  plugins: [
    flowbite.plugin(),
  ],
};
