/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ba: {
          primary:   '#3B9EDB',
          hover:     '#2D8BC4',
          pale:      '#E8F4FD',
          pale2:     '#D1E9F7',
          navy:      '#1B2A3B',
          muted:     '#64748B',
          border:    '#D1E9F7',
          yellow:    '#F5C842',
          'yellow-pale': '#FEF9E7',
          bg:        '#F0F7FD',
          card:      '#FFFFFF',
          success:   '#22C55E',
          error:     '#EF4444',
          warning:   '#F59E0B',
        }
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 4px 0 rgba(59,158,219,0.08), 0 0 0 1px rgba(209,233,247,0.8)',
        'card-hover': '0 4px 16px 0 rgba(59,158,219,0.15), 0 0 0 1px rgba(59,158,219,0.2)',
      }
    }
  },
  plugins: []
}
