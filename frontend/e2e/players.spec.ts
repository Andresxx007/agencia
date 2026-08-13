import { test, expect } from '@playwright/test';
import { login, goToTab } from './helpers';

test.describe('Gestión de jugadores', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToTab(page, 'Jugadores');
  });

  test('muestra el formulario de alta rápida', async ({ page }) => {
    await expect(page.getByPlaceholder('Nombre')).toBeVisible();
    await expect(page.getByPlaceholder('Apellido')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrar jugador' })).toBeVisible();
  });

  test('muestra filtros avanzados', async ({ page }) => {
    await expect(page.getByPlaceholder('Nombre / nac. / posición')).toBeVisible();
    await expect(page.getByPlaceholder('Posición (ej. Delantero)')).toBeVisible();
    await expect(page.getByPlaceholder('Pie (Derecha/Izquierda)')).toBeVisible();
    await expect(page.getByPlaceholder('Edad mín.')).toBeVisible();
    await expect(page.getByPlaceholder('Edad máx.')).toBeVisible();
  });

  test('carga el listado de jugadores y muestra la tabla', async ({ page }) => {
    await page.getByRole('button', { name: 'Cargar listado' }).click();
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 8_000 });
  });

  test('crea un jugador con alta rápida y aparece el toast de éxito', async ({ page }) => {
    const nombre = `Test${Date.now()}`;
    await page.getByPlaceholder('Nombre').fill(nombre);
    await page.getByPlaceholder('Apellido').fill('E2E');
    await page.getByRole('button', { name: 'Registrar jugador' }).click();
    await expect(page.locator('.toast-ok')).toBeVisible({ timeout: 8_000 });
  });

  test('aplica filtro por posición y recibe resultados', async ({ page }) => {
    await page.getByPlaceholder('Posición (ej. Delantero)').fill('Delantero');
    await page.getByRole('button', { name: 'Aplicar filtros' }).click();
    await expect(page.locator('.toast-ok')).toBeVisible({ timeout: 8_000 });
  });

  test('limpia los filtros sin errores', async ({ page }) => {
    await page.getByPlaceholder('Posición (ej. Delantero)').fill('Portero');
    await page.getByRole('button', { name: 'Limpiar' }).click();
    await expect(page.getByPlaceholder('Posición (ej. Delantero)')).toHaveValue('');
  });

  test('sección de importación masiva CSV está visible', async ({ page }) => {
    await expect(page.getByText('Importación masiva CSV')).toBeVisible();
    await expect(page.locator('input[type="file"][accept=".csv"]')).toBeVisible();
  });

  test('abre el formulario de edición al pulsar Editar', async ({ page }) => {
    await page.getByRole('button', { name: 'Cargar listado' }).click();
    const editBtn = page.locator('.data-table tbody .btn-secondary', { hasText: 'Editar' }).first();
    await editBtn.waitFor({ state: 'visible', timeout: 8_000 });
    await editBtn.click();
    await expect(page.locator('.edit-box')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeVisible();
  });
});
