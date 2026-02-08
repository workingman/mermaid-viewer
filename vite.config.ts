/// <reference types="vitest" />
import { defineConfig } from "vite";
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
      "@mermaid-parser": path.resolve(__dirname, "src/mermaid-parser"),
      "@layout-engine": path.resolve(__dirname, "src/layout-engine"),
      "@svg-compositor": path.resolve(__dirname, "src/svg-compositor"),
      "@sidecar": path.resolve(__dirname, "src/sidecar"),
      "@edit": path.resolve(__dirname, "src/edit"),
      "@viewport": path.resolve(__dirname, "src/viewport"),
      "@error": path.resolve(__dirname, "src/error"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
}));
