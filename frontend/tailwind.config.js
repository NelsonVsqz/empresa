/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#2EC4B6",
          default: "#1CA3A3",
          dark: "#178B8B",
        },
        neutral: {
          50: "#F7F9FA",
          100: "#E5E7EB",
          300: "#D1D5DB",
          500: "#6B7280",
          800: "#2B2D42",
        },
        success: "#4CAF50",
        warning: "#F5C518",
        error: "#E53935",
        white: "#FFFFFF",
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "Poppins", "sans-serif"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
}