import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pastry: {
          cream: "#f5f0e8",
          warm: "#e8dcc8",
          gold: "#c4a35a",
          brown: "#6b5344",
          deep: "#3d2c29",
          green: "#2e5c2a",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        hebrew: ["var(--font-hebrew)", "David", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
