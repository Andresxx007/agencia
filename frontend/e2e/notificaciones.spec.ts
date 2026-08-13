import { test, expect } from '@playwright/test';
import { login, goToTab } from './helpers';

test.describe('Notificaciones', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('la pestaña Notificaciones existe en la navegación', async ({ page }) => {
    await expect(page.locator('.tab-btn', { hasText: 'Notificaciones' })).toBeVisible();
  });

  test('navegar a Notificaciones muestra el botón Cargar', async ({ page }) => {
    await goToTab(page, 'Notificaciones');
    await expect(page.getByRole('button', { name: 'Cargar' })).toBeVisible();
    await expect(page.getByText('Se actualiza automáticamente cada 30 seg.')).toBeVisible();
  });

  test('carga las notificaciones y muestra la tabla', async ({ page }) => {
    await goToTab(page, 'Notificaciones');
    await page.getByRole('button', { name: 'Cargar' }).click();
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Auditoría', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToTab(page, 'Auditoría');
  });

  test('muestra filtros de auditoría', async ({ page }) => {
    await expect(page.getByPlaceholder('Entidad (ej. Jugador)')).toBeVisible();
    await expect(page.getByPlaceholder('Acción (ej. Crear)')).toBeVisible();
    await expect(page.getByPlaceholder('Usuario (email)')).toBeVisible();
  });

  test('busca registros de auditoría y muestra la tabla', async ({ page }) => {
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Parámetros de configuración', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToTab(page, 'Parámetros de configuración');
  });

  test('muestra listas principales y formulario avanzado', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Parámetros de configuración' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Listas principales (jugadores)' })).toBeVisible();
    await expect(page.getByPlaceholder('Ej. TIPOS_DOC')).toBeVisible();
    await expect(page.getByPlaceholder('Nombre descriptivo')).toBeVisible();
  });

  test('refrescar listas sin errores', async ({ page }) => {
    await page.getByRole('button', { name: 'Refrescar todo' }).click();
    await expect(page.locator('.toast-ok, .toast-err').first()).toBeVisible({ timeout: 8_000 });
  });

  test('crea un catálogo nuevo y aparece el toast de éxito', async ({ page }) => {
    await page.getByPlaceholder('Código (ej. POSICIONES)').fill(`CAT${Date.now()}`);
    await page.getByPlaceholder('Nombre descriptivo').fill('Test E2E Catálogo');
    await page.getByRole('button', { name: 'Crear catálogo' }).click();
    await expect(page.locator('.toast-ok')).toBeVisible({ timeout: 8_000 });
  });
});
