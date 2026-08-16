import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "dist-pages/assets",
    emptyOutDir: false,
    minify: "esbuild",
    lib: {
      entry: "embed/main.tsx",
      formats: ["es"],
      fileName: () => "zen-radio-player.js",
    },
  },
});
