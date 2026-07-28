import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite handles local development, React/TSX compilation, and production bundling.
export default defineConfig({
  // The React plugin provides JSX transformation and fast refresh while editing.
  base: "/Vigor-Momentum-2.0/",
  plugins: [react()],
  // Development server used by `npm run dev`.
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  // Local preview server used after a production build.
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
