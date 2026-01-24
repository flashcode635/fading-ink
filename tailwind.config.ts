import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        serif: ['Crimson Pro', 'Georgia', 'serif'],
        typewriter: ['Special Elite', 'Courier New', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Paper aging colors
        paper: {
          fresh: "hsl(var(--paper-fresh))",
          aged1: "hsl(var(--paper-aged-1))",
          aged2: "hsl(var(--paper-aged-2))",
          aged3: "hsl(var(--paper-aged-3))",
        },
        // Stain colors
        stain: {
          brown: "hsl(var(--stain-brown))",
          dark: "hsl(var(--bruise-dark))",
          coffee: "hsl(var(--coffee-stain))",
        },
        // Ink colors
        ink: {
          black: "hsl(var(--ink-black))",
          faded: "hsl(var(--ink-faded))",
          ghost: "hsl(var(--ink-ghost))",
        },
        // Decay indicators
        decay: {
          healthy: "hsl(var(--decay-healthy))",
          warning: "hsl(var(--decay-warning))",
          critical: "hsl(var(--decay-critical))",
          sienna: "hsl(var(--decay-sienna))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(139, 69, 19, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(139, 69, 19, 0)" },
        },
        "float-up": {
          "0%": { transform: "translateY(0)", opacity: "0.5" },
          "100%": { transform: "translateY(-50px)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-glow": "pulse-glow 1.5s ease-in-out infinite",
        "float-up": "float-up 3s ease-out forwards",
      },
      boxShadow: {
        paper: "0 1px 3px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06)",
        "paper-hover": "0 2px 8px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08), 0 20px 40px rgba(0,0,0,0.1)",
        fold: "-2px 2px 4px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
