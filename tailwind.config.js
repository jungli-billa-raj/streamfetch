/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#F7F3EA",
          card: "#FFFFFF",
          accent: "#007AFF",
          accentSoft: "#5AC8FA",
          border: "#E5E7EB",
          text: "#111827",
          muted: "#6B7280",
          panel: "#F3F4F6"
        }
      },
      fontFamily: {
        display: ['"SF Pro Display"', '"SF Pro Text"', "SamsungOne", '"Segoe UI"', "system-ui", "sans-serif"],
        body: ['"SF Pro Text"', '"SF Pro Display"', "SamsungOne", '"Segoe UI"', "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(17, 24, 39, 0.04), 0 8px 24px rgba(17, 24, 39, 0.04)",
        cardHover: "0 2px 6px rgba(17, 24, 39, 0.06), 0 14px 28px rgba(17, 24, 39, 0.08)",
        button: "0 8px 20px rgba(0, 122, 255, 0.24)",
        buttonHover: "0 10px 24px rgba(0, 122, 255, 0.3)"
      }
    }
  },
  plugins: []
};
