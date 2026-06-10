/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
    },
    extend: {
      colors: {
        forest: {
          50: "#F1F8F4",
          100: "#DDECE2",
          200: "#BBD9C6",
          300: "#8FC0A0",
          400: "#5FA178",
          500: "#3D835B",
          600: "#2D6A4F",
          700: "#245741",
          800: "#1E4635",
          900: "#193A2C",
        },
        sage: {
          50: "#F5F7F6",
          100: "#E6EDE9",
          200: "#CDDBD4",
          300: "#A8BFB4",
          400: "#7D9E8F",
          500: "#5B7F70",
          600: "#466557",
          700: "#3A5247",
          800: "#31433B",
          900: "#2A3932",
        },
        sky: {
          50: "#F0F9FC",
          100: "#DAF0F6",
          200: "#BAE1ED",
          300: "#89C2D9",
          400: "#529FBF",
          500: "#3580A1",
          600: "#2C6685",
          700: "#28546D",
          800: "#25475A",
          900: "#233C4D",
        },
        earth: {
          50: "#FAF7F2",
          100: "#F2EADD",
          200: "#E5D4BB",
          300: "#D5B88E",
          400: "#C39660",
          500: "#B27C45",
          600: "#956338",
          700: "#794E30",
          800: "#63412D",
          900: "#533728",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        "card": "0 4px 20px -8px rgba(45, 106, 79, 0.15)",
        "card-hover": "0 12px 32px -12px rgba(45, 106, 79, 0.25)",
        "soft": "0 2px 12px -4px rgba(0, 0, 0, 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      borderRadius: {
        "xl": "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
