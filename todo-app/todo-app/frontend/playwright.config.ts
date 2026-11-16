import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests drive the real UI against a real running stack
 * (browser -> frontend -> Laravel API -> MySQL).
 *
 *   E2E_BASE_URL   where the SPA is served (default: the docker-compose frontend)
 *   E2E_CHANNEL    optional: use an installed browser, e.g. "chrome", instead of
 *                  Playwright's bundled Chromium
 */
export default defineConfig({
  testDir: './e2e',
  // Tests share one database, so they run one at a time and each one resets it.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env.E2E_CHANNEL || undefined },
    },
  ],
})
