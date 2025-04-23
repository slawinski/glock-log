/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#0a0a0a",
          text: "#00ff00",
          border: "#00ff00",
          highlight: "#00ff00",
          dim: "#003300",
          error: "#ff0000",
          success: "#00ff00",
          warning: "#ffff00",
        },
      },
      fontFamily: {
        terminal: ["Courier New", "monospace"],
      },
      boxShadow: {
        terminal: "0 0 10px rgba(0, 255, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
