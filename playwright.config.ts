import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration.
 *
 * API calls are intercepted via page.route() in e2e/fixtures/api-mock.ts,
 * so no real network traffic is needed. The dev server is auto-started
 * via webServer (reuses an existing server in local dev, always starts fresh in CI).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    // In CI: serve the pre-built dist/ via vite preview (faster, no HMR overhead).
    // Locally: reuse an already-running dev server if present.
    command: process.env.CI
      ? 'npx vite preview --port 3000 --strictPort'
      : 'npm run dev -- --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
