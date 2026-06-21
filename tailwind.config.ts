import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f7f2",
        ink: "#1d2425",
        muted: "#5e6869",
        line: "#d7ddd2",
        steel: "#2f5963",
        moss: "#60764e",
        amber: "#a56b1f",
        brick: "#9b4439"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(27, 38, 39, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

