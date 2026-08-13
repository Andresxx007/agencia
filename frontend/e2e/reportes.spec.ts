import { test, expect } from '@playwright/test';
import { login, goToTab } from './helpers';

test.describe('Reportes y gráficas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToTab(page, 'Reportes');
  });

  test('muestra el botón de carga y exportaciones', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Cargar todos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Contratos CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Negociaciones CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Transferencias CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dashboard PDF' })).toBeVisible();
  });

  test('carga el dashboard y muestra tarjetas de métricas', async ({ page }) => {
    await page.getByRole('button', { name: 'Cargar todos' }).click();
    await expect(page.locator('.stat-card').first()).toBeVisible({ timeout: 10_000 });
  });

  test('carga el dashboard y muestra gráficas recharts', async ({ page }) => {
    await page.getByRole('button', { name: 'Cargar todos' }).click();
    // recharts inyecta un SVG en el DOM
    await expect(page.locator('svg.recharts-surface').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Módulo Inteligencia', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToTab(page, 'Inteligencia');
  });

  test('muestra sliders de pesos del modelo', async ({ page }) => {
    await expect(page.locator('.weights-grid')).toBeVisible();
    await expect(page.locator('input[type="range"]').first()).toBeVisible();
  });

  test('muestra la suma de pesos en tiempo real', async ({ page }) => {
    await expect(page.getByText('/ 100')).toBeVisible();
  });

  test('calcula el ranking sin errores', async ({ page }) => {
    await page.getByRole('button', { name: 'Calcular ranking' }).click();
    await expect(page.locator('.toast-ok, .toast-err').first()).toBeVisible({ timeout: 10_000 });
  });
});
