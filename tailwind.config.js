/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAF7F0',
          dark: '#181715'
        },
        ink: {
          DEFAULT: '#2B2A28',
          dim: '#6B675F',
          light: '#F2EEE4'
        },
        stamp: {
          DEFAULT: '#1F6F5C',
          light: '#2E8F77',
          soft: '#E4EFEA'
        },
        rust: {
          DEFAULT: '#C4622D',
          soft: '#F4E4D8'
        },
        line: {
          DEFAULT: '#DDD6C7',
          dark: '#3A3833'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      borderRadius: {
        stamp: '2px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(43,42,40,0.06), 0 1px 0 rgba(43,42,40,0.04)'
      }
    }
  },
  plugins: []
}
