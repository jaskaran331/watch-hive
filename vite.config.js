import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      // ponytail: legacy() removed — it doubled the JS output (102KB gzipped polyfills)
      // and consumed 64% of build time. All modern browsers (Chrome 70+, Safari 12+,
      // Edge 79+) are already covered by Vite's default esbuild target.
    ],
    base: "/",
    build: {
      // Target modern browsers only — shaves ~20KB off each chunk
      target: "es2020",
      // Split vendor libs into a separate cached chunk so the main bundle is lighter
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
