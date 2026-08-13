import { test, expect } from '@playwright/test';
import { login, goToTab } from './helpers';

/**
 * Selecciona el primer jugador disponible en el dropdown activo y
 * navega a la pestaña indicada.
 */
async function selectFirstPlayerAndGo(page: import('@playwright/test').Page, tab: string) {
  await goToTab(page, 'Jugadores');
  await page.getByRole('button', { name: 'Cargar listado' }).click();
  const selBtn = page.locator('.data-table tbody .btn-secondary', { hasText: 'Sel.' }).first();
  await selBtn.waitFor({ state: 'visible', timeout: 8_000 });
  await selBtn.click();
  await goToTab(page, tab);
}

test.describe('Contratos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('muestra el selector de jugador y el campo de duración', async ({ page }) => {
    await goToTab(page, 'Contratos');
    await expect(page.locator('select', { hasText: '-- Jugador activo --' })).toBeVisible();
    await expect(page.getByText('Duración (años)')).toBeVisible();
  });

  test('genera contrato con jugador seleccionado', async ({ page }) => {
    await selectFirstPlayerAndGo(page, 'Contratos');
    await page.getByRole('button', { name: 'Generar y descargar PDF' }).click();
    await expect(page.locator('.toast-ok, .toast-err').first()).toBeVisible({ timeout: 10_000 });
  });

  test('carga la lista de contratos', async ({ page }) => {
    await selectFirstPlayerAndGo(page, 'Contratos');
    await page.getByRole('button', { name: 'Cargar contratos' }).click();
    await expect(page.locator('.toast-ok, .toast-err').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('.data-table')).toBeVisible();
  });
});

test.describe('Documentos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('muestra formulario de carga de documentos', async ({ page }) => {
    await goToTab(page, 'Documentos');
    await expect(page.getByPlaceholder('Tipo (Pasaporte...)')).toBeVisible();
    await expect(page.getByPlaceholder('Descripción')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('carga la lista de documentos con jugador activo', async ({ page }) => {
    await selectFirstPlayerAndGo(page, 'Documentos');
    await page.getByRole('button', { name: 'Cargar lista' }).click();
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Negociaciones', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToTab(page, 'Negociaciones');
  });

  test('muestra el formulario de alta', async ({ page }) => {
    await expect(page.getByPlaceholder('Club ofertante')).toBeVisible();
    await expect(page.getByPlaceholder('Monto (USD)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear negociación' })).toBeVisible();
  });

  test('carga el listado de negociaciones', async ({ page }) => {
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Transferencias', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToTab(page, 'Transferencias');
  });

  test('muestra el formulario de alta', async ({ page }) => {
    await expect(page.getByPlaceholder('Ej. San Felipe')).toBeVisible();
    await expect(page.getByPlaceholder('Ej. Oriente')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrar transferencia' })).toBeVisible();
  });

  test('carga el listado de transferencias', async ({ page }) => {
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 8_000 });
  });
});
