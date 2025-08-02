import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				
				// Official CivicTrack Color Palette
				royal: '#162660',
				powder: '#D0E6FD', 
				bone: '#F1E4D1',
				
				primary: {
					DEFAULT: '#162660', // Royal Blue
					foreground: '#ffffff',
					glow: '#1e4bbd',
					variant: '#0f1b3c'
				},
				secondary: {
					DEFAULT: '#D0E6FD', // Powder Blue
					foreground: '#162660',
					variant: '#a8cefb'
				},
				neutral: {
					DEFAULT: '#F1E4D1', // Bone
					foreground: '#162660',
					variant: '#e8d5b7'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					variant: 'hsl(var(--accent-variant))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				warning: 'hsl(var(--warning))',
				success: 'hsl(var(--success))',
				status: {
					reported: '#FFA726',
					verified: '#162660', 
					progress: '#FFD54F',
					resolved: '#66BB6A'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)', 
				sm: 'calc(var(--radius) - 4px)',
				'2xl': '1rem',
				'3xl': '1.5rem'
			},
			fontFamily: {
				sans: [
					"Poppins",
					"Inter", 
					"-apple-system",
					"BlinkMacSystemFont",
					"Segoe UI",
					"Roboto",
					"sans-serif",
				],
				display: [
					"Poppins",
					"system-ui",
					"sans-serif",
				],
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				// Civic-specific animations
				'civic-pulse': {
					'0%, 100%': { 
						transform: 'scale(1)',
						opacity: '1'
					},
					'50%': { 
						transform: 'scale(1.05)',
						opacity: '0.8'
					}
				},
				'marker-pulse': {
					'0%, 100%': { 
						transform: 'scale(1)',
						opacity: '1'
					},
					'50%': { 
						transform: 'scale(1.2)',
						opacity: '0.7'
					}
				},
				'slide-up': {
					'0%': {
						transform: 'translateY(20px)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				'slide-in-right': {
					'0%': { 
						transform: 'translateX(100%)' 
					},
					'100%': { 
						transform: 'translateX(0)' 
					}
				},
				'slide-out-right': {
					'0%': { 
						transform: 'translateX(0)' 
					},
					'100%': { 
						transform: 'translateX(100%)' 
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-out': {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(10px)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'float': {
					'0%, 100%': { 
						transform: 'translateY(0px)' 
					},
					'50%': { 
						transform: 'translateY(-10px)' 
					}
				},
				'glow': {
					'0%, 100%': { 
						boxShadow: '0 0 20px hsl(var(--primary) / 0.3)'
					},
					'50%': { 
						boxShadow: '0 0 40px hsl(var(--primary) / 0.6)'
					}
				},
				'shimmer': {
					'0%': { 
						backgroundPosition: '-200% 0' 
					},
					'100%': { 
						backgroundPosition: '200% 0' 
					}
				},
				'bounce-gentle': {
					'0%, 100%': {
						transform: 'translateY(0)',
						animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)'
					},
					'50%': {
						transform: 'translateY(-5px)',
						animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)'
					}
				},
				'ripple': {
					'to': {
						transform: 'scale(4)',
						opacity: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'civic-pulse': 'civic-pulse 2s ease-in-out infinite',
				'marker-pulse': 'marker-pulse 2s ease-in-out infinite',
				'slide-up': 'slide-up 0.3s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'slide-out-right': 'slide-out-right 0.3s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite',
				'shimmer': 'shimmer 2s linear infinite',
				'bounce-gentle': 'bounce-gentle 2s infinite',
				'ripple': 'ripple 0.6s linear'
			},
			backgroundImage: {
				'gradient-civic': 'linear-gradient(135deg, #162660, #1e4bbd)',
				'gradient-hero': 'linear-gradient(135deg, #162660 0%, #D0E6FD 35%, #F1E4D1 100%)',
				'gradient-royal': 'linear-gradient(135deg, #162660, #0f1b3c)',
				'gradient-powder': 'linear-gradient(135deg, #D0E6FD, #a8cefb)',
				'gradient-bone': 'linear-gradient(135deg, #F1E4D1, #e8d5b7)',
				'gradient-status': 'linear-gradient(90deg, #66BB6A, #D0E6FD)',
				'gradient-map': 'linear-gradient(180deg, rgba(22, 38, 96, 0.1), rgba(208, 230, 253, 0.1))',
				'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
			},
			boxShadow: {
				'civic': '0 4px 24px -4px rgba(22, 38, 96, 0.25)',
				'glow': '0 0 40px rgba(22, 38, 96, 0.35)',
				'royal': '0 8px 32px -8px rgba(22, 38, 96, 0.3)',
				'powder': '0 4px 20px -4px rgba(208, 230, 253, 0.4)',
				'bone': '0 2px 16px -2px rgba(241, 228, 209, 0.3)',
				'float': '0 8px 30px -8px rgba(0, 0, 0, 0.2)',
				'glass': '0 8px 32px -8px rgba(255, 255, 255, 0.37)',
				'sm': '0 2px 8px -2px rgba(0, 0, 0, 0.08)',
				'md': '0 4px 20px -4px rgba(0, 0, 0, 0.12)',
				'lg': '0 8px 40px -8px rgba(0, 0, 0, 0.16)'
			},
			backdropBlur: {
				'glass': '20px'
			},
			transitionTimingFunction: {
				'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
				'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
				'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
			},
			spacing: {
				'safe-top': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;