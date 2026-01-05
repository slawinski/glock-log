/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#0a0a0a",
          green: "#00ff00",
          border: "#00ff00",
          highlight: "#00ff00",
          dim: "#003300",
          error: "#ff0000",
          success: "#00ff00",
          warning: "#ffff00",
          muted: "#666666",
        },
      },
      fontSize: {
        xs: "14px",
        sm: "16px",
        base: "18px",
        lg: "20px",
        xl: "24px",
        "2xl": "30px",
        "3xl": "36px",
        "4xl": "42px",
      },
      fontFamily: {
        terminal: ["VT323_400Regular", "monospace"],
      },
      boxShadow: {
        terminal: "0 0 10px rgba(0, 255, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
