/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3c8f82",
        secondary: "#2e6b7a",
        accent: "#5aa89a",
        dark: {
          900: "#0a0a0a",
          800: "#141414",
          700: "#1b2a4a",
          600: "#2f4d73",
          500: "#2e6b7a",
        },
        surface: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          hover: "rgba(255, 255, 255, 0.1)",
          active: "rgba(255, 255, 255, 0.15)",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        beatminds: {
          primary: "#3c8f82",
          secondary: "#2e6b7a",
          accent: "#5aa89a",
          neutral: "#141414",
          "base-100": "#0a0a0a",
          info: "#2f4d73",
          success: "#3c8f82",
          warning: "#d4a843",
          error: "#c0392b",
        },
      },
    ],
  },
};
