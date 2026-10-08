import { defineConfig } from '@playwright/test';
const deploymentURL = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: deploymentURL || 'http://127.0.0.1:5173',
    headless: true,
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined },
  },
  workers: 1,
  timeout: 60000,
  webServer: deploymentURL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: true,
        timeout: 120000,
      },
});
