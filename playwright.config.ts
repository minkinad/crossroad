import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./apps/web/e2e",
  use: { baseURL: "http://127.0.0.1:4173", browserName: "chromium" },
  webServer: {
    command:
      "pnpm --filter @crossroad/web preview --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  reporter: "list",
});
