/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          deep:    "#0e0205",
          dark:    "#160509",
          card:    "#1e0810",
          cardHov: "#270c15",
          border:  "#3d1020",
        },
        saffron: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        gold: {
          300: "#fcd34d",
          400: "#e5c158",
          500: "#d4a72c",
          600: "#b8962a",
        },
        maroon: {
          50:  "#fbeeee",
          100: "#f5d5d5",
          200: "#e8bcbc",
          300: "#d99a9a",
          400: "#c37676",
          500: "#a94040",
          600: "#9a2d2d",
          700: "#7c1f1f",
          800: "#5c1616",
          900: "#400f0f",
          950: "#220505",
        },
        cream: {
          50:  "#fffdf7",
          100: "#fdf6e8",
          200: "#faecd0",
        },
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
        body:    ["Inter",   "system-ui", "sans-serif"],
      },
      boxShadow: {
        card:    "0 2px 16px 0 rgba(0,0,0,0.4)",
        cardHov: "0 4px 28px 0 rgba(0,0,0,0.55)",
        glow:    "0 0 24px 0 rgba(212,167,44,0.18)",
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(14px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        shimmer: { "0%,100%": { opacity: 0.55 }, "50%": { opacity: 1 } },
      },
      animation: {
        fadeIn:  "fadeIn 0.45s ease-out both",
        slideUp: "slideUp 0.45s ease-out both",
        shimmer: "shimmer 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
