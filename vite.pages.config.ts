import { defineConfig } from "vite";

export default defineConfig({
  root: "github-pages",
  base: "/zen-radio-player/",
  publicDir: "../public",
  build: {
    outDir: "../dist-pages",
    emptyOutDir: true,
    modulePreload: false,
  },
});
