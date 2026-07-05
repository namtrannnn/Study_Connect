/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      colors: {
        "bg-header-d": "#1e1e1e",
        "bg-light": "#f0f2f5",
        "bg-sky": "#228ee5",
        "bg-search": "#616161",
        "bg-body": "#201c1c",

        orange: "#f89b28",

        // Primary mới: xanh chủ đạo StudyConnect
        primary: "#2563eb",

        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },

        accent: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },

        surface: {
          light: "#ffffff",
          soft: "#f4f6fb",
          dark: "#17191f",
          darker: "#0f1117",
          cardDark: "#20232b",
        },
      },

      backgroundImage: {
        "orange-button":
          "linear-gradient(114.88deg, #fe592a 0%, #e93013 97.15%)",

        // Gradient xanh đẹp giống Modal
        "brand-gradient": "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",

        "brand-gradient-soft":
          "linear-gradient(135deg, #eff6ff 0%, #ffffff 45%, #ecfeff 100%)",

        "brand-gradient-dark":
          "linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(6,182,212,0.15) 100%)",

        "brand-line":
          "linear-gradient(90deg, #2563eb 0%, #22d3ee 50%, #8b5cf6 100%)",
      },

      boxShadow: {
        brand: "0 12px 30px rgba(37, 99, 235, 0.22)",
        "brand-soft": "0 10px 25px rgba(37, 99, 235, 0.12)",
      },

      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
