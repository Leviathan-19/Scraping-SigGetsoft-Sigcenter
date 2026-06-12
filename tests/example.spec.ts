import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Esperar que un título "contenga" una subcadena.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Hacer clic en el enlace de empezar.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Esperar que la página tenga un encabezado con el nombre de Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
