/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        asphalt: {
          DEFAULT: "#0a0a0c",
          panel: "#111114",
          card: "#161619",
          border: "#262629",
          borderLight: "#33333a",
        },
        ember: {
          DEFAULT: "#ff5a1f",
          light: "#ff7a45",
        },
        checkpoint: "#3ddc97",
        danger: "#ff4d4d",
        ink: {
          DEFAULT: "#e8e6e1",
          muted: "#9b9ba0",
          faint: "#6b6b70",
          dim: "#5a5a60",
        },
      },
      fontFamily: {
        display: ["Oxanium", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["Rajdhani", "sans-serif"],
        blackletter: ["UnifrakturCook", "serif"],
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        "sweep-light": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(250%)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "sweep-light": "sweep-light 6s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};
