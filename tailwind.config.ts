import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'pixel-font': ['Pixel'],
      },
      animation: {
        'fall': 'fall linear infinite',
      },
      keyframes: {
        fall: {
          '0%': {
            transform: 'translateY(-100vh)',
          },
          '100%': {
            transform: 'translateY(100vh)',
          },
        },
      },
    },
  },
  plugins: [
  ],
}
export default config
