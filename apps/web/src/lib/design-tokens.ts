export const designTokens = {
  colors: [
    { name: "Black", variable: "kira.black", hex: "#060606", usage: "Primary UI text and actions" },
    { name: "Dark Gray", variable: "kira.darkgray", hex: "#4F4F50", usage: "Headers, icons, secondary emphasis" },
    { name: "Warm Gray", variable: "kira.warmgray", hex: "#C7B7B6", usage: "Secondary UI and interaction surfaces" },
    { name: "Mid Gray", variable: "kira.midgray", hex: "#7A7C88", usage: "Microcopy and muted labels" },
    { name: "Off-White", variable: "kira.offwhite", hex: "#FBFBFB", usage: "Background and cards" },
    { name: "Accent Brown", variable: "kira.brown", hex: "#90715B", usage: "Active states and highlights" },
  ],
  typography: {
    fontFamily: "Inter, Helvetica Neue, Helvetica, Arial, sans-serif",
    h1: "Bold, 36-48px",
    h2: "Semi-bold, 20-28px",
    body: "Regular, 14-16px",
    microcopy: "Light, 12px",
  },
  spacing: {
    baseGrid: "8px",
    scale: [8, 16, 24, 32],
  },
  breakpoints: {
    mobile: "<= 767px",
    tablet: "768px - 1023px",
    desktop: ">= 1024px",
  },
} as const;
