/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#313fb2",
        secondary: "#4361ee",
        accent: "#10b981",
        background: "#ebeef1",
      },
      fontFamily: {
        title: ["Inter", "sans-serif"],
        body: ["Poppins", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(#1e40af, #3b82f6)",
      },
    },
  },
  plugins: [],
};
