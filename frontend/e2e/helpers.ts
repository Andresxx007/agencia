import type { Page } from '@playwright/test';

export const ADMIN_EMAIL = 'admin@fortis.local';
export const ADMIN_PASSWORD = 'Fortis123*';

/**
 * Inicia sesión en el portal y espera a que el menú de pestañas sea visible.
 */
export async function login(page: Page) {
  await page.goto('/');
  await page.getByPlaceholder('Correo electrónico').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('Contraseña').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForSelector('.tab-nav', { timeout: 10_000 });
}

/**
 * Navega a la pestaña indicada.
 */
export async function goToTab(page: Page, tab: string) {
  await page.locator('.tab-nav .tab-btn', { hasText: tab }).click();
}
