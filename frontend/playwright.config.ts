import { defineConfig } from '@playwright/test';

// Browser tests run against an already running app (npm run dev or npm start).
//   BASE_URL=http://localhost:3000 npx playwright test
export default defineConfig({
  testDir: './e2e',
  timeout: 240_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  outputDir: process.env.PW_OUTPUT_DIR || 'test-results',
});
