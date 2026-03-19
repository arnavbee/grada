import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "rgb(var(--kira-brown-rgb) / <alpha-value>)",
        kira: {
          black: "rgb(var(--kira-ink-rgb) / <alpha-value>)",
          darkgray: "rgb(var(--kira-muted-rgb) / <alpha-value>)",
          warmgray: "rgb(var(--kira-warmgray-rgb) / <alpha-value>)",
          midgray: "rgb(var(--kira-midgray-rgb) / <alpha-value>)",
          offwhite: "rgb(var(--kira-offwhite-rgb) / <alpha-value>)",
          brown: "rgb(var(--kira-brown-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        panel: "0 18px 50px rgba(27, 36, 31, 0.08)",
      },
      keyframes: {
        enter: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%": { transform: "scale(0.8)", opacity: "0.5" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "letter-spacing": {
          "0%": { letterSpacing: "-0.05em", opacity: "0", transform: "translateY(10px)" },
          "100%": { letterSpacing: "normal", opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        enter: "enter 420ms ease-out both",
        "pulse-dot": "pulse-dot 600ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "letter-spacing": "letter-spacing 800ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-up": "fade-in-up 800ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
