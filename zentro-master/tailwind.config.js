const defaultTheme = require("tailwindcss/defaultTheme");
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    fontFamily: {
      outfit: ["Mark for MC", "Helvetica", "Arial", "sans-serif"],
    },
    screens: {
      "2xsm": "375px",
      xsm: "425px",
      "3xl": "2000px",
      ...defaultTheme.screens,
    },
    extend: {
      fontSize: {
        "title-2xl": ["72px", "90px"],
        "title-xl": ["60px", "72px"],
        "title-lg": ["48px", "60px"],
        "title-md": ["36px", "44px"],
        "title-sm": ["30px", "38px"],
        "theme-xl": ["20px", "30px"],
        "theme-sm": ["14px", "20px"],
        "theme-xs": ["12px", "18px"],
      },
      colors: {
        current: "currentColor",
        transparent: "transparent",
        white: "#FFFFFF",
        black: "#141413", // Mastercard's dark gray as black
        // Primary colors updated to Mastercard palette
        primary: {
          green: "#8db92e",   // Mastercard green
          orange: "#ff671b",  // Mastercard primary orange
          gray: "#74726e",    // Mastercard medium gray
          lightgray: "#e3dfd7" // Mastercard light gray
        },
        // Secondary colors updated
        secondary: {
          green: {
            800: "#629731",   // Darker green
            700: "#8db92e",   // Mastercard green
            500: "#a5c85a",   // Lighter green
            300: "#c1d98a"    // Lightest green
          },
          orange: {
            800: "#d24912",   // Dark orange
            700: "#ff671b",   // Mastercard orange
            500: "#ff8c4d",   // Medium orange
            300: "#ffb180"    // Light orange
          },
          gray: {
            900: "#141413",   // Mastercard dark gray
            700: "#74726e",   // Mastercard medium gray
            500: "#e3dfd7"   // Mastercard light gray
          }
        },
        // Brand colors updated to Mastercard palette
        brand: {
          500: "#ff671b",     // Mastercard primary orange
          600: "#d24912",     // Darker orange
          700: "#a02517",     // Darkest orange
          25: "#FFF5F0",
          50: "#FFECE0",
          100: "#FFD9C2",
          200: "#FFB180",
          300: "#FF8C4D",
          400: "#FF671B",
          800: "#a02517",
          900: "#7A271A",
          950: "#55160C",
        },
        // Functional colors adjusted to Mastercard palette
        success: {
          25: "#F6FEF9",
          50: "#ECFDF3",
          100: "#D1FADF",
          200: "#A6F4C5",
          300: "#6CE9A6",
          400: "#32D583",
          500: "#8db92e", // Mastercard green
          600: "#629731",
          700: "#1f612c",
          800: "#05603A",
          900: "#054F31",
          950: "#053321",
        },
        error: {
          25: "#FFFBFA",
          50: "#FEF3F2",
          100: "#FEE4E2",
          200: "#FECDCA",
          300: "#FDA29B",
          400: "#F97066",
          500: "#F04438",
          600: "#D92D20",
          700: "#B42318",
          800: "#912018",
          900: "#7A271A",
          950: "#55160C",
        },
        warning: {
          25: "#FFFCF5",
          50: "#FFFAEB",
          100: "#FEF0C7",
          200: "#FEDF89",
          300: "#f38b00", // Mastercard gold
          400: "#FDB022",
          500: "#f38b00", // Mastercard gold
          600: "#DC6803",
          700: "#B54708",
          800: "#93370D",
          900: "#7A2E0E",
          950: "#4E1D09",
        },
        // Gray scale updated to Mastercard palette
        gray: {
          dark: "#141413", // Mastercard dark gray
          25: "#FCFCFD",
          50: "#F9FAFB",
          100: "#F2F4F7",
          200: "#E4E7EC",
          300: "#D0D5DD",
          400: "#98A2B3",
          500: "#74726e", // Mastercard medium gray
          600: "#475467",
          700: "#344054",
          800: "#1D2939",
          900: "#141413", // Mastercard dark gray
          950: "#0C111D",
        },
        "theme-pink": {
          500: "#EE46BC",
        },
        "theme-purple": {
          500: "#7A5AF8",
        },
      },
      boxShadow: {
        "theme-md":
          "0px 4px 8px -2px rgba(20, 20, 19, 0.10), 0px 2px 4px -2px rgba(20, 20, 19, 0.06)",
        "theme-lg":
          "0px 12px 16px -4px rgba(20, 20, 19, 0.08), 0px 4px 6px -2px rgba(20, 20, 19, 0.03)",
        "theme-sm":
          "0px 1px 3px 0px rgba(20, 20, 19, 0.10), 0px 1px 2px 0px rgba(20, 20, 19, 0.06)",
        "theme-xs": "0px 1px 2px 0px rgba(20, 20, 19, 0.05)",
        "theme-xl":
          "0px 20px 24px -4px rgba(20, 20, 19, 0.08), 0px 8px 8px -4px rgba(20, 20, 19, 0.03)",
        datepicker: "-5px 0 0 #262d3c, 5px 0 0 #262d3c",
        "focus-ring": "0px 0px 0px 4px rgba(255, 103, 27, 0.12)", // Mastercard orange
        "slider-navigation":
          "0px 1px 2px 0px rgba(20, 20, 19, 0.10), 0px 1px 3px 0px rgba(20, 20, 19, 0.10)",
        tooltip:
          "0px 4px 6px -2px rgba(20, 20, 19, 0.05), -8px 0px 20px 8px rgba(20, 20, 19, 0.05)",
      },
      dropShadow: {
        "4xl": [
          "0 35px 35px rgba(0, 0, 0, 0.25)",
          "0 45px 65px rgba(0, 0, 0, 0.15)",
        ],
      },
      zIndex: {
        999999: "999999",
        99999: "99999",
        9999: "9999",
        999: "999",
        99: "99",
        9: "9",
        1: "1",
      },
      spacing: {
        4.5: "1.125rem",
        5.5: "1.375rem",
        6.5: "1.625rem",
        7.5: "1.875rem",
        8.5: "2.125rem",
        9.5: "2.375rem",
        10.5: "2.625rem",
        11.5: "2.875rem",
        12.5: "3.125rem",
        13: "3.25rem",
        13.5: "3.375rem",
        14.5: "3.625rem",
        15: "3.75rem",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("autoprefixer")],
};