/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 牛皮纸手帐色板
        kraft: {
          50: '#efe7d7',
          100: '#e6dbc6',
          200: '#d9cbb0',
          300: '#c9b899',
          400: '#bba884',
          500: '#a5946f',
          600: '#8f7f63',
          700: '#6f6249',
          800: '#4e4534',
          900: '#332d22',
        },
        paper: {
          DEFAULT: '#f4eee1',
          light: '#faf6ec',
          aged: '#eae0cd',
          shade: '#ded2ba',
        },
        sticky: {
          DEFAULT: '#f4e59b',
          light: '#f8eeb4',
          deep: '#ecd882',
          blue: '#cfdcdf',
          pink: '#f0d5cb',
        },
        ink: {
          DEFAULT: '#2f2b25',
          soft: '#544c40',
          faint: '#867b69',
          pale: '#a89b85',
        },
        pencil: '#a8443a',
        stampred: '#9c4038',
        clip: '#9b9b95',
      },
      fontFamily: {
        song: [
          'Songti SC',
          'SimSun',
          'STSong',
          'Noto Serif SC',
          'Source Han Serif SC',
          'serif',
        ],
        sans: [
          'Songti SC',
          'SimSun',
          'STSong',
          'Noto Serif SC',
          'serif',
        ],
      },
      boxShadow: {
        paper:
          '0 1px 1px rgba(51,45,34,0.10), 0 3px 6px rgba(51,45,34,0.12), 0 10px 20px rgba(51,45,34,0.10)',
        'paper-lg':
          '0 2px 3px rgba(51,45,34,0.12), 0 8px 16px rgba(51,45,34,0.16), 0 22px 44px rgba(51,45,34,0.16)',
        sticky:
          '0 1px 1px rgba(51,45,34,0.14), 0 4px 8px rgba(51,45,34,0.16), 0 10px 16px rgba(51,45,34,0.10)',
        inset: 'inset 0 0 40px rgba(120,104,76,0.12)',
      },
    },
  },
  plugins: [],
};
