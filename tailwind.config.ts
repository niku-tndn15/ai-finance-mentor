import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        "bg-base": "var(--bg-base)",
        "surface-card": "var(--surface-card)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        "zone-green": "var(--zone-green)",
        "zone-green-bg": "var(--zone-green-bg)",
        "zone-yellow": "var(--zone-yellow)",
        "zone-yellow-bg": "var(--zone-yellow-bg)",
        "zone-red": "var(--zone-red)",
        "zone-red-bg": "var(--zone-red-bg)",
        "zone-locked": "var(--zone-locked)",
        "zone-locked-bg": "var(--zone-locked-bg)",
        "mentor-blue": "var(--mentor-blue)",
        "mentor-blue-bg": "var(--mentor-blue-bg)",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
