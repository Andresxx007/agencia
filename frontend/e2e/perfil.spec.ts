import { test, expect } from '@playwright/test';
import { login, goToTab } from './helpers';

test.describe('Perfil completo del jugador', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Cargar jugadores en la pestaña Jugadores para que el selector esté poblado
    await goToTab(page, 'Jugadores');
    await page.getByRole('button', { name: 'Cargar listado' }).click();
    await page.locator('.data-table tbody .btn-secondary', { hasText: 'Sel.' }).first()
      .waitFor({ state: 'visible', timeout: 8_000 });
    await page.locator('.data-table tbody .btn-secondary', { hasText: 'Sel.' }).first().click();
    await goToTab(page, 'Perfil');
  });

  test('muestra el encabezado y botones de descarga', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Perfil completo del jugador' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cargar perfil' })).toBeVisible();
  });

  test('carga el perfil y muestra datos del jugador', async ({ page }) => {
    await page.getByRole('button', { name: 'Cargar perfil' }).click();
    // Esperar a que desaparezca la barra de carga y aparezca el header del perfil
    await expect(page.locator('.profile-header')).toBeVisible({ timeout: 10_000 });
  });

  test('muestra botones de PDF tras cargar el perfil', async ({ page }) => {
    await page.getByRole('button', { name: 'Cargar perfil' }).click();
    await page.locator('.profile-header').waitFor({ state: 'visible', timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Currículum PDF' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Informe completo PDF' })).toBeVisible();
  });
});
