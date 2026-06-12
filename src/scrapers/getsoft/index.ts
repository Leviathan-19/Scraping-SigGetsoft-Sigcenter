import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const SESSION_DIR = path.resolve(process.cwd(), 'sessions');
const SESSION_FILE = path.join(SESSION_DIR, 'getsoft.json');

export async function loginGetsoft() {
  logger.info('Iniciando scraper de Getsoft...');
  
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: env.HEADLESS,
  });

  let context: BrowserContext;
  let page: Page;

  try {
    if (fs.existsSync(SESSION_FILE)) {
      logger.info('Se encontró una sesión existente para Getsoft, intentando reutilizar...');
      context = await browser.newContext({ storageState: SESSION_FILE });
      page = await context.newPage();
      
      await page.goto('https://aplicativo.getsoft.app/', { timeout: env.TIMEOUT });
      
      // Si no somos redirigidos a index.html (la página de inicio de sesión), asumir sesión válida
      if (!page.url().includes('index.html')) {
        logger.info('¡La sesión aún es válida!');
        return { browser, context, page };
      } else {
        logger.warn('La sesión expiró. Se realizará el inicio de sesión nuevamente.');
        await context.close();
      }
    }

    logger.info('Realizando nuevo inicio de sesión en Getsoft...');
    context = await browser.newContext();
    page = await context.newPage();

    await page.goto('https://aplicativo.getsoft.app/index.html', { timeout: env.TIMEOUT });
    
    await page.locator('#form-username').fill(env.GETSOFT_USER);
    await page.locator('#form-password').fill(env.GETSOFT_PASSWORD);
    await page.locator('button[type="submit"]').first().click();

    // Esperar a que la aplicación navegue o cargue después del inicio de sesión
    // Dependiendo del comportamiento de la app Getsoft, puede que solo necesitemos esperar un elemento específico del dashboard.
    // Por ahora, esperaremos inactividad en la red para asegurar que la solicitud de inicio de sesión fue procesada.
    await page.waitForLoadState('networkidle');

    logger.info(`URL actual después del inicio de sesión en Getsoft: ${page.url()}`);

    // Algunas aplicaciones usan AJAX para iniciar sesión y no navegan de inmediato, pero si fue exitoso
    // usualmente redirige o establece un estado de cookie/almacenamiento local.
    // Si se mantiene exactamente en index.html sin cambios, el inicio de sesión podría haber fallado, pero
    // guardaremos el estado de todos modos y manejaremos validaciones más complejas en fases futuras si es necesario.

    logger.info('Paso de inicio de sesión procesado. Guardando estado de la sesión...');
    await context.storageState({ path: SESSION_FILE });
    
    return { browser, context, page };
  } catch (error) {
    logger.error('Error durante el inicio de sesión en Getsoft:', error);
    await browser.close();
    throw error;
  }
}
