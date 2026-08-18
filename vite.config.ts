import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "/assets/home/dist/",
  build: {
    outDir: resolve(__dirname, "assets/home/dist"),
    emptyOutDir: true,
    sourcemap: false,
    target: "es2020",
    cssCodeSplit: false,
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      input: resolve(__dirname, "assets/home/src/main.ts"),
      output: {
        entryFileNames: "home.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css") ? "home.css" : "assets/[name]-[hash][extname]"
      }
    }
  }
});
