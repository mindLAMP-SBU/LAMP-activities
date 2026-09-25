import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile()
  ],
  server: {
    port: 3000,
  },
  build: {
    assetsInlineLimit: 100000000, // force inline everything
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    },
    outDir: 'build', 
    emptyOutDir: true, 
  }
});