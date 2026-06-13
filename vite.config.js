import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/worldcup-2026-predictor/",
  plugins: [react()],
  server: {
    port: 5173
  }
});
