/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        detective: {
          bg: "#0B0F19",          // Deep dark navy / charcoal background
          surface: "#111827",     // Dark navy surface
          panel: "#161F33",       // Subtle navy/slate panel
          card: "#1E293B",        // Glass/charcoal card surface
          border: "#26334D",      // Clean borders
          borderSubtle: "#1B2436",
          muted: "#94A3B8",       // Slate muted text
          text: "#F8FAFC",        // Bright crisp text
          accent: "#8B5CF6",      // Primary violet accent
          accentHover: "#7C3AED", // Deeper violet hover
          accentLight: "#A78BFA", // Soft lavender
          accentGlow: "#C084FC",  // Neon purple glow
          alert: "#F43F5E",       // Rose/crimson
          success: "#10B981",     // Emerald
          warning: "#F59E0B",     // Amber
        },
      },
      fontFamily: {
        sans: ["Roboto", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["Roboto Mono", "monospace"],
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "purple-glow": "0 0 25px -5px rgba(139, 92, 246, 0.3)",
        "purple-glow-lg": "0 0 40px -5px rgba(139, 92, 246, 0.45)",
      },
    },
  },
  plugins: [],
};

