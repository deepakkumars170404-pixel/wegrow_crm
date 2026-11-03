import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wegrow: {
          navy: "#142B52",
          "navy-dark": "#0D1D36",
          "navy-light": "#1E3B6E",
          blue: "#244B7A",
          "blue-light": "#3667A5",
          gold: "#D5A52B",
          "gold-light": "#FDF8ED",
          "gold-subtle": "#FEF3C7",
          "gold-dark": "#B88A1B",
          "gold-hover": "#C59623",
          bg: "#F5F7FA",
          card: "#FFFFFF",
          text: "#1E293B",
          muted: "#64748B",
          border: "#E2E8F0",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Plus Jakarta Sans",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(20, 43, 82, 0.05)",
        card: "0 4px 20px -2px rgba(20, 43, 82, 0.07)",
        dropdown: "0 10px 30px rgba(20, 43, 82, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;

