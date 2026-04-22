import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Organic Precision — base slate-azulada (sem bordas; hierarquia por tom)
        canvas: {
          DEFAULT: "#0f172a",      // fundo raiz
          raised: "#111c33",       // cards
          sunken: "#0b1222",       // áreas rebaixadas
        },
        surface: {
          1: "#18253f",            // tier 1 (card padrão)
          2: "#1f2d4a",            // tier 2 (hover / seção)
          3: "#263655",            // tier 3 (elemento destacado)
          4: "#2f4162",            // tier 4 (input/pill)
        },
        ink: {
          DEFAULT: "#eef2f8",      // texto padrão
          muted: "#9aa7bf",        // texto secundário
          dim: "#66738c",          // texto desativado
          inverse: "#0f172a",
        },
        slateaz: {
          50: "#f3f5f9",
          100: "#e3e8f1",
          200: "#c4cde0",
          300: "#9aa7bf",
          400: "#6f7fa0",
          500: "#50638a",          // tom base da marca
          600: "#3f4f71",
          700: "#344059",
          800: "#2a3348",
          900: "#1c2236",
        },
        primary: {
          50: "#fff3eb",
          100: "#ffddc2",
          200: "#ffbe8a",
          300: "#ff9d52",
          400: "#fb8124",
          500: "#f97316",          // acento principal
          600: "#dd5b07",
          700: "#b04606",
          800: "#823305",
          900: "#5a2304",
        },
        secondary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",          // verde (pago/positivo)
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        tertiary: {
          400: "#a3e635",
          500: "#84cc16",          // lime (acento)
          600: "#65a30d",
        },
        danger: {
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
        },
        warning: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      borderRadius: {
        xs: "6px",
        sm: "10px",
        md: "14px",
        lg: "20px",
        xl: "28px",
        "2xl": "36px",
      },
      boxShadow: {
        // sem bordas — use elevação tonal
        tier1: "0 1px 0 0 rgba(255,255,255,0.02) inset",
        tier2: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.4)",
        glow: "0 0 0 6px rgba(249,115,22,0.12)",
        popover: "0 20px 40px -12px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #fb8124 0%, #f97316 50%, #dd5b07 100%)",
        "gradient-secondary": "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
        "gradient-surface": "linear-gradient(180deg, #18253f 0%, #141f36 100%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        fadeUp: "fadeUp 240ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
