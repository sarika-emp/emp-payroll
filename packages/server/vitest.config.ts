import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@emp-payroll/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
});
