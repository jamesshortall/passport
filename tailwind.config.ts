import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // The Travel Technician brand: deep navy + teal, with gold for Cardmaster.
        brand: {
          navy: "#0f2a43",
          navylight: "#1c3d5c",
          // `accent` now maps to the brand teal so existing utility classes
          // (brand-accent / brand-accentdark) pick up the on-logo colour.
          accent: "#1f8fa8",
          accentdark: "#17708a",
          teal: "#1f8fa8",
          tealdark: "#17708a",
          teallight: "#3bb0c9",
          gold: "#c8a24a",
          golddark: "#a9862f",
          paper: "#f7f5f0",
        },
        severity: {
          blocked: "#dc2626",
          unreliable: "#ea580c",
          caveats: "#ca8a04",
          fine: "#16a34a",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
