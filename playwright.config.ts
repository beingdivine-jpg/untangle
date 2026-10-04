import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } }, { name: 'firefox', testMatch: ['**/audit-journey.spec.ts', '**/visual-identity.spec.ts', '**/judge-walkthrough.spec.ts'], use: { ...devices['Desktop Firefox'] } }, { name: 'webkit', testMatch: ['**/audit-journey.spec.ts', '**/visual-identity.spec.ts', '**/judge-walkthrough.spec.ts'], use: { ...devices['Desktop Safari'] } }],
  // Exercise the deployed CSS/chunk order, independently of an open Vite dev server.
  webServer: { command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
})
