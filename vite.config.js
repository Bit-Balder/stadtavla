import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    target: "safari12",
    cssTarget: "safari12",
    rolldownOptions: {
      // Firebase is lazy-loaded only after Bootstrap checks for native BigInt.
      onwarn(warning, warn) {
        if (
          warning.code === "TOLERATED_TRANSFORM" &&
          warning.message.includes("Big integer literals")
        )
          return;
        warn(warning);
      },
    },
  },
});
