import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({}) => {
  return {
    plugins: [react()],
    test: {
      environment: "node",
      include: ["tests/**/*.test.ts"],
    },
    // base: command === "build" ? "/WordJump/" : undefined,
  };
});
