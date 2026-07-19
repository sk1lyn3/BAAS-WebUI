/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ba: {
          primary:   'rgb(var(--ba-primary) / <alpha-value>)',
          hover:     'rgb(var(--ba-hover) / <alpha-value>)',
          pale:      'rgb(var(--ba-pale) / <alpha-value>)',
          pale2:     'rgb(var(--ba-pale2) / <alpha-value>)',
          navy:      'rgb(var(--ba-navy) / <alpha-value>)',
          muted:     'rgb(var(--ba-muted) / <alpha-value>)',
          border:    'rgb(var(--ba-border) / <alpha-value>)',
          yellow:    'rgb(var(--ba-yellow) / <alpha-value>)',
          'yellow-pale': 'rgb(var(--ba-yellow-pale) / <alpha-value>)',
          bg:        'rgb(var(--ba-bg) / <alpha-value>)',
          card:      'rgb(var(--ba-card) / <alpha-value>)',
          success:   'rgb(var(--ba-success) / <alpha-value>)',
          error:     'rgb(var(--ba-error) / <alpha-value>)',
          warning:   'rgb(var(--ba-warning) / <alpha-value>)',
        }
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        card: 'var(--ba-shadow-card)',
        'card-hover': 'var(--ba-shadow-card-hover)',
      }
    }
  },
  plugins: []
}
