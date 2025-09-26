/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Standard Tailwind-compatible colors
        border: "rgb(229 231 235)", // gray-200
        input: "rgb(229 231 235)", // gray-200
        ring: "rgb(59 130 246)", // blue-500
        background: "rgb(255 255 255)", // white
        foreground: "rgb(17 24 39)", // gray-900

        primary: {
          DEFAULT: "rgb(59 130 246)", // blue-500
          foreground: "rgb(255 255 255)", // white
        },
        secondary: {
          DEFAULT: "rgb(156 163 175)", // gray-400
          foreground: "rgb(17 24 39)", // gray-900
        },
        destructive: {
          DEFAULT: "rgb(239 68 68)", // red-500
          foreground: "rgb(255 255 255)", // white
        },
        muted: {
          DEFAULT: "rgb(249 250 251)", // gray-50
          foreground: "rgb(107 114 128)", // gray-500
        },
        accent: {
          DEFAULT: "rgb(249 250 251)", // gray-50
          foreground: "rgb(17 24 39)", // gray-900
        },
        popover: {
          DEFAULT: "rgb(255 255 255)", // white
          foreground: "rgb(17 24 39)", // gray-900
        },
        card: {
          DEFAULT: "rgb(255 255 255)", // white
          foreground: "rgb(17 24 39)", // gray-900
        },
      },
      borderRadius: {
        lg: "0.5rem", // 8px
        md: "0.375rem", // 6px
        sm: "0.25rem", // 4px
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};