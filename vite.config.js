import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig(({ mode }) => {
  const isDist = process.env.ELECTRON_DIST === "1";
  return {
    plugins: [
      react(),
      legacy({
        targets: ["defaults", "not IE 11", "Chrome >= 49", "Safari >= 10", "iOS >= 10", "Firefox >= 50", "Edge >= 14"],
      }),
    ],
    base: "./",
  };
});
