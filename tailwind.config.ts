import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        work: {
          DEFAULT: "#5B7FFF",
          soft: "#E8ECFF",
          dark: "#3A54C4",
        },
        life: {
          DEFAULT: "#FF8A5B",
          soft: "#FFECE3",
          dark: "#D9633A",
        },
        base: {
          bg: "#FAFAF9",
          surface: "#FFFFFF",
          ink: "#1C1C1E",
          muted: "#8A8A8E",
          border: "#ECECEA",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
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
