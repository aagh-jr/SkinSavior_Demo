/** @type {import('tailwindcss').Config} */
// NativeWind uses Tailwind v3 (the web app is on Tailwind v4 with its own
// config — intentionally separate). These colors mirror @skinsavior/ui/tokens;
// the values are inlined here because a JS Tailwind config can't import the
// package's TypeScript source. App code (.tsx) should import from
// "@skinsavior/ui" instead of hardcoding hex.
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: "#f6f1e9",
        ink: "#1d1812",
        "warm-white": "#fdfbf6",
        "soft-tan": "#e6ddcf",
        clay: "#9a4a2f",
        primary: "#9a4a2f",
        secondary: "#fbf3ec",
        muted: "#6b5f4f",
        accent: "#caa37f",
        sage: "#4a6b3f",
        "sage-bg": "#eef3ea",
      },
      borderRadius: {
        DEFAULT: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};
