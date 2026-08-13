import { test, expect } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, login } from './helpers';

test.describe('Autenticación', () => {
  test('muestra el formulario de login al entrar sin sesión', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
    await expect(page.getByPlaceholder('Correo electrónico')).toBeVisible();
    await expect(page.getByPlaceholder('Contraseña')).toBeVisible();
  });

  test('falla con credenciales incorrectas y muestra toast de error', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Correo electrónico').fill('incorrecto@test.com');
    await page.getByPlaceholder('Contraseña').fill('clave_mala');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.locator('.toast-err')).toBeVisible({ timeout: 8_000 });
  });

  test('inicia sesión correctamente y muestra la navegación por pestañas', async ({ page }) => {
    await login(page);
    await expect(page.locator('.tab-nav')).toBeVisible();
    await expect(page.locator('.tab-btn', { hasText: 'Jugadores' })).toBeVisible();
    await expect(page.locator('.tab-btn', { hasText: 'Reportes' })).toBeVisible();
  });

  test('cierra sesión y vuelve al formulario de login', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });

  test('credenciales se almacenan en campos del formulario', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder('Correo electrónico')).toHaveValue(ADMIN_EMAIL);
    await expect(page.getByPlaceholder('Contraseña')).toHaveValue(ADMIN_PASSWORD);
  });
});
