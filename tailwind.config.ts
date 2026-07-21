import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['Inter', 'var(--font-geist-sans)', '-apple-system', 'sans-serif'],
  			display: ['Sora', 'Inter', 'sans-serif'],
  			mono: ['var(--font-geist-mono)', 'Fira Code', 'monospace'],
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			/* Aqua Blue brand scale matching mockup images */
			brand: {
				50: '#ECFEFF',
				100: '#CFFAFE',
				200: '#A5F3FC',
				300: '#67E8F9',
				400: '#22D3EE',
				500: '#06B6D4',
				600: '#0891B2',
				700: '#0E7490',
				800: '#155E75',
				900: '#164E63',
			},
			/* Sidebar colors */
			sidebar: {
				bg: '#111427',
				active: '#06B6D4',
				text: '#C7CAD8',
				card: '#1B1F36',
			},
			/* Semantic status colors from mockups */
			success: { DEFAULT: '#10B981', bg: '#ECFDF5', text: '#087F76' },
			warning: { DEFAULT: '#F59E0B', bg: '#FFF5DF', text: '#9A6500' },
			danger: { DEFAULT: '#EF4444', bg: '#FFF0F2', text: '#C7374B' },
			info: { DEFAULT: '#06B6D4', bg: '#ECFEFF', text: '#06B6D4' },
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'fade-in': {
  				'0%': { opacity: '0', transform: 'translateY(4px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			'slide-right': {
  				'0%': { transform: 'translateX(100%)' },
  				'100%': { transform: 'translateX(0)' },
  			},
  		},
  		animation: {
  			'fade-in': 'fade-in 200ms ease-out',
  			'slide-right': 'slide-right 250ms ease-out',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
