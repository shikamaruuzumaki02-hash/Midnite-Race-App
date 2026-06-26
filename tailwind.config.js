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
    },
  },
  plugins: [],
};
