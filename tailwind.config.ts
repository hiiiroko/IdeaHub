// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  // 必须指定 content，让 Tailwind 知道去哪里扫描类名
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // 关键配置：恢复 class 模式的暗色主题
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        primary: '#3370ff',
        'primary-hover': '#285dc9',
        bg: '#f5f6f7',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    }
  },
  plugins: [],
} satisfies Config