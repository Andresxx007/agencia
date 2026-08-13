import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright E2E para el portal FORTIS GLESNOR GROUP.
 *
 * Para correr los tests localmente:
 *   npx playwright test
 *
 * Para ver el reporte HTML:
 *   npx playwright show-report
 *
 * Requiere que el backend y el frontend estén corriendo:
 *   Backend:  http://localhost:5100
 *   Frontend: http://localhost:5173  (npm run dev)
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
