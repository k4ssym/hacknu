// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    svgr({
      // опции SVGR
      svgrOptions: {
        icon: true,
        exportType: "named",       // named exports
        namedExport: "ReactComponent",
      },
    }),
    react(),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
