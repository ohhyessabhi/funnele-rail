/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0e27",
        paper: "#f5f3ff",
        surface: "#fff",
        line: "#e8e4f0",
        "line-soft": "#f3f0f8",
        muted: "#6b7280",
        "muted-2": "#9ca3af",
        calm: "#d1cfe3",
        accent: "#d946ef",
        "accent-light": "#f0d9ff",
        "accent-dark": "#c026d3",
        growth: "#f59e0b",
        success: "#10b981",
        alert: "#ef4444",
      },
      fontFamily: {
        sans: ["Sohne", "-apple-system", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
