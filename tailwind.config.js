/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "rgb(var(--app-bg) / <alpha-value>)",
          card: "rgb(var(--app-card) / <alpha-value>)",
          accent: "rgb(var(--app-accent) / <alpha-value>)",
          accentSoft: "rgb(var(--app-accent-soft) / <alpha-value>)",
          border: "rgb(var(--app-border) / <alpha-value>)",
          text: "rgb(var(--app-text) / <alpha-value>)",
          muted: "rgb(var(--app-muted) / <alpha-value>)",
          panel: "rgb(var(--app-panel) / <alpha-value>)",
          dangerBg: "rgb(var(--app-danger-bg) / <alpha-value>)",
          dangerBgHover: "rgb(var(--app-danger-bg-hover) / <alpha-value>)",
          dangerBorder: "rgb(var(--app-danger-border) / <alpha-value>)",
          dangerText: "rgb(var(--app-danger-text) / <alpha-value>)",
          infoBg: "rgb(var(--app-info-bg) / <alpha-value>)",
          infoBorder: "rgb(var(--app-info-border) / <alpha-value>)",
          infoText: "rgb(var(--app-info-text) / <alpha-value>)",
          successBg: "rgb(var(--app-success-bg) / <alpha-value>)",
          successBorder: "rgb(var(--app-success-border) / <alpha-value>)",
          successText: "rgb(var(--app-success-text) / <alpha-value>)",
          warningBg: "rgb(var(--app-warning-bg) / <alpha-value>)",
          warningBorder: "rgb(var(--app-warning-border) / <alpha-value>)",
          warningText: "rgb(var(--app-warning-text) / <alpha-value>)",
          subtleBg: "rgb(var(--app-subtle-bg) / <alpha-value>)",
          subtleBorder: "rgb(var(--app-subtle-border) / <alpha-value>)"
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
