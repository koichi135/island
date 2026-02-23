import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        inferno: {
          50: "#fff1ee",
          100: "#ffe0d5",
          200: "#ffb8a0",
          300: "#ff8060",
          400: "#ff5530",
          500: "#ff3300",
          600: "#cc2000",
          700: "#991800",
          800: "#661000",
          900: "#330800",
          950: "#1a0400",
        },
        paradise: {
          50: "#e0f7ff",
          100: "#b8edff",
          200: "#7adbff",
          300: "#33c5f5",
          400: "#00aae0",
          500: "#0088bb",
          600: "#006896",
          700: "#004f70",
          800: "#00364b",
          900: "#001d26",
          950: "#000f14",
        },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-in",
        "slide-up": "slideUp 0.4s ease-out",
        typewriter: "typing 0.05s steps(1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
