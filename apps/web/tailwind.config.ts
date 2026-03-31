import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
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
        "cube-dot": {
          "0%": {
            transform: "perspective(140px) rotateX(0deg) rotateY(0deg)",
            opacity: "0.96",
            boxShadow:
              "inset 1px 1px 0 rgba(255, 255, 255, 0.42), 0 1px 4px rgba(45, 27, 13, 0.16)",
          },
          "25%": {
            transform: "perspective(140px) rotateX(90deg) rotateY(0deg)",
            opacity: "1",
            boxShadow:
              "inset -1px 1px 0 rgba(255, 255, 255, 0.5), 0 2px 6px rgba(45, 27, 13, 0.22)",
          },
          "50%": {
            transform: "perspective(140px) rotateX(90deg) rotateY(90deg)",
            opacity: "1",
            boxShadow:
              "inset 1px -1px 0 rgba(255, 255, 255, 0.5), 0 2px 6px rgba(45, 27, 13, 0.22)",
          },
          "75%": {
            transform: "perspective(140px) rotateX(180deg) rotateY(180deg)",
            opacity: "1",
            boxShadow:
              "inset -1px -1px 0 rgba(255, 255, 255, 0.45), 0 2px 6px rgba(45, 27, 13, 0.2)",
          },
          "100%": {
            transform: "perspective(140px) rotateX(360deg) rotateY(360deg)",
            opacity: "0.96",
            boxShadow:
              "inset 1px 1px 0 rgba(255, 255, 255, 0.42), 0 1px 4px rgba(45, 27, 13, 0.16)",
          },
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
        "cube-dot": "cube-dot 1.35s linear infinite",
        "letter-spacing": "letter-spacing 800ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-up": "fade-in-up 800ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
