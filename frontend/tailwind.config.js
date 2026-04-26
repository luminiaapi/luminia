/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        'brand-accent': 'var(--color-brand-accent)',
        'bg-deep': 'var(--color-bg-deep)',
        'bg-card': 'var(--color-bg-card)',
        'bg-input': 'var(--color-bg-input)',
        'text-main': 'var(--color-text-main)',
        'text-dim': 'var(--color-text-dim)',
        'border-subtle': 'var(--color-border-subtle)',
        'success': '#10B981',
        'warning': '#F59E0B',
        'danger': '#EF4444',
      },
      boxShadow: {
        'glow': '0 0 20px var(--color-brand-accent)',
      },
    },
  },
  plugins: [],
}
