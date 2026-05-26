import type { Config } from 'tailwindcss';

/**
 * mimi luxury palette (per brandbook + storytelling visuals).
 *   primary  #3C1975   deep royal purple
 *   accent   #D4EC4C   lime
 *   pop      #FC9603   orange
 *   surface  #0A0712   near-black with violet undertone
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0712',
        ink2: '#0F0A1B',
        surface: '#15102A',
        surface2: '#1B1438',
        brand: {
          purple: '#3C1975',
          purpleDeep: '#2A1257',
          purpleLight: '#5B3CA3',
          purpleSoft: '#8267C8',
          lime: '#D4EC4C',
          limeSoft: '#E4F47A',
          limeDeep: '#A8BD2F',
          orange: '#FC9603',
          orangeSoft: '#FFB347',
        },
        gold: {
          DEFAULT: '#D4EC4C',
          soft: '#E4F47A',
          deep: '#A8BD2F',
        },
        emerald: {
          deep: '#3C1975',
          glow: '#5B3CA3',
        },
        muted: '#8A7FA8',
        light: '#F5F1FA',
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        display: ['var(--font-moderustic)', 'var(--font-manrope)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['"SF Mono"', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Tightened display sizes — luxury whispers, not shouts
        'eyebrow': ['clamp(0.625rem, 0.7vw, 0.75rem)', { lineHeight: '1', letterSpacing: '0.4em' }],
        'hero-xs': ['clamp(1.75rem, 3.4vw, 2.75rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'hero-sm': ['clamp(2.25rem, 4.6vw, 3.6rem)', { lineHeight: '1.0', letterSpacing: '-0.025em' }],
        'hero': ['clamp(2.75rem, 6vw, 4.8rem)', { lineHeight: '0.98', letterSpacing: '-0.03em' }],
        'hero-xl': ['clamp(3.5rem, 8vw, 6.2rem)', { lineHeight: '0.95', letterSpacing: '-0.035em' }],
      },
      spacing: {
        section: 'clamp(6rem, 12vw, 10rem)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #E4F47A 0%, #D4EC4C 50%, #A8BD2F 100%)',
        'lime-gradient': 'linear-gradient(135deg, #E4F47A 0%, #D4EC4C 50%, #A8BD2F 100%)',
        'lime-soft': 'linear-gradient(135deg, rgba(228,244,122,0.18) 0%, rgba(212,236,76,0.06) 100%)',
        'emerald-gradient': 'linear-gradient(135deg, #2A1257 0%, #5B3CA3 100%)',
        'purple-gradient': 'linear-gradient(135deg, #2A1257 0%, #5B3CA3 100%)',
        'purple-soft': 'linear-gradient(135deg, rgba(91,60,163,0.25) 0%, rgba(60,25,117,0.12) 100%)',
        'emerald-gold': 'linear-gradient(120deg, #5B3CA3 0%, #D4EC4C 100%)',
        'lime-purple': 'linear-gradient(120deg, #5B3CA3 0%, #D4EC4C 100%)',
        'orange-fire': 'linear-gradient(135deg, #FC9603 0%, #FFB347 100%)',
        'surface-gradient': 'linear-gradient(135deg, rgba(21,16,42,0.9) 0%, rgba(10,7,18,0.7) 100%)',
        'glow-radial': 'radial-gradient(circle at center, rgba(212,236,76,0.22) 0%, transparent 70%)',
        'glow-purple': 'radial-gradient(circle at center, rgba(91,60,163,0.4) 0%, transparent 70%)',
        'noise': "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
      boxShadow: {
        gold: '0 0 40px rgba(212,236,76,0.35)',
        'gold-lg': '0 0 80px rgba(212,236,76,0.45)',
        lime: '0 0 40px rgba(212,236,76,0.35)',
        'lime-lg': '0 0 80px rgba(212,236,76,0.45)',
        emerald: '0 0 60px rgba(60,25,117,0.55)',
        purple: '0 0 60px rgba(60,25,117,0.55)',
        'purple-lg': '0 0 120px rgba(60,25,117,0.65)',
        orange: '0 0 40px rgba(252,150,3,0.4)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
        'card': '0 30px 80px -30px rgba(0,0,0,0.7), 0 1px 0 0 rgba(255,255,255,0.03) inset',
        'card-lg': '0 50px 120px -40px rgba(0,0,0,0.85), 0 1px 0 0 rgba(255,255,255,0.04) inset',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.7' },
        },
        'dash-flow': {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-40' },
        },
        'sweep': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        shimmer: 'shimmer 3s linear infinite',
        glow: 'glow 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'dash-flow': 'dash-flow 2s linear infinite',
        'sweep': 'sweep 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
