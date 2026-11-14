import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.local' });

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl || !new URL(testDatabaseUrl).pathname.endsWith('_test')) {
  throw new Error('TEST_DATABASE_URL must point to a *_test database');
}

const port = 3100;
const baseURL = `http://localhost:${port}`;
// Use the locally installed Chrome by default; set PLAYWRIGHT_CHANNEL=chromium
// after `npx playwright install chromium` to use Playwright's bundled browser.
const channel = process.env.PLAYWRIGHT_CHANNEL || 'chrome';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  globalSetup: './tests/e2e/global-setup.ts',
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel },
    },
  ],
  webServer: {
    command: `npm run db:migrate:test && npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      TEST_DATABASE_URL: testDatabaseUrl,
      AI_MOCK: '1',
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-3.5-flash-lite',
      CLIENT_TOKEN_PEPPER: 'test-pepper-2026',
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'change-me',
      TAVILY_API_KEY: '',
    },
  },
});
