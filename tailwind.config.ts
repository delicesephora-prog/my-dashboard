import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Rich burgundy-plum - the one signature accent shared by Work and
        // Life, used boldly for headers, active states, and progress
        // indicators.
        work: {
          DEFAULT: "#5B2333",
          light: "#7A3B4D",
          soft: "#EEE0E3",
          dark: "#3D1622",
        },
        life: {
          DEFAULT: "#5B2333",
          light: "#7A3B4D",
          soft: "#EEE0E3",
          dark: "#3D1622",
        },
        // Warm gold, reserved for small-caps labels and celebratory
        // accents rather than large surfaces.
        gold: {
          DEFAULT: "#B08B4F",
          soft: "#E4D3B4",
        },
        // Glow Up's own accent - kept distinct so that whole tab still
        // reads as its own place, but pulled from the same plum/gold
        // family instead of a separate hue.
        glow: {
          DEFAULT: "#5B2333",
          soft: "#EEE0E3",
          dark: "#3D1622",
        },
        // Sage green, reserved for completed/done states.
        sage: {
          DEFAULT: "#8A9B7C",
          soft: "#E7EBE2",
        },
        // Luxury paper-planner neutrals. `bg` is the one token that shifts
        // for Evening Luxe (see globals.css) - it's the page backdrop
        // behind the cards, never a card or text color itself, so letting
        // it move doesn't touch contrast anywhere else in the app.
        paper: {
          bg: "var(--paper-bg)",
          surface: "#FFFDF8",
          surface2: "#F2EBDD",
          border: "#E8DFD0",
          ink: "#2B1B22",
          muted: "#9C8F94",
          faint: "#C7B9BC",
        },
        // Text that sits directly on the page backdrop rather than inside
        // a card (Greeting, world nav, Front Page's un-carded ring
        // stats) - these are the only text colors that need to react to
        // Evening Luxe, since every card keeps its normal light surface
        // and paper-ink/muted/faint text in both themes.
        backdrop: {
          ink: "var(--backdrop-ink)",
          muted: "var(--backdrop-muted)",
          faint: "var(--backdrop-faint)",
        },
        // The name in Greeting - deep plum on cream by day, glowing warm
        // gold on the dark Evening Luxe backdrop.
        signature: "var(--signature-color)",
      },
      borderRadius: {
        xl2: "1rem",
        xl3: "1.5rem",
      },
      boxShadow: {
        paper: "0 1px 2px rgba(43, 27, 34, 0.03), 0 6px 16px -10px rgba(43, 27, 34, 0.08)",
        "paper-lg": "0 2px 4px rgba(43, 27, 34, 0.04), 0 14px 32px -14px rgba(43, 27, 34, 0.14)",
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
        serif: ["Georgia", "Lora", "Times New Roman", "serif"],
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
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.18s ease-out",
        "check-pulse": "check-pulse 0.28s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        shimmer: "shimmer 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
