/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F7F1E6',
          light: '#FBF7EF',
          dark: '#EDE3D0'
        },
        pink: {
          DEFAULT: '#F3B8C6',
          light: '#FBE0E6',
          dark: '#E894A9'
        },
        stone2: {
          DEFAULT: '#DAD5CC',
          dark: '#A79E92',
          darker: '#7C736A'
        },
        ink: '#4A4038',
        mint: {
          DEFAULT: '#BFE0C4',
          dark: '#8FC79A'
        },
        butter: '#F6DFA0'
      },
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', 'cursive'],
        pixel: ['"Press Start 2P"', 'cursive'],
        body: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif']
      },
      boxShadow: {
        pixel: '3px 3px 0 0 #4A4038',
        'pixel-sm': '2px 2px 0 0 #4A4038',
        'pixel-lg': '5px 5px 0 0 #4A4038',
        'pixel-pink': '3px 3px 0 0 #E894A9'
      }
    }
  },
  plugins: []
}
