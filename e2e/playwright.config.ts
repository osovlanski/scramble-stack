import { defineConfig, devices } from '@playwright/test';

const CANVAS_URL = process.env.CANVAS_URL ?? 'http://localhost:5173';
const NEWS_FEED_URL = process.env.NEWS_FEED_URL ?? 'http://localhost:5174';
const QA_URL = process.env.QA_URL ?? 'http://localhost:5175';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['json', { outputFile: 'reports/results.json' }],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
  ],
  outputDir: 'reports/artifacts',
  use: {
    baseURL: CANVAS_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  metadata: {
    CANVAS_URL,
    NEWS_FEED_URL,
    QA_URL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

export { CANVAS_URL, NEWS_FEED_URL, QA_URL };
