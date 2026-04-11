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
        background: "var(--background)",
        foreground: "var(--foreground)",
        amber: {
          50: "#FFF8E1",
          100: "#FFECB3",
          200: "#FFD54F",
          300: "#FFC107",
          400: "#FFB300",
          500: "#D4A020",
          600: "#B8860B",
          700: "#8B6914",
          800: "#5C4409",
          900: "#3D2E06",
        },
        charcoal: {
          50: "#2A2A2A",
          100: "#222222",
          200: "#1C1C1C",
          300: "#181818",
          400: "#141414",
          500: "#111111",
          600: "#0D0D0D",
          700: "#0A0A0A",
          800: "#070707",
          900: "#050505",
        },
      },
      fontFamily: {
        display: ["var(--font-geist-sans)", "Georgia", "serif"],
        body: ["var(--font-geist-sans)", "Arial", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(212, 160, 32, 0.1)" },
          "100%": { boxShadow: "0 0 40px rgba(212, 160, 32, 0.3)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
