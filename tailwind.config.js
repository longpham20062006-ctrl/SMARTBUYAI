/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // New Premium Streetwear × Minimalist Palette
          bg: '#FAFAF8',               // Main background #FAFAF8
          subtle: '#F2F3F5',           // Secondary background #F2F3F5
          surface: '#FFFFFF',          // Card / Surface #FFFFFF
          primary: '#18181B',          // Primary Dark #18181B
          'primary-hover': '#303036',  // Primary Hover #303036
          accent: '#8B5CF6',           // Main Accent Violet #8B5CF6
          'accent-hover': '#7C3AED',   // Accent Hover #7C3AED
          'accent-light': '#F3E8FF',   // Light Accent #F3E8FF
          text: '#18181B',             // Main text #18181B
          'text-secondary': '#71717A', // Secondary text #71717A
          border: '#E4E4E7',           // Border #E4E4E7

          // Semantic Status Colors
          success: '#16A34A',
          error: '#DC2626',
          warning: '#D97706',

          // Backwards-compatible aliases for legacy components
          ivory: '#FAFAF8',
          paper: '#FFFFFF',
          charcoal: '#18181B',
          secondary: '#71717A',
          muted: '#71717A',
          forest: '#18181B',
          'forest-hover': '#303036',
          'forest-light': '#F3E8FF',
          sage: '#F2F3F5',
          sand: '#F2F3F5',
          terracotta: '#8B5CF6',
          'terracotta-light': '#F3E8FF',
          champagne: '#EDE9FE',
          neon: '#8B5CF6',
          'neon-hover': '#7C3AED',
          pink: '#8B5CF6',
          'pink-hover': '#7C3AED',
          lime: '#F3E8FF',
        }
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', '"Be Vietnam Pro"', 'sans-serif'],
        editorial: ['"Be Vietnam Pro"', 'sans-serif'],
      },
      borderRadius: {
        'brand-sm': '6px',
        'brand': '10px',
        'brand-lg': '14px',
        'brand-xl': '18px',
        'brand-2xl': '24px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 2px 8px -2px rgba(24, 24, 27, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(24, 24, 27, 0.08)',
        'elevated': '0 12px 30px -6px rgba(24, 24, 27, 0.1)',
        'accent': '0 4px 14px 0 rgba(139, 92, 246, 0.25)',
        'drawer': '0 10px 40px -4px rgba(0, 0, 0, 0.2)',
        'modal': '0 20px 50px -10px rgba(0, 0, 0, 0.25)',
      },
      maxWidth: {
        'container': '1400px',
      },
    },
  },
  plugins: [],
}
