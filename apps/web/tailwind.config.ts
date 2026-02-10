import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kira: {
          black: "#060606",
          darkgray: "#4F4F50",
          warmgray: "#C7B7B6",
          midgray: "#7A7C88",
          offwhite: "#FBFBFB",
          brown: "#90715B",
        },
      },
      fontFamily: {
        sans: ["Inter", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        panel: "0 8px 30px rgba(6, 6, 6, 0.06)",
      },
      keyframes: {
        enter: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        enter: "enter 420ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
