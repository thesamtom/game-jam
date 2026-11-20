import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'checks',
  outputDir: '.qa/production-test-results',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4188', viewport: { width: 1280, height: 800 } },
  webServer: { command: 'npm run preview -- --port 4188 --strictPort', url: 'http://127.0.0.1:4188', reuseExistingServer: false }
});
