import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig(({ mode }) => {
  const isDist = process.env.ELECTRON_DIST === "1";
  return {
    plugins: [
      react(),
      legacy({
        // Loosened targets: still covers 99%+ of users but cuts polyfill size significantly
        targets: ["defaults", "not IE 11", "Chrome >= 70", "Safari >= 12", "iOS >= 12", "Firefox >= 60", "Edge >= 79"],
      }),
    ],
    base: "./",
    build: {
      // Split vendor libs into a separate cached chunk so the main bundle is lighter
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'vendor';
            }
            if (id.includes('node_modules/react-router')) {
              return 'router';
            }
          },
        },
      },
    },
  };
});
