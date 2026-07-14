import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep warm taupe/espresso - the more "structured" Work accent
        work: {
          DEFAULT: "#6E5C4B",
          soft: "#EFE7DA",
          dark: "#463A2F",
        },
        // Warm dusty terracotta - the softer Life accent
        life: {
          DEFAULT: "#C1815F",
          soft: "#F6E6DA",
          dark: "#93583B",
        },
        // Luxury paper-planner neutrals
        paper: {
          bg: "#F6F1E9",
          surface: "#FFFCF6",
          surface2: "#FBF5EA",
          border: "#E7DFCF",
          ink: "#2B2620",
          muted: "#948A79",
          faint: "#C9BEA9",
        },
      },
      borderRadius: {
        xl2: "1.5rem",
        xl3: "2rem",
      },
      boxShadow: {
        paper: "0 1px 2px rgba(43, 38, 32, 0.04), 0 8px 24px -12px rgba(43, 38, 32, 0.12)",
        "paper-lg": "0 2px 4px rgba(43, 38, 32, 0.05), 0 16px 40px -16px rgba(43, 38, 32, 0.16)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "Roboto",
          "sans-serif",
        ],
        serif: ["var(--font-editorial)", "Georgia", "serif"],
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "check-pulse": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.18s ease-out",
        "check-pulse": "check-pulse 0.28s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
