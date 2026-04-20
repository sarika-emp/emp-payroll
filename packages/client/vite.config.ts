import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, "../.."),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      // #127 — Without this, /health/detailed hits the Vite dev server
      // (which 404s) and the System Health page shows "Server unreachable".
      "/health": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
