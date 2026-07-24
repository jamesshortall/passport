import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // The Travel Technician brand: deep navy + warm accent.
        brand: {
          navy: "#0f2a43",
          navylight: "#1c3d5c",
          accent: "#f4a259",
          accentdark: "#e08b3c",
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
