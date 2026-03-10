import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Manrope", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
        "fade-up-delay": "fadeUp 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both",
        "card": "slideInFromLeft 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
        "glow": "glow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: {
            opacity: "0",
            transform: "translateY(30px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        slideInFromLeft: {
          from: {
            opacity: "0",
            transform: "translateX(-20px)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        scaleIn: {
          from: {
            opacity: "0",
            transform: "scale(0.95)",
          },
          to: {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        glow: {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(56, 189, 248, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(56, 189, 248, 0.5)",
          },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
