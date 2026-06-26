import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

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
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // Ultra-Premium SaaS Brand Colors - Superior, Deep, Vibrant
        royal: {
          DEFAULT: "#0B1121", // Deeper Midnight space
          50: "#f4f6fa",
          100: "#e5eaf5",
          200: "#c7d2e8",
          300: "#9cb1d5",
          400: "#6a8abc",
          500: "#46699e",
          600: "#36517e",
          700: "#2d4265",
          800: "#273855",
          900: "#233047",
          950: "#0b1121"
        },
        powder: {
          DEFAULT: "#6366F1", // muted indigo — calmer accent
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b"
        },
        bone: {
          DEFAULT: "#FCFCFD", // Superior custom clear off-white
          50: "#ffffff",
          100: "#fcfcfd",
          200: "#f8f9fa",
          300: "#f1f3f5",
          400: "#e9ecef",
          500: "#dee2e6",
          600: "#ced4da",
          700: "#adb5bd",
          800: "#868e96",
          900: "#495057",
          950: "#212529"
        },
        // Semantic colors - Superior & Refined
        border: "#E9ECEF",
        input: "#E9ECEF",
        ring: "#0B1121",
        background: "#FAFAFA",
        foreground: "#0B1121",
        primary: {
          DEFAULT: "#0B1121",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#6366F1",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#F1F3F5",
          foreground: "#0B1121",
        },
        muted: {
          DEFAULT: "#F1F3F5",
          foreground: "#495057",
        },
        destructive: {
          DEFAULT: "#E11D48", // Rose-600
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#10B981", // Emerald-500
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#F59E0B", // Amber-500
          foreground: "#ffffff",
        },
        info: {
          DEFAULT: "#6366F1",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#0B1121",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0B1121",
        },
        // Status colors - Clean & Clear
        status: {
          reported: "#D97706",
          verified: "#0F172A",
          progress: "#0284C7",
          resolved: "#059669"
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          'primary-foreground': "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          'accent-foreground': "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))"
        }
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px"
      },
      fontFamily: {
        sans: [
          "Inter var",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
        display: [
          "Inter var",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        // Superior floating Apple-style shadows
        'sleek': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.02)',
        'sleek-lg': '0 12px 24px -4px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(0, 0, 0, 0.03)',
        'sleek-xl': '0 20px 40px -8px rgba(0, 0, 0, 0.12), 0 16px 24px -8px rgba(0, 0, 0, 0.06)',
        'sleek-2xl': '0 32px 64px -12px rgba(0, 0, 0, 0.16), 0 24px 32px -12px rgba(0, 0, 0, 0.08)',

        // --- Light Claymorphism Shadows ---
        'clay-sm': 'inset 1px 1px 2px rgba(255, 255, 255, 0.9), inset -1px -1px 2px rgba(0, 0, 0, 0.03), 2px 2px 6px rgba(0, 0, 0, 0.03)',
        'clay-md': 'inset 2px 2px 4px rgba(255, 255, 255, 0.9), inset -2px -2px 4px rgba(0, 0, 0, 0.04), 4px 4px 10px rgba(0, 0, 0, 0.04)',
        'clay-lg': 'inset 3px 3px 6px rgba(255, 255, 255, 0.9), inset -3px -3px 6px rgba(0, 0, 0, 0.05), 8px 8px 20px rgba(0, 0, 0, 0.05)',
        'clay-active': 'inset 2px 2px 5px rgba(0, 0, 0, 0.06), inset -2px -2px 5px rgba(255, 255, 255, 0.8)',

        'glass': '0 8px 32px rgba(0, 0, 0, 0.06)',
        'inner-sleek': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'royal': '0 8px 24px -4px rgba(11, 17, 33, 0.20)',
        'powder': '0 8px 24px -4px rgba(99, 102, 241, 0.18)',
        'soft': '0 2px 10px 0 rgba(0, 0, 0, 0.03)',
        'soft-lg': '0 8px 24px 0 rgba(0, 0, 0, 0.07)',
      },
      backgroundImage: {
        'gradient-sleek': 'linear-gradient(to bottom, #FAFAFA 0%, #F3F4F6 100%)',
        'gradient-royal': 'linear-gradient(135deg, #0B1121 0%, #1e293b 100%)',
        'gradient-powder': 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
        'gradient-soft': 'linear-gradient(to bottom, #FFFFFF 0%, #FAFAFA 100%)',
        'glass-effect': 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.5) 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0B1121 0%, #1e293b 40%, #4338ca 100%)',
        'gradient-civic': 'linear-gradient(135deg, #0B1121 0%, #6366F1 100%)',
        'gradient-map': 'linear-gradient(135deg, #EFF0FF 0%, #E0E7FF 50%, #EFF0FF 100%)',
        'gradient-satellite': 'linear-gradient(135deg, #0B1121 0%, #1A2436 50%, #0B1121 100%)',
        'gradient-terrain': 'linear-gradient(135deg, #F0FDF4 0%, #FAFAFA 50%, #ECFDF5 100%)',
        'gradient-heatmap': 'linear-gradient(135deg, rgba(225, 29, 72, 0.03) 0%, rgba(217, 119, 6, 0.03) 50%, rgba(16, 185, 129, 0.03) 100%)',
        'gradient-card': 'linear-gradient(to bottom, #FFFFFF 0%, #FAFAFA 100%)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "marker-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.5" },
          "50%": { transform: "scale(1.1)", opacity: "0.2" },
        },
        "map-zoom": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in": "slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "float": "float 3s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "marker-pulse": "marker-pulse 2s ease-in-out infinite",
        "map-zoom": "map-zoom 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "glow": "glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;