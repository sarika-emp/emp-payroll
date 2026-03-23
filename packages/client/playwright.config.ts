import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  workers: 4,
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
    storageState: "./e2e/.auth/user.json",
  },
  projects: [
    {
      name: "auth",
      testMatch: "auth.spec.ts",
      use: { storageState: undefined },
    },
    {
      name: "chromium",
      testIgnore: "auth.spec.ts",
      use: { browserName: "chromium" },
    },
  ],
});
